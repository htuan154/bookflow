# AI Comment Classifier (Tiếng Việt)

Microservice phân loại bình luận Tiếng Việt thành **4 nhãn**: `SẠCH`, `CHỬI BỚI`, `KÍCH ĐỘNG`, `SPAM`.
Fine-tune PhoBERT trên Colab, xuất checkpoint và phục vụ qua Flask + Swagger.

---

## 1. Kiến trúc nhanh

- **Model**: `vinai/phobert-base` fine-tune cho 4 lớp.
- **Huấn luyện**: notebook 11 cell (Colab) – có **checkpoint định kỳ** để dừng/tiếp tục.
- **Triển khai**: Flask API, Swagger UI; cấu hình runtime qua `config.yaml`.
- **An toàn**: thresholds theo nhãn + `abstain_floor` ⇒ có thể trả `REVIEW`.

---

## 2. Cài đặt & chạy API

### 2.1. Yêu cầu
- Python 3.10+ (khuyên 3.11)
- Cài thư viện:
  ```bash
  pip install -r requirements.txt
  ```

### 2.2. Chuẩn bị checkpoint
Giải nén model đã fine-tune vào `./model` (mặc định), hoặc đặt biến môi trường:

```bash
export MODEL_PATH=/path/to/checkpoint
export CONF_PATH=./config.yaml    # tuỳ chọn, nếu không sẽ dùng default
```

### 2.3. Chạy server
```bash
python app.py
# Mặc định http://localhost:5000
# Swagger UI: http://localhost:5000/apidocs
```

---

## 3. Cấu hình `config.yaml`

```yaml
labels: ["SẠCH","CHỬI BỚI","KÍCH ĐỘNG","SPAM"]

# Nhiệt độ (temperature scaling) để làm “mềm” xác suất
temperature: 1.3

# Ngưỡng theo từng nhãn (vượt ngưỡng + vượt abstain_floor mới chấp nhận)
thresholds:
  SẠCH: 0.55
  CHỬI BỚI: 0.60
  KÍCH ĐỘNG: 0.60
  SPAM: 0.55

# Nếu max-prob < abstain_floor → trả REVIEW
abstain_floor: 0.40

# Bật/tắt các feature logging
features:
  use_phone_feature: true
  use_url_feature: true
  use_profanity_feature: true
  use_imperative_feature: true

# Tuỳ chọn nâng cao:
# remap: {"SẠCH":"CHỬI BỚI"}            # remap label ở runtime
# force_if_profanity: "CHỬI BỚI"        # nếu phát hiện tục → ép nhãn này
```

**Thay đổi cấu hình tại runtime** (không restart):
```bash
curl -X POST http://localhost:5000/check-comment
```

---

## 4. Endpoints

- `GET /health` – thông tin model/config.
- `GET /labels` – mapping `id2label/label2id`.
- `POST /reload-config` – nạp lại config.
- `POST /check-comment` – phân loại bình luận.

**Body mẫu**:
```json
{ "text": "Thằng viết bài này ngu vãi chưởng." }
```

**Kết quả**:
```json
{
  "classification": "CHỬI BỚI",
  "confidence": 0.8731,
  "top": [
    {"label":"CHỬI BỚI","prob":0.8731},
    {"label":"KÍCH ĐỘNG","prob":0.0661},
    {"label":"SPAM","prob":0.0356},
    {"label":"SẠCH","prob":0.0252}
  ],
  "features": {"has_phone":0,"has_url":0,"profanity":1,"imperative":0}
}
```

---

## 5. Quy trình huấn luyện (tóm lược 11 cell)

1. **Cài thư viện** & kiểm tra version.
2. **Import + SEED**.
3. **Upload `training_data.csv`** (`text,label`).
4. **Chuẩn hóa nhãn** về 4 lớp + **vá nhãn hiển nhiên** (regex cho SPAM/tục/kêu gọi).
5. **Chia train/val/test** + **augment nhẹ** (bỏ dấu, chèn ký tự).
6. **Tokenize** (PhoBERT), tạo `datasets` với `ClassLabel`.
7. **Class weights** bằng `compute_class_weight`.
8. **PhoBERT + WeightedTrainer** + `TrainingArguments` (checkpoint theo bước, FP16…). 
9. **Train** với `resume_from_checkpoint=True` + lưu `val_metrics.json`, `training_log_history.csv`.
10. **Đánh giá test** + **Check 1000** (chỉ định `labels` và `zero_division=0` để tránh lỗi thiếu lớp).
11. **Manual-10 + hậu xử lý** (ngưỡng & rule lịch sự) → **xuất model** nếu đạt chuẩn.

> Có thể **dừng/tái chạy** giữa chừng. Chỉ cần giữ `output_dir` (mặc định `./results`) và gọi lại train với `resume_from_checkpoint=True`.

---

## 6. Test nhanh API

**Swagger**: mở `http://localhost:5000/apidocs` → `POST /check-comment` → dán JSON:
```json
{ "text": "Zalo 0912345678 đặt tour giá rẻ, ib ngay!" }
```

**cURL**:
```bash
curl -X POST http://localhost:5000/check-comment   -H "Content-Type: application/json"   -d '{"text":"Mọi người đừng đặt chỗ này, lừa đảo đó!"}'
```

---

## 7. Mẹo vận hành

- Điều chỉnh **temperature** và **thresholds** để cân bằng recall/precision.
- Dùng **abstain_floor** để an toàn: nghi ngờ thì trả `REVIEW`.
- Bật `force_if_profanity` để siết chặt CHỬI BỚI trong production.
- Thay đổi cấu hình → `POST /reload-config`.

---

## 8. Bản quyền & Ghi công

- PhoBERT thuộc VinAI (tuân thủ license tương ứng).
- Thư viện: PyTorch, Transformers, Flasgger, Flask, v.v.
