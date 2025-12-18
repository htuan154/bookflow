import requests
import json
import time
from concurrent.futures import ThreadPoolExecutor
from collections import Counter

# =========================
# CẤU HÌNH
# =========================
API_URL = "http://localhost:5000/check-comment"
INPUT_FILE = "data/output_data_nimo_thaygiaoba.json"
OUTPUT_RESULT_FILE = "data/result_nimo_thaygiaoba.json"
OUTPUT_STATS_FILE = "data/stats_nimo_thaygiaoba.json"
MAX_WORKERS = 50

def check_comment_api(item):
    """Gửi 1 request kiểm tra và trả về kết quả"""
    try:
        response = requests.post(API_URL, json={"text": item["Text"]}, timeout=10)
        if response.status_code == 200:
            res_json = response.json()
            label = res_json.get("label", "ERROR")
            confidence = res_json.get("confidence", 0)
            
            return {
                "text": item["Text"],
                "label": label,
                "confidence": confidence
            }
        else:
            return {
                "text": item["Text"],
                "label": f"HTTP_ERROR_{response.status_code}",
                "confidence": 0
            }
    except Exception as e:
        return {
            "text": item["Text"],
            "label": "CONNECTION_ERROR",
            "confidence": 0
        }

def run_test():
    """Chạy test và tạo thống kê"""
    print(f"🚀 Đang tải dữ liệu từ {INPUT_FILE}...")
    
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file: {INPUT_FILE}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Lỗi đọc JSON: {e}")
        return
    
    total_items = len(data)
    print(f"📊 Tổng số comment cần test: {total_items}")
    print(f"⚡ Bắt đầu gọi API với {MAX_WORKERS} luồng...")
    print("⏳ Vui lòng chờ, quá trình này có thể mất vài phút...\n")
    
    start_time = time.time()
    
    # Gọi API song song
    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = list(executor.map(check_comment_api, data))
    
    duration = time.time() - start_time
    
    # Lưu kết quả vào file JSON (chỉ text và label)
    print(f"\n💾 Đang lưu kết quả vào '{OUTPUT_RESULT_FILE}'...")
    output_data = [{"text": r["text"], "label": r["label"]} for r in results]
    
    with open(OUTPUT_RESULT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Đã lưu {len(output_data)} kết quả!")
    
    # Thống kê các nhãn
    print("\n" + "="*60)
    print("📊 THỐNG KÊ CÁC NHÃN")
    print("="*60)
    
    label_counter = Counter([r["label"] for r in results])
    
    # Tạo thống kê chi tiết
    stats = {
        "total_comments": total_items,
        "processing_time_seconds": round(duration, 2),
        "requests_per_second": round(total_items / duration, 2),
        "label_statistics": {}
    }
    
    print(f"⏱️  Thời gian xử lý: {duration:.2f}s (~{total_items/duration:.0f} req/s)")
    print(f"📝 Tổng số comment: {total_items}\n")
    
    # In thống kê từng nhãn
    for label, count in label_counter.most_common():
        percentage = (count / total_items) * 100
        stats["label_statistics"][label] = {
            "count": count,
            "percentage": round(percentage, 2)
        }
        
        # Hiển thị với bar chart đơn giản
        bar = "█" * int(percentage / 2)  # Mỗi █ đại diện cho 2%
        print(f"{label:20s} | {count:6d} | {percentage:6.2f}% | {bar}")
    
    # Lưu thống kê vào file JSON
    print(f"\n💾 Đang lưu thống kê vào '{OUTPUT_STATS_FILE}'...")
    with open(OUTPUT_STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print("✅ Hoàn thành!")
    print("\n" + "="*60)
    print("📄 KẾT QUẢ:")
    print(f"   - File kết quả (text + label): {OUTPUT_RESULT_FILE}")
    print(f"   - File thống kê: {OUTPUT_STATS_FILE}")
    print("="*60)

if __name__ == "__main__":
    run_test()
