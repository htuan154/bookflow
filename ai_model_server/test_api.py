"""
Test API cho AI Comment Classifier
Kiểm tra nhiều loại bình luận khác nhau
"""
import requests
import json
from typing import List, Dict

# Cấu hình
API_URL = "http://localhost:5000/check-comment"
HEALTH_URL = "http://localhost:5000/health"

# Danh sách bình luận test
TEST_COMMENTS = [
    # SẠCH - Bình luận tích cực
    "Khách sạn rất tốt, phòng sạch sẽ, nhân viên thân thiện!",
    "Mình rất thích view biển ở đây, đẹp lắm",
    "Giá cả hợp lý, sẽ quay lại lần sau",
    "Cảm ơn khách sạn đã phục vụ chu đáo",
    
    # SẠCH - Câu hỏi bình thường
    "Khách sạn có phòng trống ngày 20/12 không ạ?",
    "Cho mình hỏi giá phòng đôi bao nhiêu?",
    "Có dịch vụ đưa đón sân bay không?",
    
    # CHỬI BỚI - Xúc phạm
    "Khách sạn này tệ vãi chó",
    "Nhân viên ngu như bò, phục vụ tệ",
    "Đm thằng chủ khách sạn lừa đảo",
    "Con chó này dám lừa tao",
    "Mẹ nhà ông vcl",
    
    # KÍCH ĐỘNG - Kêu gọi tẩy chay
    "Mọi người đừng đặt phòng ở đây, lừa đảo",
    "Tẩy chay khách sạn này đi các bạn",
    "Ai định đặt phòng thì tránh xa ra nhé",
    "Bóc phốt khách sạn lừa đảo này",
    
    # SPAM - Quảng cáo
    "Liên hệ 0123456789 để đặt phòng giá rẻ",
    "Xem thêm tại https://example.com/khuyenmai",
    "Nhắn tin 0987654321 nhận ưu đãi 50%",
    "Inbox zalo 0912345678",
    
    # Trường hợp đặc biệt - Cần ngữ nghĩa
    "Con chó dễ thương quá",  # SẠCH - chó là pet
    "Khôn như chó",  # CHỬI BỚI - chửi
    "Khách sạn này như shit",  # CHỬI BỚI
    "Service như cứt",  # CHỬI BỚI
]

def check_health() -> bool:
    """Kiểm tra server có hoạt động không"""
    try:
        response = requests.get(HEALTH_URL, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Server đang hoạt động")
            print(f"   Model: {data.get('model')}")
            print(f"   Device: {data.get('device')}")
            print()
            return True
        return False
    except Exception as e:
        print(f"❌ Không kết nối được server: {e}")
        print("   Hãy chạy: python app.py")
        return False

def test_comment(text: str) -> Dict:
    """Test một bình luận"""
    try:
        response = requests.post(
            API_URL,
            json={"text": text},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Status code: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def print_result(text: str, result: Dict):
    """In kết quả đẹp"""
    if "error" in result:
        print(f"❌ LỖI: {result['error']}\n")
        return
    
    classification = result.get("label", "UNKNOWN")
    confidence = result.get("confidence", 0.0)
    scores = result.get("scores", {})
    
    # Icon theo classification
    icon_map = {
        "SẠCH": "✅",
        "CHỬI BỚI": "🤬",
        "KÍCH ĐỘNG": "⚠️",
        "SPAM": "📛",
        "REVIEW": "🔍"
    }
    icon = icon_map.get(classification, "❓")
    
    print(f"{icon} {classification} ({confidence:.2%})")
    print(f"   📝 Text: {text[:60]}{'...' if len(text) > 60 else ''}")
    print(f"   🎯 Scores:")
    for label, score in scores.items():
        bar = "█" * int(score * 20)
        print(f"      {label:12s} {score:.2%} {bar}")
    print()

def run_tests():
    """Chạy tất cả test cases"""
    print("="*70)
    print("🧪 TEST API - AI COMMENT CLASSIFIER")
    print("="*70)
    print()
    
    # Kiểm tra health
    if not check_health():
        return
    
    print("="*70)
    print("📊 KẾT QUẢ TEST")
    print("="*70)
    print()
    
    # Thống kê
    stats = {
        "total": 0,
        "SẠCH": 0,
        "CHỬI BỚI": 0,
        "KÍCH ĐỘNG": 0,
        "SPAM": 0,
        "REVIEW": 0,
        "errors": 0
    }
    
    # Test từng comment
    for i, comment in enumerate(TEST_COMMENTS, 1):
        print(f"[{i}/{len(TEST_COMMENTS)}] ", end="")
        result = test_comment(comment)
        print_result(comment, result)
        
        stats["total"] += 1
        if "error" in result:
            stats["errors"] += 1
        else:
            classification = result.get("label", "UNKNOWN")
            stats[classification] = stats.get(classification, 0) + 1
    
    # In thống kê
    print("="*70)
    print("📈 THỐNG KÊ")
    print("="*70)
    print(f"Tổng số test: {stats['total']}")
    print(f"✅ SẠCH:      {stats['SẠCH']} ({stats['SẠCH']/stats['total']*100:.1f}%)")
    print(f"🤬 CHỬI BỚI:  {stats['CHỬI BỚI']} ({stats['CHỬI BỚI']/stats['total']*100:.1f}%)")
    print(f"⚠️  KÍCH ĐỘNG: {stats['KÍCH ĐỘNG']} ({stats['KÍCH ĐỘNG']/stats['total']*100:.1f}%)")
    print(f"📛 SPAM:      {stats['SPAM']} ({stats['SPAM']/stats['total']*100:.1f}%)")
    print(f"🔍 REVIEW:    {stats['REVIEW']} ({stats['REVIEW']/stats['total']*100:.1f}%)")
    if stats['errors'] > 0:
        print(f"❌ Lỗi:       {stats['errors']}")
    print("="*70)

if __name__ == "__main__":
    run_tests()
