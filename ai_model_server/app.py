import os
import re
import numpy as np
import yaml
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger, swag_from
from torch.nn.functional import softmax
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# =========================
# 1. CẤU HÌNH & KHỞI TẠO
# =========================
MODEL_PATH = os.getenv("MODEL_PATH", "./model")
CONF_PATH  = os.getenv("CONF_PATH", "./config.yaml")

def load_conf():
    defaults = {
        "labels": ["SẠCH", "CHỬI BỚI", "KÍCH ĐỘNG", "SPAM"],
        "thresholds": {"SẠCH": 0.70, "CHỬI BỚI": 0.55, "KÍCH ĐỘNG": 0.55, "SPAM": 0.60},
        "abstain_floor": 0.20,
        "temperature": 1.0
    }
    try:
        if os.path.exists(CONF_PATH):
            with open(CONF_PATH, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                # Update nested dicts cẩn thận
                if "thresholds" in data: defaults["thresholds"].update(data["thresholds"])
                if "labels" in data: defaults["labels"] = data["labels"]
                if "abstain_floor" in data: defaults["abstain_floor"] = data["abstain_floor"]
    except Exception as e:
        print(f"[WARN] Lỗi đọc config: {e}. Dùng mặc định.")
    return defaults

cfg = load_conf()
id2label = {i: l for i, l in enumerate(cfg["labels"])}

# Load Model
print(f"[INFO] Đang tải model từ: {MODEL_PATH}")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(DEVICE)
    print(f"[INFO] Model OK. Device: {DEVICE}")
except Exception as e:
    print(f"[CRITICAL] Không tải được model: {e}")
    tokenizer, model, DEVICE = None, None, "cpu"

# =========================
# 2. XỬ LÝ DỮ LIỆU
# =========================
def aggressive_clean(text: str) -> str:
    if not isinstance(text, str): return ""
    
    # QUAN TRỌNG: Không xóa Emoji nữa vì nó mang cảm xúc (🤬, 🖕)
    # text = emoji.replace_emoji(text, replace="") -> BỎ DÒNG NÀY
    
    # Chỉ xóa ký tự rác đặc biệt chèn giữa chữ
    text = re.sub(r'[~#*^]', '', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()

# =========================
# 3. API SERVER
# =========================
app = Flask(__name__)
CORS(app)
app.config["SWAGGER"] = {"title": "AI Comment Classifier", "uiversion": 3}
swagger = Swagger(app)

@app.post("/check-comment")
@swag_from({
    "tags": ["AI Inference"],
    "parameters": [{"name": "body", "in": "body", "required": True, 
                    "schema": {"type": "object", "properties": {"text": {"type": "string", "example": "Hàng như cc"}}}}],
    "responses": {200: {"description": "Kết quả"}}
})
def check_comment():
    if not model: return jsonify({"error": "Model not loaded"}), 500
    
    data = request.get_json(force=True, silent=True) or {}
    raw_text = str(data.get("text", "")).strip()
    if not raw_text: return jsonify({"error": "Empty text"}), 400

    clean_text = aggressive_clean(raw_text)
    inputs = tokenizer(clean_text, return_tensors="pt", truncation=True, max_length=128).to(DEVICE)
    
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = softmax(logits, dim=-1).cpu().numpy()[0]

    # Lấy Top 1
    pred_id = int(np.argmax(probs))
    confidence = float(probs[pred_id])
    pred_label = id2label.get(pred_id, "UNKNOWN")

    # Logic ngưỡng (Threshold logic)
    # Ưu tiên bắt nhãn xấu: Nếu nhãn xấu có điểm > ngưỡng thấp (VD: 0.3) là bắt luôn
    threshold = cfg["thresholds"].get(pred_label, 0.5)
    
    final_label = pred_label
    if confidence < cfg.get("abstain_floor", 0.3):
        final_label = "REVIEW"
    elif confidence < threshold:
        final_label = "REVIEW"

    return jsonify({
        "text": raw_text,
        "clean": clean_text,
        "label": final_label,
        "confidence": round(confidence, 4),
        "scores": {id2label[i]: round(float(p), 4) for i, p in enumerate(probs)}
    })

@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_PATH, "device": str(DEVICE)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))