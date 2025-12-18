import json
import random

# ==============================================================================
# 1. KHO TỪ VỰNG KHỔNG LỒ (MỞ RỘNG ĐỂ ĐỦ SINH 10K CÂU)
# ==============================================================================

# --- NHÓM TÍCH CỰC (SẠCH) ---
subjects_good = [
    "Khách sạn", "Resort", "Homestay", "Phòng ốc", "Nhân viên", "Dịch vụ", "View", "Đồ ăn", "Bể bơi", "Chủ quán",
    "Không gian", "Trải nghiệm", "Mọi thứ", "Bữa sáng", "Thái độ phục vụ", "Vị trí", "Tiện nghi", "Giường", "Nhà vệ sinh",
    "Cách bài trí", "Anh chủ", "Chị lễ tân", "Bác bảo vệ", "Cô lao công", "Wifi", "Điều hòa", "Nước nóng", "Ban công"
]
verbs_good = [
    "rất", "khá", "cực kỳ", "thực sự", "hơi bị", "quá là", "vô cùng", "siêu", "phải nói là", "đặc biệt", 
    "tương đối", "cảm thấy", "thấy", "nhìn", "trông"
]
adjs_good = [
    "tốt", "sạch sẽ", "thơm tho", "nhiệt tình", "chu đáo", "đẹp", "ngon", "xịn sò", "đáng tiền", "tuyệt vời",
    "ok", "ổn áp", "hài lòng", "xuất sắc", "đẳng cấp", "chill", "lung linh", "sang chảnh", "thân thiện", "dễ thương",
    "chuyên nghiệp", "tận tâm", "yên tĩnh", "thoáng mát", "rộng rãi", "tiện lợi", "ấm cúng", "nhanh nhẹn"
]
adjs_good_dog = ["dễ thương", "đáng yêu", "ngoan", "quấn người", "thông minh", "lanh lợi", "hiền khô", "cưng xỉu"]
endings_good = [".", "!", " nhé", " ạ", " nha", " hihi", " :))", " <3", " ^^", " lắm luôn", " thực sự"]

# --- NHÓM TIÊU CỰC (CHỬI BỚI/CHÊ) ---
subjects_bad = [
    "Khách sạn", "Quán này", "Phục vụ", "Lễ tân", "Chủ shop", "Wifi", "Điều hòa", "Nhà vệ sinh", "Món ăn", "Thái độ",
    "Cách làm ăn", "Dịch vụ", "Cái chỗ này", "Bọn nhân viên", "Thằng quản lý", "Con mụ chủ", "Hệ thống", "CSKH", "Ship hàng"
]
verbs_bad = [
    "như", "tệ như", "ngu như", "chán như", "dở như", "thối như", "bẩn như", "nhìn như", "làm ăn như", "phục vụ như"
]
objects_bad = [
    "hạch", "cứt", "shit", "bò", "chó", "lợn", "cc", "đầu bùi", "quần què", "bẹn", "l*n", "c*c", "đống phân", "rác rưởi"
]
profanities = [
    "đm", "vcl", "đéo", "mẹ kiếp", "ngu vãi", "óc chó", "bố láo", "mất dạy", "tiên sư", "tổ cha", "chó chết", "khốn nạn"
]
adjs_bad_direct = [
    "như hạch", "như lồn", "như cặc", "vãi đái", "thối hoắc", "dơ dáy", "bẩn thỉu", "láo toét", "chảnh chó", "hãm lờ"
]

# --- NHÓM KÍCH ĐỘNG ---
scam_verbs = [
    "lừa đảo", "treo đầu dê bán thịt chó", "làm ăn bố láo", "tránh xa", "tẩy chay", "bóc phốt", "đừng mua", "gian dối",
    "cạch mặt", "report", "báo công an", "kiện", "đòi lại tiền", "cẩn thận bị lừa", "dối trá"
]
targets = ["bọn này", "quán này", "shop này", "chỗ này", "cái bọn lừa đảo này", "lũ khốn này"]

# --- NHÓM SPAM ---
spam_intros = ["Liên hệ", "Alo", "Ib ngay", "Nhắn tin", "Call", "Zalo", "Hotline", "Tư vấn", "Hỗ trợ"]
spam_purposes = ["tài chính", "vay vốn", "kèo bóng", "lô đề", "sinh lý", "nhận thưởng", "việc nhẹ lương cao", "chứng khoán"]

# ==============================================================================
# 2. HÀM SINH DATA VỚI KIỂM TRA TRÙNG LẶP
# ==============================================================================
data_list = []
generated_texts = set() # Set dùng để kiểm tra trùng lặp cực nhanh

def add_data(text, label):
    """Chỉ thêm nếu câu chưa tồn tại trong set"""
    if text not in generated_texts:
        generated_texts.add(text)
        data_list.append({"text": text, "label": label})
        return True
    return False

print("🚀 Đang sinh 10.000 câu duy nhất (Unique)...")

# --- VÒNG LẶP SINH DỮ LIỆU ĐẾN KHI ĐỦ ---
# Tỷ lệ mong muốn: 40% SẠCH, 30% CHỬI, 15% KÍCH ĐỘNG, 15% SPAM
target_counts = {
    "SẠCH": 4000,
    "CHỬI BỚI": 3000,
    "KÍCH ĐỘNG": 1500,
    "SPAM": 1500
}

# 1. SINH SẠCH (4000 câu)
count = 0
attempts = 0 # Đếm số lần thử để tránh lặp vô tận nếu hết từ
while count < target_counts["SẠCH"]:
    # Template 1: Subject + Verb + Adj
    t1 = f"{random.choice(subjects_good)} {random.choice(verbs_good)} {random.choice(adjs_good)}{random.choice(endings_good)}"
    # Template 2: Câu hỏi
    t2 = f"{random.choice(['Cho mình hỏi', 'Ad ơi', 'Shop ơi', 'Mọi người ơi'])} {random.choice(['giá bao nhiêu', 'còn phòng không', 'có ship không', 'mấy giờ mở cửa', 'có chỗ đậu xe không'])}?"
    # Template 3: Khen pet
    t3 = f"Con {random.choice(['chó', 'mèo', 'cún'])} {random.choice(['nhà này', 'của chủ quán'])} {random.choice(adjs_good_dog)} {random.choice(['quá', 'ghê', 'lắm'])}"
    
    # Chọn ngẫu nhiên template
    text = random.choice([t1, t1, t1, t2, t3]) # Ưu tiên t1 nhiều hơn
    
    if add_data(text, "SẠCH"):
        count += 1
    
    attempts += 1
    if attempts > 200000: break # Safety break

# 2. SINH CHỬI BỚI (3000 câu)
count = 0
attempts = 0
while count < target_counts["CHỬI BỚI"]:
    # Template 1: So sánh
    t1 = f"{random.choice(subjects_bad)} {random.choice(verbs_bad)} {random.choice(objects_bad)}"
    # Template 2: Chửi thẳng
    t2 = f"{random.choice(profanities)} {random.choice(subjects_bad)} {random.choice(['làm ăn chán đời', 'ngu không tả được', 'biến đi', 'dẹp tiệm đi'])}"
    # Template 3: Tính từ bậy
    t3 = f"{random.choice(subjects_bad)} {random.choice(adjs_bad_direct)}"
    
    text = random.choice([t1, t2, t3])
    if add_data(text, "CHỬI BỚI"):
        count += 1
    attempts += 1
    if attempts > 200000: break

# 3. SINH KÍCH ĐỘNG (1500 câu)
count = 0
attempts = 0
while count < target_counts["KÍCH ĐỘNG"]:
    t1 = f"Mọi người {random.choice(scam_verbs)} cái {random.choice(targets)} nhé"
    t2 = f"{random.choice(['Anh em', 'Các bạn', 'Cả nhà'])} {random.choice(['tránh xa', 'đừng bao giờ đến', 'tẩy chay gấp'])} {random.choice(targets)}"
    t3 = f"{random.choice(subjects_bad)} {random.choice(['lừa đảo', 'tráo trở', 'gian manh'])}, {random.choice(scam_verbs)} ngay"
    
    text = random.choice([t1, t2, t3])
    if add_data(text, "KÍCH ĐỘNG"):
        count += 1
    attempts += 1
    if attempts > 100000: break

# 4. SINH SPAM (1500 câu)
count = 0
attempts = 0
while count < target_counts["SPAM"]:
    phone = f"0{random.randint(3,9)}{random.randint(10000000, 99999999)}"
    link = f"http://{random.choice(['bet', 'soicau', 'vay', 'sex'])}{random.randint(10,99)}.com"
    
    t1 = f"{random.choice(spam_intros)} {phone} để {random.choice(['nhận quà', 'vay vốn', 'tư vấn', 'kết bạn'])}"
    t2 = f"Truy cập {link} {random.choice(['nhận 100k', 'xem hàng', 'nhận khuyến mãi'])}"
    t3 = f"Tuyển dụng {random.choice(['việc nhẹ', 'làm online'])}, ib zalo {phone}"
    
    text = random.choice([t1, t2, t3])
    if add_data(text, "SPAM"):
        count += 1
    attempts += 1
    if attempts > 100000: break

# Trộn lần cuối
random.shuffle(data_list)

# Lưu file
filename = "test_10k_unique.json"
with open(filename, "w", encoding="utf-8") as f:
    json.dump(data_list, f, ensure_ascii=False, indent=2)

print(f"\n✅ Đã tạo xong file '{filename}'")
print(f"📊 Tổng số câu: {len(data_list)}")
print(f"🔒 Đảm bảo không trùng lặp (Unique): {len(data_list) == len(set(d['text'] for d in data_list))}") # Check lại lần cuối
print("👉 Bạn hãy dùng file này chạy với benchmark.py nhé!")