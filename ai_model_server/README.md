=== TỔNG QUAN HỆ THỐNG ===

[MODEL 4 NHÃN]
Một mô hình đọc bình luận tiếng Việt và phân loại vào 1 trong 4 nhãn:
- SẠCH (bình thường)
- CHỬI BỚI
- KÍCH ĐỘNG (kêu gọi tẩy chay, bóc phốt…)
- SPAM (sđt, link, ib, sale…)

[SERVER API]
Một server API (Flask) nhận câu đầu vào, trả về:
- classification: nhãn dự đoán
- confidence: độ tự tin
- top: danh sách xác suất theo từng nhãn
- features: cờ nhận diện (có sđt, url, tục, kêu gọi) để tham khảo
Có sẵn Swagger UI để test nhanh.

------------------------------------------------------------

=== QUY TRÌNH HUẤN LUYỆN (11 CELL) ===
Cell 0 – CÀI THƯ VIỆN
- Cài transformers, datasets, evaluate, torch… và in phiên bản để tái lập môi trường.

Cell 1 – IMPORT & SEED
- Import thư viện, đặt SEED cho random/NumPy/PyTorch (tái hiện kết quả tốt hơn).

Cell 2 – TẢI CSV
- Upload `training_data.csv` với 2 cột: text, label; làm sạch khoảng trắng.

Cell 3 – CHUẨN HÓA & VÁ NHÃN
- Chuẩn hóa nhãn về 4 lớp (SẠCH|CHỬI BỚI|KÍCH ĐỘNG|SPAM).
- Rule hiển nhiên:
  + có sđt/link/“ib/sale/…” → SPAM
  + có từ tục → CHỬI BỚI
  + “tẩy chay/đừng mua/bóc phốt/…” → KÍCH ĐỘNG
- Loại trùng (text,label) và giữ đúng 4 lớp.

Cell 4 – CHIA TẬP & AUGMENT
- Chia train/val/test (stratify).
- Augment nhẹ: bỏ dấu + chèn ký tự để mô phỏng kiểu viết “né lọc”.

Cell 5 – TOKENIZE & DATASETS
- Tokenize (PhoBERT), max_length=128, padding=max_length.
- Ép nhãn về ClassLabel để giữ đúng thứ tự tên lớp.

Cell 6 – CLASS WEIGHTS
- Tính trọng số lớp (giảm lệch phân bố), dùng trong cross-entropy.

Cell 7 – MODEL + TRAINER (RESUME-FRIENDLY)
- PhoBERT `AutoModelForSequenceClassification(num_labels=4)`.
- WeightedTrainer override `compute_loss`.
- TrainingArguments:
  + evaluation_strategy="steps", save_strategy="steps" (thường 1000 bước)
  + save_total_limit=3, load_best_model_at_end=True (metric=f1_macro)
  + fp16 nếu GPU hỗ trợ, gradient_accumulation_steps nếu VRAM ít
→ Có checkpoint định kỳ, cho phép dừng/tiếp tục huấn luyện.

Cell 8 – TRAIN & VAL
- `trainer.train(resume_from_checkpoint=True)` → có checkpoint thì nối tiếp, không có thì train mới.
- Evaluate val; lưu `val_metrics.json` và (tuỳ chọn) `training_log_history.csv`.

Cell 9 – TEST OVERALL & CHECK 1000
- In classification_report + confusion_matrix trên test.
- Lấy ngẫu nhiên 1000 mẫu test để đo Accuracy/F1 @1000 và so lệch với overall.
- Dùng `labels` + `zero_division=0` để tránh lỗi khi mẫu 1000 thiếu lớp.

Cell 10 – MANUAL-10 (HẬU XỬ LÝ)
- Test 10 câu “đời thường”.
- Hậu xử lý:
  + Rule “cứng” (sđt/link/tục/kêu gọi) → gán nhãn trực tiếp
  + Ưu tiên SẠCH cho câu hỏi/lịch sự (nếu không có dấu hiệu xấu)
  + Ngưỡng tự tin tổng & theo nhãn (siết KÍCH ĐỘNG hoặc SPAM nếu muốn)

Cell 11 – LƯU MODEL (GATE)
- Chỉ lưu/zip model khi đạt chuẩn (ví dụ Manual-10 ≥ 90%).
- Nếu chưa đạt, không xuất model (tránh đưa model chưa tốt vào production).

------------------------------------------------------------

=== CƠ CHẾ QUYẾT ĐỊNH CỦA API /check-comment ===
1) Kiểm tra nhanh bằng regex:
   - sđt/url/“ib/sale/…” → nghiêng SPAM
   - tục → nghiêng CHỬI BỚI
   - “tẩy chay/đừng mua/bóc phốt/…” → nghiêng KÍCH ĐỘNG
2) Nếu chưa dính rule, đưa vào model → logits → temperature scaling → softmax.
3) Lấy nhãn có xác suất cao nhất; so với threshold theo nhãn + abstain_floor:
   - nếu không đủ tự tin → trả REVIEW (hoặc SẠCH, tùy cấu hình)
   - nếu đủ → trả nhãn top-1
4) Trả JSON: classification, confidence, top (xác suất từng nhãn), features (cờ regex).

------------------------------------------------------------

=== ENDPOINT & TEST NHANH ===
- Swagger UI: http://localhost:5000/apidocs
- POST /check-comment
  Body: { "text": "…" }

Ví dụ:
curl -X POST "http://127.0.0.1:5000/check-comment" \
  -H "accept: application/json" -H "Content-Type: application/json" \
  -d '{ "text": "Zalo 0912345678 đặt tour giá rẻ, ib ngay!" }'

------------------------------------------------------------

=== LƯU Ý VẬN HÀNH ===
- Có thể dừng giữa chừng (mất mạng/sleep). Khi quay lại:
  + Nếu runtime còn sống: chạy lại Cell 8 để tiếp tục.
  + Nếu runtime reset: chạy Cell 0→7 để tạo Trainer rồi chạy Cell 8 (resume).
- Điều chỉnh “độ khắt khe”:
  + Tăng/giảm temperature, thresholds (per-label), abstain_floor.
  + Bật force_if_profanity để câu có tục luôn là CHỬI BỚI.
- Nếu nhầm SẠCH→KÍCH ĐỘNG ở câu hỏi/lịch sự: siết THRESH["KÍCH ĐỘNG"] và ưu tiên SẠCH cho QUESTION/POLITE.
