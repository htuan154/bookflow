import os
import re
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger, swag_from

import torch
from torch.nn.functional import softmax
import yaml
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# =========================
# Paths & config helpers
# =========================
MODEL_PATH = os.getenv("MODEL_PATH", "./model")
CONF_PATH  = os.getenv("CONF_PATH", "./config.yaml")

def load_conf():
    """Read YAML config with safe defaults."""
    defaults = {
        "labels": ["SẠCH","CHỬI BỚI","KÍCH ĐỘNG","SPAM"],
        "thresholds": { "SẠCH":0.55, "CHỬI BỚI":0.60, "KÍCH ĐỘNG":0.60, "SPAM":0.55 },
        "abstain_floor": 0.40,
        "temperature": 1.3,
        "features": {
            "use_phone_feature": True,
            "use_url_feature": True,
            "use_profanity_feature": True,
            "use_imperative_feature": True
        },
        # optional:
        # "remap": {"SẠCH":"CHỬI BỚI","CHỬI BỚI":"SẠCH"},
        # "force_if_profanity": "CHỬI BỚI"
    }
    try:
        if os.path.exists(CONF_PATH):
            with open(CONF_PATH, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
            for k, v in data.items():
                defaults[k] = v
    except Exception as e:
        print(f"[WARN] Cannot read config.yaml: {e}. Using defaults.")
    return defaults

cfg = load_conf()

# =========================
# Load model + tokenizer
# =========================
print(f"[INFO] Loading checkpoint: {MODEL_PATH}")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=False)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

# mapping từ checkpoint; nếu thiếu thì tạo theo config
id2label = getattr(model.config, "id2label", None)
label2id = getattr(model.config, "label2id", None)
if not id2label or not label2id:
    print("[WARN] Checkpoint lacks id2label/label2id. Falling back to config labels.")
    lbs = cfg.get("labels", [])
    id2label = {i: l for i, l in enumerate(lbs)}
    label2id = {l: i for i, l in enumerate(lbs)}

print("[INFO] id2label:", id2label)
print("[INFO] label2id:", label2id)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model.to(DEVICE)
print(f"[INFO] Device: {DEVICE}")

# =========================
# Flask + Swagger
# =========================
app = Flask(__name__)
CORS(app)
app.config["SWAGGER"] = {"title": "AI Comment Classifier", "uiversion": 3}
swagger = Swagger(app)

def preprocess_text(text: str) -> str:
    """
    Chuẩn hóa text trước khi phân loại:
    - Loại bỏ khoảng trắng thừa
    - Tự động thêm dấu chấm cuối câu nếu thiếu
    - Chuẩn hóa các ký tự đặc biệt
    """
    # Loại bỏ khoảng trắng thừa
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Nếu câu không kết thúc bằng dấu câu (. ! ? ...), tự động thêm dấu chấm
    if text and not re.search(r'[.!?…]$', text):
        text = text + '.'
    
    return text

def extract_features(text: str):
    """Light features for logging/analysis (not changing label unless you add a meta-classifier later)."""
    feats_cfg = cfg.get("features", {})
    has_phone = 1 if feats_cfg.get("use_phone_feature", True) and re.search(r"\b\d{9,11}\b", text) else 0
    has_url   = 1 if feats_cfg.get("use_url_feature", True)   and re.search(r"(http[s]?://|www\.)", text, re.I) else 0
    profane   = 1 if feats_cfg.get("use_profanity_feature", True) and re.search(r"(óc chó|đm|vcl|ngu|vãi chưởng)", text, re.I) else 0
    imperative= 1 if feats_cfg.get("use_imperative_feature", True) and re.search(r"(tẩy chay|đừng|không nên|report|lừa đảo)", text, re.I) else 0
    return {"has_phone": has_phone, "has_url": has_url, "profanity": profane, "imperative": imperative}

@app.get("/health")
def health():
    return jsonify({"ok": True, "model_path": MODEL_PATH, "config_path": CONF_PATH,
                    "labels": [id2label[i] for i in range(len(id2label))]})

@app.get("/labels")
def labels():
    return jsonify({"id2label": id2label, "label2id": label2id})

@app.post("/reload-config")
def reload_config():
    global cfg
    cfg = load_conf()
    return jsonify({"ok": True, "message": "reloaded", "cfg": cfg})

@swag_from({
    "tags": ["Classification"],
    "consumes": ["application/json"],
    "parameters": [{
        "name": "body", "in": "body",
        "schema": {"type": "object",
                   "properties": {"text": {"type": "string", "example": "Thằng viết bài này ngu vãi chưởng."}},
                   "required": ["text"]}
    }],
    "responses": {200: {"description": "Phân loại thành công",
                        "schema": {"type": "object",
                                   "properties": {
                                       "classification": {"type": "string", "example": "CHỬI BỚI"},
                                       "confidence": {"type": "number", "example": 0.8731},
                                       "top": {"type": "array",
                                               "items": {"type": "object",
                                                         "properties": {"label": {"type": "string"},
                                                                        "prob": {"type": "number"}}}},
                                       "features": {"type": "object",
                                                    "properties": {"has_phone":{"type":"integer"},
                                                                   "has_url":{"type":"integer"},
                                                                   "profanity":{"type":"integer"},
                                                                   "imperative":{"type":"integer"}}}
                                   }}}}
})
@app.post("/check-comment")
def check_comment():
    """Predict with temperature scaling + per-label thresholds + abstain (REVIEW)."""
    try:
        data = request.get_json(force=True, silent=False)
    except Exception:
        return jsonify({"error": "Body phải là JSON hợp lệ."}), 400
    if not data or "text" not in data:
        return jsonify({"error": "Request phải có {'text': ...}"}), 400

    text = str(data["text"]).strip()
    if not text:
        return jsonify({"error": "Text rỗng."}), 400

    # Chuẩn hóa text trước khi phân loại (thêm dấu chấm nếu thiếu)
    original_text = text
    text = preprocess_text(text)
    
    # temperature scaling
    T = float(cfg.get("temperature", 1.0))

    # tokenize & predict
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
    with torch.no_grad():
        logits = model(**inputs).logits / T

    probs = softmax(logits, dim=-1).squeeze(0).detach().cpu().tolist()
    pred_id = int(np.argmax(probs))
    pred_label = id2label.get(pred_id, str(pred_id))
    confidence = float(probs[pred_id])

    # thresholds + abstain
    thresholds = cfg.get("thresholds", {})
    t_label = float(thresholds.get(pred_label, 0.5))
    abstain_floor = float(cfg.get("abstain_floor", 0.4))
    final_label = pred_label if (confidence >= t_label and confidence >= abstain_floor) else "REVIEW"

    # --- Remap (fix label mapping at serve-time if checkpoint labels differ) ---
    remap = cfg.get("remap", {})
    final_label = remap.get(final_label, final_label)

    # --- Force label when profanity exists (prod safety switch) ---
    force_target = cfg.get("force_if_profanity", None)
    if force_target:
        if re.search(r"(óc chó|đm|vcl|ngu|vãi chưởng)", text, flags=re.IGNORECASE):
            final_label = force_target

    # top-k for debugging
    topk = sorted([(i, p) for i, p in enumerate(probs)], key=lambda x: x[1], reverse=True)
    topk = [{"label": id2label[i], "prob": round(float(p), 4)} for i, p in topk]

    return jsonify({
        "classification": final_label,
        "confidence": round(confidence, 4),
        "top": topk,
        "features": extract_features(text),
        "original_text": original_text,
        "preprocessed_text": text
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
