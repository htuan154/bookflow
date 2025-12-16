# AI Comment Classifier (XLM-RoBERTa)

Hệ thống phân loại bình luận đa ngữ (Việt/Anh), tập trung vào phân tích ngữ nghĩa (Semantic Analysis) thay vì bắt từ khóa cứng.

## 1. Tính năng nổi bật
- **Hiểu ngữ nghĩa:** Phân biệt được "Con chó dễ thương" (SẠCH) và "Khôn như chó" (CHỬI BỚI).
- **Đa ngữ:** Hỗ trợ tốt cả tiếng Việt (có dấu/không dấu) và tiếng Anh.
- **Chống Spam/Rác:** Tự động làm sạch icon, teencode, ký tự lạ (`m~inh` -> `minh`) trước khi xử lý.
- **Không Hardcode:** Không dùng luật `if/else` cứng nhắc, hoàn toàn dựa vào Model AI đã train.

## 2. Nhãn phân loại
1. **SẠCH:** Bình luận tích cực, câu hỏi, góp ý bình thường.
2. **CHỬI BỚI:** Xúc phạm, thô tục, mỉa mai ác ý.
3. **KÍCH ĐỘNG:** Kêu gọi tẩy chay, bóc phốt, gây war.
4. **SPAM:** Quảng cáo, link rác, số điện thoại spam.

## 3. Cài đặt & Chạy Server

### Cách 1: Chạy trực tiếp (Python)
```bash
# Cài thư viện
pip install -r requirements.txt

# Chạy server
python app.py