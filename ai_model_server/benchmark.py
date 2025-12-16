import requests
import json
import csv
import time
from concurrent.futures import ThreadPoolExecutor
from collections import Counter

# =========================
# CẤU HÌNH (ĐÃ SỬA)
# =========================
API_URL = "http://localhost:5000/check-comment"

# 1. Đổi tên file đầu vào thành file 10k bạn vừa tạo
INPUT_FILE = "test_10k_unique.json" 

# 2. Đổi tên file lỗi để dễ phân biệt
OUTPUT_ERROR_FILE = "wrong_predictions_10k.csv"

# 3. Tăng tốc độ test (Số luồng chạy song song)
# - Nếu máy yếu: Để 10
# - Nếu máy khỏe: Để 50 hoặc 100 (Chạy vèo cái là xong)
MAX_WORKERS = 50 

def check_comment(item):
    """Gửi 1 request kiểm tra"""
    try:
        response = requests.post(API_URL, json={"text": item["text"]}, timeout=5)
        if response.status_code == 200:
            res_json = response.json()
            pred = res_json.get("classification")
            confidence = res_json.get("confidence")
            return {
                "text": item["text"],
                "expected": item["label"],
                "predicted": pred,
                "confidence": confidence,
                "is_correct": pred == item["label"]
            }
    except Exception:
        pass
    return None

def main():
    print(f"🚀 Đang tải dữ liệu từ {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            dataset = json.load(f)
    except FileNotFoundError:
        print(f"❌ LỖI: Không tìm thấy file '{INPUT_FILE}'. Hãy chạy gen_data_10k.py trước!")
        return
    
    total = len(dataset)
    print(f"⚡ Bắt đầu Benchmark {total} câu (với {MAX_WORKERS} luồng)...")
    print("⏳ Vui lòng chờ, quá trình này có thể mất vài phút...")
    
    results = []
    start_time = time.time()
    
    # Chạy đa luồng
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = list(executor.map(check_comment, dataset))
        
    for f in futures:
        if f: results.append(f)
            
    end_time = time.time()
    duration = end_time - start_time
    
    # --- THỐNG KÊ KẾT QUẢ ---
    if not results:
        print("❌ Lỗi: Không kết nối được đến Server hoặc Server bị quá tải.")
        return

    correct = sum(1 for r in results if r["is_correct"])
    accuracy = correct / len(results) * 100
    
    print("\n" + "="*50)
    print(f"📊 KẾT QUẢ BENCHMARK {total} CÂU (UNIQUE)")
    print("="*50)
    print(f"⏱️ Thời gian chạy: {duration:.2f}s (~{len(results)/duration:.0f} req/s)")
    print(f"✅ Chính xác: {correct}/{len(results)} ({accuracy:.2f}%)")
    
    # Ma trận nhầm lẫn đơn giản
    print("\nChi tiết lỗi sai (Expected -> Predicted):")
    wrong_cases = [r for r in results if not r["is_correct"]]
    
    error_patterns = Counter([f"{r['expected']} -> {r['predicted']}" for r in wrong_cases])
    for pattern, count in error_patterns.most_common(10): # Chỉ in Top 10 lỗi phổ biến nhất
        print(f"   ❌ {pattern}: {count} câu")

    # Lưu file các câu sai để Active Learning
    if wrong_cases:
        print(f"\n💾 Đang lưu {len(wrong_cases)} câu sai vào '{OUTPUT_ERROR_FILE}'...")
        with open(OUTPUT_ERROR_FILE, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["text", "expected_label", "model_predicted", "confidence"])
            for r in wrong_cases:
                writer.writerow([r["text"], r["expected"], r["predicted"], r["confidence"]])
        print("💡 TIP: Dùng file này để train lại (Fine-tune) đợt sau!")
    else:
        print("\n🎉 Tuyệt vời! Model đúng 100% trên tập test này.")

if __name__ == "__main__":
    main()