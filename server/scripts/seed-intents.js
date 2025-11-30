// scripts/seed-intents.js
require('dotenv').config();
const { supabase } = require('../src/config/supabase'); // Đảm bảo đường dẫn đúng tới file config supabase của bạn
const { generateEmbedding } = require('../src/config/ollama'); // Đảm bảo đường dẫn đúng tới file config ollama

// DANH SÁCH DỮ LIỆU MẪU ĐỂ DẠY AI
// DANH SÁCH DỮ LIỆU MẪU (Đã mở rộng ~250 câu)
const DATASETS = [
    // =========================================================
    // 1. INTENT: THỜI TIẾT (ask_weather)
    // =========================================================
    { code: 'ask_weather', text: 'Thời tiết hôm nay thế nào?' },
    { code: 'ask_weather', text: 'Hôm nay trời có mưa không?' },
    { code: 'ask_weather', text: 'Nhiệt độ bên ngoài là bao nhiêu?' },
    { code: 'ask_weather', text: 'Dự báo thời tiết ngày mai' },
    { code: 'ask_weather', text: 'Trời nắng hay mưa' },
    { code: 'ask_weather', text: 'Khí hậu ở Đà Nẵng thế nào' },
    { code: 'ask_weather', text: 'Có cần mang ô không?' },
    { code: 'ask_weather', text: 'Trời có lạnh không' },
    { code: 'ask_weather', text: 'Thời tiết hiện tại' },
    { code: 'ask_weather', text: 'Mùa này đi Huế có hay mưa không?' },
    { code: 'ask_weather', text: 'Ngoài trời đang bao nhiêu độ?' },
    { code: 'ask_weather', text: 'Sapa giờ có tuyết không?' },
    { code: 'ask_weather', text: 'Biển động không?' },
    { code: 'ask_weather', text: 'Thấy bảo hôm nay bão về à?' },
    { code: 'ask_weather', text: 'Có nên đi biển hôm nay không?' },
    { code: 'ask_weather', text: 'Trời âm u quá, liệu có mưa to không?' },
    { code: 'ask_weather', text: 'Nắng nóng quá, nhiệt độ cao nhất là bao nhiêu?' },
    { code: 'ask_weather', text: 'Đêm nay trời có trở lạnh không?' },
    { code: 'ask_weather', text: 'Thời tiết cuối tuần này ra sao?' },
    { code: 'ask_weather', text: 'Check thời tiết Nha Trang 3 ngày tới' },
    { code: 'ask_weather', text: 'Mùa này Hà Nội lạnh chưa?' },
    { code: 'ask_weather', text: 'Đà Lạt đang mưa phùn hay nắng?' },
    { code: 'ask_weather', text: 'Có cần mang áo khoác dày không?' },
    { code: 'ask_weather', text: 'Tình hình mưa bão miền Trung' },
    { code: 'ask_weather', text: 'Trời đẹp để đi chụp ảnh không?' },
    { code: 'ask_weather', text: 'Độ ẩm hôm nay cao không?' },
    { code: 'ask_weather', text: 'Dự báo khí tượng thủy văn' },
    { code: 'ask_weather', text: 'Xem thời tiết' },
    { code: 'ask_weather', text: 'Trời mưa tầm tã không đi chơi được' },
    { code: 'ask_weather', text: 'Nắng đẹp không?' },

    // =========================================================
    // 2. INTENT: KHOẢNG CÁCH & DI CHUYỂN (ask_distance)
    // =========================================================
    { code: 'ask_distance', text: 'Từ đây đến đó bao xa?' },
    { code: 'ask_distance', text: 'Khoảng cách từ Hà Nội đến Sài Gòn' },
    { code: 'ask_distance', text: 'Đi mất bao lâu thì tới' },
    { code: 'ask_distance', text: 'Đường đi sang quận 1' },
    { code: 'ask_distance', text: 'Chỉ đường cho tôi' },
    { code: 'ask_distance', text: 'Bao nhiêu km' },
    { code: 'ask_distance', text: 'Đi xe máy mất mấy tiếng' },
    { code: 'ask_distance', text: 'Từ sân bay về trung tâm bao xa' },
    { code: 'ask_distance', text: 'Đi bộ ra biển mất bao lâu?' },
    { code: 'ask_distance', text: 'Google map từ đây đến Cầu Rồng' },
    { code: 'ask_distance', text: 'Có xa không?' },
    { code: 'ask_distance', text: 'Đi taxi hết khoảng bao nhiêu tiền?' },
    { code: 'ask_distance', text: 'Từ khách sạn ra chợ đêm đi đường nào?' },
    { code: 'ask_distance', text: 'Khoảng cách giữa hai điểm này' },
    { code: 'ask_distance', text: 'Mất bao nhiêu phút để di chuyển?' },
    { code: 'ask_distance', text: 'Đường đi có dễ tìm không?' },
    { code: 'ask_distance', text: 'Cách đây mấy cây số?' },
    { code: 'ask_distance', text: 'Từ Sài Gòn đi Vũng Tàu bao xa?' },
    { code: 'ask_distance', text: 'Chỉ đường ngắn nhất' },
    { code: 'ask_distance', text: 'Đi Grab ra đó hết bao nhiêu?' },
    { code: 'ask_distance', text: 'Quãng đường di chuyển' },
    { code: 'ask_distance', text: 'Đến Hội An đi mất mấy tiếng?' },
    { code: 'ask_distance', text: 'Từ đây qua đó gần không?' },
    { code: 'ask_distance', text: 'Tìm đường đi nhanh nhất' },
    { code: 'ask_distance', text: 'Khoảng cách địa lý' },
    { code: 'ask_distance', text: 'Đi xe khách hay tàu hỏa tiện hơn?' },
    { code: 'ask_distance', text: 'Lộ trình đi như thế nào?' },
    { code: 'ask_distance', text: 'Có gần trạm xe buýt không?' },
    { code: 'ask_distance', text: 'Xung quanh đây có cây xăng nào không?' }, // Context tìm đường
    { code: 'ask_distance', text: 'Bao xa?' },
    { code: 'ask_distance', text: 'Chỗ đó cách đây xa ko?' },
    { code: 'ask_distance', text: 'Đi bộ nổi không hay phải thuê xe?' },

    // =========================================================
    // 3. INTENT: KHÁCH SẠN & LƯU TRÚ (ask_hotels)
    // =========================================================
    { code: 'ask_hotels', text: 'Tìm khách sạn gần đây' },
    { code: 'ask_hotels', text: 'Có resort nào đẹp không' },
    { code: 'ask_hotels', text: 'Gợi ý chỗ nghỉ dưỡng' },
    { code: 'ask_hotels', text: 'Đặt phòng khách sạn' },
    { code: 'ask_hotels', text: 'Homestay giá rẻ' },
    { code: 'ask_hotels', text: 'Khách sạn 5 sao sang chảnh' },
    { code: 'ask_hotels', text: 'Tìm nhà nghỉ bình dân' },
    { code: 'ask_hotels', text: 'Khách sạn nào có view biển?' },
    { code: 'ask_hotels', text: 'Chỗ ở cho gia đình có trẻ nhỏ' },
    { code: 'ask_hotels', text: 'Resort nào có hồ bơi vô cực?' },
    { code: 'ask_hotels', text: 'Homestay chill ở Đà Lạt' },
    { code: 'ask_hotels', text: 'Giá phòng một đêm bao nhiêu?' },
    { code: 'ask_hotels', text: 'Có khách sạn tình yêu nào không?' },
    { code: 'ask_hotels', text: 'Tìm chỗ trọ qua đêm' },
    { code: 'ask_hotels', text: 'Khách sạn gần sân bay' },
    { code: 'ask_hotels', text: 'Review khách sạn Mường Thanh' },
    { code: 'ask_hotels', text: 'Booking phòng đôi' },
    { code: 'ask_hotels', text: 'Chỗ nào cho thuê villa nguyên căn?' },
    { code: 'ask_hotels', text: 'Hostel cho dân phượt' },
    { code: 'ask_hotels', text: 'Khách sạn có bao gồm ăn sáng không?' },
    { code: 'ask_hotels', text: 'Tìm phòng dorm giá rẻ' },
    { code: 'ask_hotels', text: 'Có chỗ nào cho mang thú cưng không?' },
    { code: 'ask_hotels', text: 'Khách sạn 3 sao trung tâm thành phố' },
    { code: 'ask_hotels', text: 'Cần tìm chỗ ở tiện nghi' },
    { code: 'ask_hotels', text: 'Check giá phòng khách sạn' },
    { code: 'ask_hotels', text: 'Tư vấn chỗ nghỉ ngơi yên tĩnh' },
    { code: 'ask_hotels', text: 'Khách sạn nào gần chợ đêm?' },
    { code: 'ask_hotels', text: 'Chỗ này có lễ tân 24/24 không?' },
    { code: 'ask_hotels', text: 'Phòng view núi' },
    { code: 'ask_hotels', text: 'Ở đâu tốt?' },
    { code: 'ask_hotels', text: 'Khách sạn nào mới xây?' },

    // =========================================================
    // 4. INTENT: KHUYẾN MÃI (ask_promotions)
    // =========================================================
    { code: 'ask_promotions', text: 'Có khuyến mãi gì không' },
    { code: 'ask_promotions', text: 'Săn voucher giảm giá' },
    { code: 'ask_promotions', text: 'Đang có ưu đãi nào hot' },
    { code: 'ask_promotions', text: 'Mã giảm giá du lịch' },
    { code: 'ask_promotions', text: 'Chương trình sale' },
    { code: 'ask_promotions', text: 'Có deal nào hời không?' },
    { code: 'ask_promotions', text: 'Mã giảm giá đặt phòng' },
    { code: 'ask_promotions', text: 'Khuyến mãi 30/4' },
    { code: 'ask_promotions', text: 'Có combo du lịch giá rẻ không?' },
    { code: 'ask_promotions', text: 'Xin code giảm giá' },
    { code: 'ask_promotions', text: 'Vé máy bay đang giảm giá không?' },
    { code: 'ask_promotions', text: 'Tìm voucher ăn uống' },
    { code: 'ask_promotions', text: 'Ưu đãi cho thành viên mới' },
    { code: 'ask_promotions', text: 'Giá vé đang được giảm bao nhiêu?' },
    { code: 'ask_promotions', text: 'Săn sale cuối tuần' },
    { code: 'ask_promotions', text: 'Mua 1 tặng 1' },
    { code: 'ask_promotions', text: 'Có quà tặng gì không?' },
    { code: 'ask_promotions', text: 'Chương trình tri ân khách hàng' },
    { code: 'ask_promotions', text: 'Giảm giá cho sinh viên' },
    { code: 'ask_promotions', text: 'Flash sale lúc mấy giờ?' },
    { code: 'ask_promotions', text: 'Tìm deal khách sạn 0 đồng' },
    { code: 'ask_promotions', text: 'Khuyến mãi mùa hè' },
    { code: 'ask_promotions', text: 'Voucher spa giảm giá' },
    { code: 'ask_promotions', text: 'Code freeship' },
    { code: 'ask_promotions', text: 'Có áp dụng mã giảm giá được không?' },
    { code: 'ask_promotions', text: 'Đang có event gì hot?' },
    { code: 'ask_promotions', text: 'Khuyến mãi thẻ tín dụng' },
    { code: 'ask_promotions', text: 'Vé tham quan có giảm giá cho người già không?' },
    { code: 'ask_promotions', text: 'Combo giá sốc' },
    { code: 'ask_promotions', text: 'Sale sập sàn' },

    // =========================================================
    // 5. INTENT: ĂN UỐNG & ẨM THỰC (ask_dishes)
    // =========================================================
    { code: 'ask_dishes', text: 'Ăn gì ngon ở đây' },
    { code: 'ask_dishes', text: 'Đặc sản vùng này là gì' },
    { code: 'ask_dishes', text: 'Quán ăn nào ngon' },
    { code: 'ask_dishes', text: 'Review món ăn' },
    { code: 'ask_dishes', text: 'Món ngon nổi tiếng' },
    { code: 'ask_dishes', text: 'Tìm quán cơm bình dân' },
    { code: 'ask_dishes', text: 'Ăn sáng món gì ngon?' },
    { code: 'ask_dishes', text: 'Quán nhậu vỉa hè' },
    { code: 'ask_dishes', text: 'Đà Nẵng có món gì đặc biệt?' },
    { code: 'ask_dishes', text: 'Review bánh tráng cuốn thịt heo' },
    { code: 'ask_dishes', text: 'Tìm nhà hàng sang trọng tiếp khách' },
    { code: 'ask_dishes', text: 'Quán chay gần đây' },
    { code: 'ask_dishes', text: 'Buffet hải sản giá rẻ' },
    { code: 'ask_dishes', text: 'Ăn vặt ở đâu ngon?' },
    { code: 'ask_dishes', text: 'Món này có cay không?' },
    { code: 'ask_dishes', text: 'Đặc sản làm quà' },
    { code: 'ask_dishes', text: 'Quán cafe đẹp sống ảo' },
    { code: 'ask_dishes', text: 'Bún bò Huế ở đâu chuẩn vị?' },
    { code: 'ask_dishes', text: 'Tìm quán nướng BBQ' },
    { code: 'ask_dishes', text: 'Ăn khuya ở đâu?' },
    { code: 'ask_dishes', text: 'Quán nào đông khách nhất?' },
    { code: 'ask_dishes', text: 'Review trà sữa' },
    { code: 'ask_dishes', text: 'Món ăn đường phố' },
    { code: 'ask_dishes', text: 'Nhà hàng món Âu' },
    { code: 'ask_dishes', text: 'Quán ăn gia đình' },
    { code: 'ask_dishes', text: 'Hải sản tươi sống' },
    { code: 'ask_dishes', text: 'Món ngon mỗi ngày' },
    { code: 'ask_dishes', text: 'Địa chỉ quán ốc ngon' },
    { code: 'ask_dishes', text: 'Food tour Hải Phòng' },
    { code: 'ask_dishes', text: 'Đói quá ăn gì bây giờ?' },
    { code: 'ask_dishes', text: 'Có quán nào view đẹp không?' },

    // =========================================================
    // 6. INTENT: ĐỊA ĐIỂM & THAM QUAN (ask_places)
    // =========================================================
    { code: 'ask_places', text: 'Chơi gì ở đây' },
    { code: 'ask_places', text: 'Địa điểm tham quan nổi tiếng' },
    { code: 'ask_places', text: 'Check in ở đâu đẹp' },
    { code: 'ask_places', text: 'Danh lam thắng cảnh' },
    { code: 'ask_places', text: 'Có chỗ nào vui không' },
    { code: 'ask_places', text: 'Điểm du lịch hot' },
    { code: 'ask_places', text: 'Gợi ý lịch trình tham quan' },
    { code: 'ask_places', text: 'Chỗ nào chụp ảnh đẹp?' },
    { code: 'ask_places', text: 'Khu vui chơi giải trí' },
    { code: 'ask_places', text: 'Đi đâu buổi tối?' },
    { code: 'ask_places', text: 'Review Bà Nà Hills' },
    { code: 'ask_places', text: 'Có chỗ nào cho trẻ em chơi không?' },
    { code: 'ask_places', text: 'Tham quan bảo tàng' },
    { code: 'ask_places', text: 'Đi chùa cầu duyên' },
    { code: 'ask_places', text: 'Bãi biển nào đẹp nhất?' },
    { code: 'ask_places', text: 'Địa điểm cắm trại' },
    { code: 'ask_places', text: 'Phố cổ Hội An có gì hay?' },
    { code: 'ask_places', text: 'Tìm chỗ đi dạo' },
    { code: 'ask_places', text: 'Công viên nước' },
    { code: 'ask_places', text: 'Đi bar/pub nào vui?' },
    { code: 'ask_places', text: 'Chỗ nào yên tĩnh để đọc sách?' },
    { code: 'ask_places', text: 'Khu du lịch sinh thái' },
    { code: 'ask_places', text: 'Đi đâu trốn nóng?' },
    { code: 'ask_places', text: 'Các địa điểm phượt' },
    { code: 'ask_places', text: 'Di tích lịch sử' },
    { code: 'ask_places', text: 'Chợ đêm nằm ở đâu?' },
    { code: 'ask_places', text: 'Làng nghề truyền thống' },
    { code: 'ask_places', text: 'Chỗ này có gì đặc sắc?' },
    { code: 'ask_places', text: 'Đi xem cầu Rồng phun lửa' },
    { code: 'ask_places', text: 'Leo núi ở đâu?' },
    { code: 'ask_places', text: 'Thác nước đẹp' },

    // =========================================================
    // 7. INTENT: CHITCHAT (Giao tiếp xã giao)
    // =========================================================
    { code: 'chitchat', text: 'Xin chào' },
    { code: 'chitchat', text: 'Bạn tên là gì' },
    { code: 'chitchat', text: 'Giúp gì được cho tôi' },
    { code: 'chitchat', text: 'Hello bot' },
    { code: 'chitchat', text: 'Hi em' },
    { code: 'chitchat', text: 'Chào bạn nhé' },
    { code: 'chitchat', text: 'Bot có người yêu chưa?' },
    { code: 'chitchat', text: 'Bạn bao nhiêu tuổi?' },
    { code: 'chitchat', text: 'Bạn thông minh quá' },
    { code: 'chitchat', text: 'Cảm ơn bạn nhiều' },
    { code: 'chitchat', text: 'Tạm biệt nhé' },
    { code: 'chitchat', text: 'Hẹn gặp lại' },
    { code: 'chitchat', text: 'Chúc ngủ ngon' },
    { code: 'chitchat', text: 'Buổi sáng tốt lành' },
    { code: 'chitchat', text: 'Bạn là ai?' },
    { code: 'chitchat', text: 'Tôi đang buồn quá' },
    { code: 'chitchat', text: 'Kể chuyện cười đi' },
    { code: 'chitchat', text: 'Bạn biết làm gì?' },
    { code: 'chitchat', text: 'Bot ngu quá' }, // Negative feedback sample
    { code: 'chitchat', text: 'Xàm xí' },
    { code: 'chitchat', text: 'Hay quá' },
    { code: 'chitchat', text: 'Tuyệt vời' },
    { code: 'chitchat', text: 'Ok bạn' },
    { code: 'chitchat', text: 'Được đấy' },
    { code: 'chitchat', text: 'Tôi muốn hỏi chút' },
    { code: 'chitchat', text: 'Alo alo' },
    { code: 'chitchat', text: 'Có ai ở đó không?' },
    { code: 'chitchat', text: 'Cho mình hỏi xíu' },
    { code: 'chitchat', text: 'Good morning' },
    { code: 'chitchat', text: 'Thank you' },
    { code: 'chitchat', text: 'Bye bye' },
];
async function seedIntents() {
    console.log(`🚀 Bắt đầu nạp ${DATASETS.length} câu mẫu vào hệ thống...`);

    // 1. Xóa dữ liệu cũ để tránh trùng lặp (Optional)
    const { error: delError } = await supabase.from('system_intents').delete().neq('id', 0);
    if (!delError) {
        console.log('🧹 Đã dọn sạch dữ liệu cũ.');
    } else {
        console.warn('⚠️ Lỗi xóa data cũ (có thể bảng trống):', delError.message);
    }

    let successCount = 0;

    // 2. Chạy vòng lặp xử lý từng câu
    for (const item of DATASETS) {
        try {
            // A. Tạo Vector Embedding từ Ollama
            const embedding = await generateEmbedding(item.text);
            
            if (!embedding) {
                console.error(`❌ Bỏ qua "${item.text}" do không tạo được vector.`);
                continue;
            }

            // B. Lưu vào Supabase
            const { error } = await supabase.from('system_intents').insert({
                intent_code: item.code,
                sample_query: item.text,
                embedding: embedding
            });

            if (error) {
                console.error(`❌ Lỗi insert "${item.text}":`, error.message);
            } else {
                process.stdout.write('.'); // In dấu chấm để báo hiệu tiến độ
                successCount++;
            }

        } catch (err) {
            console.error(`\n❌ Exception với "${item.text}":`, err.message);
        }
    }

    console.log(`\n\n✅ HOÀN TẤT! Đã nạp thành công ${successCount}/${DATASETS.length} intents.`);
}

// Chạy hàm
seedIntents();