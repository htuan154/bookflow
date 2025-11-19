## Tiến độ cải tiến AI trả lời tự nhiên

- [x] Phân tích code hiện tại và điểm yếu về chitchat/out-of-domain.
- [x] Cập nhật NLU/guardrail/composer để có chế độ chitchat và fallback tự nhiên.
- [x] Kiểm tra nhanh và rà lại các điểm chạm sau khi sửa (Đang thực hiện fix lỗi data gộp).

### Checklist kiểm tra nhanh UI AdminSuggestionsPage ↔ server
- [x] chatSuggest trả payload đúng schema.
- [x] Tin nhắn chitchat trả về summary + tips.
- [ ] Kiểm tra res headers dedupe (Pending FE update).

### Đã làm (Completed)
- **NLU & Core:** `ask_weather`, chitchat, normalized city detection.
- **Context:** History 5 turns, dedupe mechanism.
- **Fallback:** Weather/Chitchat prompt, sanitization (CJK, Celsius).
- **Guardrails (Logic):**
    - `filterDocByProvince`: Cơ chế lọc blacklist `EXTRA`.
    - Đã fix lọc Đồng Nai ↔ Bình Phước.
    - Đã fix lọc Ninh Bình/Nam Định ↔ Hà Nam.
    - Đã fix lọc Kiên Giang ↔ An Giang.
- **Data Fixes (Đã cập nhật):**
    - [x] Fix Đà Nẵng bị lẫn Quảng Nam (Hội An, Mỹ Sơn).
    - [x] Fix Vĩnh Long bị lẫn Trà Vinh/Bến Tre.
    - [x] Fix Đắk Lắk/HCM bị lỗi hiển thị (kiểm soát lại keywords).
- **Search Logic Improvements (Mới - 19/11/2025):**
  - [x] **Fix `findProvinceDoc`**: Cải thiện logic match aliases - giờ "Hồ Chí Minh" → "Thành phố Hồ Chí Minh" đúng.
  - [x] **Multi-strategy search**: canonical map → norm → aliases → aliases no-space → findByProvinceExact → full-text.
  - [x] **Fix suggest()**: Sử dụng `findProvinceDoc` thay vì logic cũ, tránh "No data found" sai.
  - [x] **Canonical mapping**: Map 60+ biến thể (hcm/saigon/dak lak/vung tau...) → tên DB chính xác.
  - [x] **Debug logging**: Thêm console.log chi tiết từng bước search để debug dễ hơn.
- **Prompt Quality Improvements (Mới - 19/11/2025):**
  - [x] **Refactor `factsToPrompt`**: Bắt buộc AI viết hint 10-15 từ mô tả ĐỘC ĐÁO (không được chỉ viết "nằm ở Sa Pa").
  - [x] **Enforce "where" quality**: Phải gợi ý địa chỉ CỤ THỂ (tên quán/chợ/đường phố) thay vì "có nhiều quán".
  - [x] **Fix `composeCityFallback`**: Thêm kiểm tra địa lý nghiêm ngặt - KHÔNG gợi ý địa danh tỉnh khác (vd: không gợi "Hồ Dầu Tiếng" Bình Dương cho Đắk Lắk).
  - [x] **Self-verification prompt**: AI phải tự hỏi "Tôi có CHẮC CHẮN 100% địa danh này thuộc tỉnh X không?" trước khi trả lời.
- **RAG Pipeline Optimization (Mới - 19/11/2025):**
  - [x] **Specific Item Focus Mode**: Phát hiện query chi tiết (vd: "Mô tả Nhà thờ Đức Bà") vs query chung ("Đi chơi HCM").
  - [x] **Anti-Hallucination for Details**: `itemDetailPrompt` chỉ mô tả 1 item, không list nhiều, dùng POI_RULES cho thông tin xác thực.
  - [x] **Fuzzy Matching**: So khớp tên địa danh/món ăn với 2+ từ khóa chung, bắt cả "Nhà thờ" từ "Nhà thờ Đức Bà".
  - [x] **Smart Mode Switching**: `compose()` tự động chọn generic list hoặc specific detail mode.

### Còn lại / TODO (Priority High)

1. **Re-test toàn diện bộ lọc địa lý:**
   - Chat thử: "Đi chơi Đà Nẵng", "Ăn gì ở Vĩnh Long", "Du lịch Đắk Lắk".
   - Đảm bảo không còn địa danh tỉnh hàng xóm tràn sang.
2. **Test search với canonical mapping (CRITICAL):**
   - "Hồ Chí Minh" / "HCM" / "Sài Gòn" → phải trả Bến Thành, Nguyễn Huệ (KHÔNG "No data found").
   - "Đắk Lắk" / "Dak Lak" → phải trả Buôn Đôn, Hồ Lắk (KHÔNG bị rỗng).
   - "Vũng Tàu" / "BRVT" → phải trả Bãi Sau, Bạch Đình.
   - Xem console.log để debug từng strategy.
3. **Test Specific Item Focus Mode (MỚI):**
   - Bước 1 (Generic): "Đi chơi Hồ Chí Minh" → Trả list 5-7 địa danh.
   - Bước 2 (Specific): "Mô tả Nhà thờ Đức Bà" → Trả CHỈ 1 item với summary chi tiết 2-4 câu.
   - Bước 3 (Specific Dish): "Chi tiết về Phở" → Trả CHỈ món Phở với nguyên liệu + quán cụ thể.
   - Console phải log: `[findSpecificItem] Found place: Nhà thờ Đức Bà` và `[compose] SPECIFIC ITEM MODE`.
4. **Tối ưu prompt "No Data":**
   - Nếu lọc xong mà danh sách rỗng -> Prompt nên trả về "Hiện chưa có địa điểm cụ thể trong hệ thống, nhưng bạn có thể tham khảo..." thay vì im lặng hoặc trả tips chung chung.
5. **FE:** Expose response headers `X-Dedupe`, `X-Source` để debug dễ hơn.

### Câu hỏi test lại (Regression Test)

1. "Du lịch Đà Nẵng có gì?" (Mong đợi: Mất Hội An, Mỹ Sơn).
2. "Về Vĩnh Long chơi đâu?" (Mong đợi: Mất Ao Bà Om, Kẹo dừa).
3. "Đi chơi Đắk Lắk" (Mong đợi: Có Buôn Đôn, Hồ Lắk; Mất Gành Đá Đĩa).
4. "Gợi ý quán ăn ở Sài Gòn" (Mong đợi: Cơm tấm, Phở...; Mất Bánh khọt Vũng Tàu).
5. "Hồ Chí Minh có gì?" (Mong đợi: Tìm được data, KHÔNG "No data found").
6. "Đi Đắk Lắk chơi gì?" (Mong đợi: Có Buôn Đôn, Hồ Lắk).
7. "HCM có gì?" (Test alias ngắn - phải match "Thành phố Hồ Chí Minh").

![1763538750229](image/PROGRESS/1763538750229.png)
