# app.py
from flask import Flask, request, jsonify
from flasgger import Swagger
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os

# ---- CẤU HÌNH ----
MODEL_PATH = "./model" 
id2label = {
    0: "SẠCH",
    1: "CHỬI BỚI",
    2: "KÍCH ĐỘNG",
    3: "SPAM"
}

# ---- KHỞI TẠO ----
app = Flask(__name__)
swagger = Swagger(app)

# --- (Phần code tải model giữ nguyên) ---
print("--- KHỞI ĐỘNG SERVER AI ---")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    print(">>> Model đã sẵn sàng! Server đang chạy trên cổng 5000 <<<")
except Exception as e:
    tokenizer = None
    model = None

# ---- API ENDPOINT ----
@app.route('/check-comment', methods=['POST'])
def check_comment():
    """
    Phân loại nội dung một bình luận
    ---
    tags:
      - AI Moderation
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        description: Nội dung bình luận cần được phân loại.
        required: true
        schema:
          type: object
          required:
            - text
          properties:
            text:
              type: string
              example: "bài viết này quá tuyệt vời"
    responses:
      200:
        description: Phân loại thành công.
        schema:
          type: object
          properties:
            classification:
              type: string
              example: "SẠCH"
    """
    # --- PHẦN LOGIC BÊN DƯỚI GIỮ NGUYÊN ---
    if not model or not tokenizer:
        return jsonify({"error": "Model chưa được tải hoặc bị lỗi, hãy kiểm tra console."}), 500

    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Request phải có dạng JSON với key là 'text'"}), 400
        
        text_to_check = data['text']
        inputs = tokenizer(text_to_check, return_tensors="pt", truncation=True, max_length=256)

        with torch.no_grad():
            logits = model(**inputs).logits
        
        predicted_class_id = logits.argmax().item()
        classification = id2label.get(predicted_class_id, "KHÔNG_XÁC_ĐỊNH")

        return jsonify({"classification": classification})

    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

# ---- CHẠY SERVER ----
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)