import requests
import json
import csv
import time
from concurrent.futures import ThreadPoolExecutor
from collections import Counter

# =========================
# CẤU HÌNH
# =========================
API_URL = "http://localhost:5000/check-comment"
INPUT_FILE = "test_10k_unique.json" 
OUTPUT_ERROR_FILE = "wrong_predictions_10k.csv"
MAX_WORKERS = 50 

def check_comment(item):
    """Gửi 1 request kiểm tra"""
    try:
        response = requests.post(API_URL, json={"text": item["text"]}, timeout=5)
        if response.status_code == 200:
            res_json = response.json()
            
            # === SỬA LỖI Ở ĐÂY (classification -> label) ===
            pred = res_json.get("label") 
            # ===============================================
            
            confidence = res_json.get("confidence")
            return {
                "text": item["text"],
                "expected": item["label"],
                "predicted": pred,
                "confidence": confidence,
                "is_correct": pred == item["label"]
            }
        else:
            return {"is_correct": False, "expected": item["label"], "predicted": f"Error {response.status_code}", "text": item["text"]}
    except Exception as e:
        return {"is_correct": False, "expected": item["label"], "predicted": "Error Connection", "text": item["text"]}

def run_benchmark():
    print(f"🚀 Đang tải dữ liệu từ {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Không tìm thấy file dữ liệu!")
        return

    print(f"⚡ Bắt đầu Benchmark {len(data)} câu (với {MAX_WORKERS} luồng)...")
    print("⏳ Vui lòng chờ, quá trình này có thể mất vài phút...")
    
    start_time = time.time()
    
    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = list(executor.map(check_comment, data))

    duration = time.time() - start_time
    
    if not results:
        print("❌ Không có kết quả nào trả về. Kiểm tra lại Server.")
        return

    # Lọc bỏ các request lỗi kết nối để tính chính xác thực tế
    valid_results = [r for r in results if r["predicted"] not in ["Error Connection", None]]
    total = len(valid_results)
    
    if total == 0:
         print("❌ Toàn bộ request bị lỗi kết nối hoặc trả về None!")
         return

    correct = sum(1 for r in valid_results if r["is_correct"])
    accuracy = correct / total * 100
    
    print("\n" + "="*50)
    print(f"📊 KẾT QUẢ BENCHMARK {total} CÂU (VALID)")
    print("="*50)
    print(f"⏱️ Thời gian chạy: {duration:.2f}s (~{len(results)/duration:.0f} req/s)")
    print(f"✅ Chính xác: {correct}/{total} ({accuracy:.2f}%)")
    
    print("\nChi tiết lỗi sai (Expected -> Predicted):")
    wrong_cases = [r for r in valid_results if not r["is_correct"]]
    
    error_patterns = Counter([f"{r['expected']} -> {r['predicted']}" for r in wrong_cases])
    for pattern, count in error_patterns.most_common(10):
        print(f"   ❌ {pattern}: {count} câu")

    if wrong_cases:
        print(f"\n💾 Đang lưu {len(wrong_cases)} câu sai vào '{OUTPUT_ERROR_FILE}'...")
        with open(OUTPUT_ERROR_FILE, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["text", "expected_label", "model_predicted", "confidence"])
            for r in wrong_cases:
                writer.writerow([r["text"], r["expected"], r["predicted"], r.get("confidence", 0)])
        print("💡 TIP: Dùng file này để train lại (Fine-tune) đợt sau!")

if __name__ == "__main__":
    run_benchmark()