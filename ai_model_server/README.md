# API Phân Loại Bình Luận Tiếng Việt (PhoBERT)

Microservice Flask phân loại bình luận tiếng Việt vào 4 nhãn: **SẠCH**, **CHỬI BỚI**, **KÍCH ĐỘNG**, **SPAM**.  
Mô hình sử dụng **PhoBERT** fine-tune trên dữ liệu của bạn, có cơ chế **temperature scaling**, **ngưỡng theo nhãn**, và **chế độ REVIEW** để “nhịn” các ca không chắc chắn. API có sẵn **Swagger UI** để test nhanh.

---

## 1) Yêu cầu hệ thống & cài đặt

### 1.1. Python & thư viện
- Python 3.10+ (khuyến nghị 3.11).
- Tạo virtualenv và cài dependencies:
  ```bash
  # Windows (PowerShell)
  py -m venv venv
  .\venv\Scripts\Activate.ps1

  # macOS/Linux
  python3 -m venv venv
  source venv/bin/activate

  # Cài đặt
  pip install -r requirements.txt
  ```

### 1.2. Cấu trúc thư mục đề xuất
```
ai_model_server/
├── app.py
├── config.yaml               # (tuỳ chọn) cấu hình serve-time
├── requirements.txt
└── model/                    # đặt model đã fine-tune từ Colab vào đây
    ├── config.json
    ├── tokenizer_config.json
    ├── special_tokens_map.json
    ├── vocab.txt / bpe.codes / tokenizer.json
    └── model.safetensors
```

---

## 2) Các endpoint & biến môi trường

### 2.1. Endpoint
- `GET /health` — kiểm tra sống/chết & trả về danh sách nhãn đang dùng.  
- `GET /labels` — trả về `id2label`, `label2id` của checkpoint.  
- `POST /reload-config` — reload lại `config.yaml` trên đĩa (không cần restart).  
- `POST /check-comment` — phân loại 1 comment (JSON `{"text": "..."}`) với temperature & thresholds.

### 2.2. Biến môi trường
- `MODEL_PATH` (default `./model`) — thư mục chứa checkpoint đã fine-tune (từ Colab).  
- `CONF_PATH`  (default `./config.yaml`) — đường dẫn đến file cấu hình serve-time.

---

## 3) Chạy server API

1) Đảm bảo đã **kích hoạt venv** và **cài xong** `requirements.txt`.  
2) Giải nén model xuất từ Colab rồi **copy toàn bộ** vào thư mục `./model`.  
3) (Tuỳ chọn) Tạo/cập nhật `config.yaml` (xem mục 5).  
4) Chạy server:
   ```bash
   # Windows
   py app.py

   # macOS/Linux
   python app.py
   ```
5) Mở **Swagger UI**: `http://localhost:5000/apidocs` để test.  
   Hoặc dùng `curl`:
   ```bash
   curl -X POST http://localhost:5000/check-comment \
        -H "Content-Type: application/json" \
        -d '{"text":"Khách sạn này có gần biển không?"}'
   ```

---

## 4) Quy trình train lại trên Google Colab

Notebook Colab gồm: cài lib cố định version, làm sạch/“vá” dữ liệu, split train/val/test, class-weights, train PhoBERT, test 10 câu thủ công (gating ≥ 90%), và **chỉ cho tải model nếu qua cổng**.

### 4.1. Chuẩn bị dữ liệu (CSV)
- Định dạng đúng **2 cột**: `text,label`.  
- Nhãn phải thuộc 4 lớp: **SẠCH**, **CHỬI BỚI**, **KÍCH ĐỘNG**, **SPAM**.  
- Bước “vá dữ liệu” trong notebook sẽ:
  - Chuẩn hoá nhãn (map các biến thể như `sach/clean/neutral → SẠCH`, `chui boi/toxic → CHỬI BỚI`…).  
  - Rule an toàn để **flip nhãn hiển nhiên** (ví dụ `lừa đảo/tẩy chay → KÍCH ĐỘNG`, có số/URL/Zalo → **SPAM**, chửi thề → **CHỬI BỚI**).  
  - Bỏ bản ghi rỗng, chuẩn hoá khoảng trắng, **khử trùng lặp** cặp `(text,label)`.

> Lưu ý: Vì lọc trùng lặp và chỉ giữ 4 nhãn chuẩn, tổng dòng có thể **giảm** (ví dụ từ 10k xuống ~2k nếu dữ liệu nhiều trùng/không đúng định dạng). Đây là mong đợi.

### 4.2. Huấn luyện
- Cố định versions: `transformers==4.44.2`, `datasets>=2.19.0`, `accelerate>=0.33.0`, `evaluate>=0.4.2`, `scikit-learn>=1.3`, `torch>=2.1`.  
- Tokenize (PhoBERT), build `Dataset`, ép `labels` → `ClassLabel` để **khẳng định** bài toán **single-label**.  
- **Class weights** giảm lệch lớp.  
- **Trainer** (CrossEntropy có weights), `evaluation_strategy="epoch"`, có thể bật `EarlyStopping(patience=2)`.  
- Sau train: Evaluate trên `val/test`, in `classification_report`.  
- **Manual-10 Gate**: Chạy 10 câu kiểm thử thủ công đa dạng; **chỉ zip & cho download** khi accuracy ≥ 90%.

### 4.3. Xuất model
- Khi qua “cổng 10 câu”, notebook `save_model` vào `./my_finetuned_model` và zip `my_finetuned_model.zip` để tải xuống.  
- Giải nén vào `./model` của server.

---

## 5) Cấu hình `config.yaml` (serve-time)

Ví dụ:
```yaml
labels: ["SẠCH","CHỬI BỚI","KÍCH ĐỘNG","SPAM"]

thresholds:
  "SẠCH": 0.55
  "CHỬI BỚI": 0.60
  "KÍCH ĐỘNG": 0.60
  "SPAM": 0.55

abstain_floor: 0.40
temperature: 1.3

features:
  use_phone_feature: true
  use_url_feature: true
  use_profanity_feature: true
  use_imperative_feature: true

# Nâng cao (tuỳ chọn):
# remap: {"SẠCH":"CHỬI BỚI"}             # map nhãn ở serve-time nếu checkpoint/mapping lệch
# force_if_profanity: "CHỬI BỚI"         # nếu phát hiện profanity -> ép thành CHỬI BỚI
```

Server đọc file này khi khởi động, có thể **reload động** qua `POST /reload-config`.

---

## 6) Ví dụ kết quả API

**Request**
```json
{ "text": "Thằng viết bài này ngu vãi chưởng." }
```

**Response**
```json
{
  "classification": "CHỬI BỚI",
  "confidence": 0.98,
  "top": [
    {"label": "CHỬI BỚI", "prob": 0.98},
    {"label": "KÍCH ĐỘNG", "prob": 0.01},
    {"label": "SPAM",      "prob": 0.005},
    {"label": "SẠCH",      "prob": 0.005}
  ],
  "features": {
    "has_phone": 0,
    "has_url": 0,
    "profanity": 1,
    "imperative": 0
  }
}
```

Giải thích:
- **classification**: nhãn cuối cùng sau khi áp **temperature** → **softmax** → so với **thresholds** + **abstain_floor**.  
- **confidence**: xác suất của nhãn thắng.  
- **top**: thứ hạng xác suất tất cả nhãn (debug).  
- **features**: cờ đơn giản (số điện thoại/URL/từ chửi/kêu gọi hành động), chỉ để logging—không ép nhãn trừ khi bật `force_if_profanity`.

---

## 7) Lưu đồ quyết định tại `/check-comment`

1) Nhận `text` → validate, chuẩn hoá.  
2) **Tokenize** → **logits** từ model (GPU nếu sẵn).  
3) Chia logits cho `temperature` → **softmax** để ra xác suất.  
4) Lấy nhãn thắng và xác suất `confidence`.  
5) So sánh với `thresholds[pred]` **và** `abstain_floor`:
   - Nếu **không qua ngưỡng**: trả **`REVIEW`**.  
   - Nếu bật `force_if_profanity` và phát hiện “profanity”: ép về nhãn chỉ định.  
6) Trả JSON gồm `classification`, `confidence`, `top`, `features`.

---

## 8) Xử lý lỗi thường gặp

- **ModuleNotFoundError: flask_cors** → `pip install -r requirements.txt` (đảm bảo đã kích hoạt đúng venv).  
- **Device mismatch (CPU/GPU)** ở test thủ công: đưa **model + input** về cùng device:
  ```python
  device = "cuda" if torch.cuda.is_available() else "cpu"
  model.to(device)
  inputs = {k: v.to(device) for k,v in tokenizer(text, return_tensors="pt").items()}
  ```
- **Train dừng ở epoch 3/5**: do `EarlyStopping(patience=2)`. Muốn chạy đủ 5 epoch → bỏ callback.  
- **Val/Test = 1.0**: dữ liệu nhỏ & dễ; để thực tế hơn, tăng độ khó test, đổi seed, hoặc thêm near-duplicate filter.

---

## 9) Mẹo đạt ≥ 90% ở “Manual-10 Gate”

- Dữ liệu gốc **đúng nhãn**, đặc biệt các câu như “lừa đảo/đừng đặt/tẩy chay…” → **KÍCH ĐỘNG**, có số/URL/Zalo → **SPAM**, chửi thề → **CHỬI BỚI**.  
- **Class-weights** + (tuỳ chọn) **oversample** lớp hiếm.  
- Augment “nhẹ”: bỏ dấu + chèn ký tự để chống né (s.p.a.m, đ*ng…).  
- Tăng `num_train_epochs`, hoặc điều chỉnh `thresholds`/`temperature` khi deploy.

---

## 10) Ghi chú

- Khi đổi checkpoint, luôn kiểm tra `id2label/label2id` trong model và danh sách `labels` trong `config.yaml` để đảm bảo **cùng thứ tự**: `["SẠCH","CHỬI BỚI","KÍCH ĐỘNG","SPAM"]`.  
- Có thể thêm `/labels` để debug mapping nhanh trước khi dùng `/check-comment`.
