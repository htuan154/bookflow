const axios = require('axios');

// CẤU HÌNH SERVER
const HOST = 'http://localhost:8080';
const API_URL = `${HOST}/api/v1/data`;
const AUTH_URL = `${HOST}/api/v1/auth`;

// TÀI KHOẢN ADMIN (Dùng để lấy Token)
const CREDENTIALS = { identifier: 'admin', password: 'admin123' };

// ============================================================
// KHO DỮ LIỆU KHỔNG LỒ (20 TỈNH THÀNH - 250+ MỤC)
// ============================================================
const DATA_SOURCE = {
    "Hà Nội": {
        places: [
            { name: "Hồ Gươm", desc: "Trái tim của thủ đô, nơi có Tháp Rùa cổ kính và cầu Thê Húc son đỏ." },
            { name: "Lăng Bác", desc: "Nơi an nghỉ vĩnh hằng của Chủ tịch Hồ Chí Minh, biểu tượng thiêng liêng của dân tộc." },
            { name: "Văn Miếu Quốc Tử Giám", desc: "Trường đại học đầu tiên của Việt Nam, biểu tượng của tri thức và hiếu học." },
            { name: "Phố cổ Hà Nội", desc: "36 phố phường sầm uất với những ngôi nhà cổ và văn hóa đường phố đặc trưng." },
            { name: "Nhà tù Hỏa Lò", desc: "Di tích lịch sử minh chứng cho tinh thần bất khuất của các chiến sĩ cách mạng." },
            { name: "Hồ Tây", desc: "Hồ nước tự nhiên lớn nhất Hà Nội, nơi lý tưởng để ngắm hoàng hôn và đạp xe." }
        ],
        dishes: [
            { name: "Phở Hà Nội", desc: "Món quốc hồn quốc túy với nước dùng thanh trong từ xương bò và quế hồi." },
            { name: "Bún chả Obama", desc: "Thịt nướng than hoa thơm lừng ăn kèm bún rối và nước chấm chua ngọt." },
            { name: "Chả cá Lã Vọng", desc: "Đặc sản nức tiếng làm từ cá lăng, ăn kèm thì là, hành hoa và mắm tôm." },
            { name: "Cốm làng Vòng", desc: "Thức quà thanh tao của mùa thu Hà Nội, gói trong lá sen thơm ngát." },
            { name: "Bún đậu mắm tôm", desc: "Món ăn dân dã gây nghiện với đậu rán giòn, chả cốm và mắm tôm pha sủi bọt." }
        ]
    },
    "TP Hồ Chí Minh": {
        places: [
            { name: "Dinh Độc Lập", desc: "Di tích lịch sử quan trọng, chứng nhân cho ngày thống nhất đất nước." },
            { name: "Nhà thờ Đức Bà", desc: "Kiệt tác kiến trúc Pháp giữa lòng Sài Gòn với gạch đỏ Marseilles không phai màu." },
            { name: "Phố đi bộ Nguyễn Huệ", desc: "Con phố sầm uất nhất Sài Gòn, nơi diễn ra các hoạt động văn hóa giải trí sôi động." },
            { name: "Landmark 81", desc: "Tòa nhà cao nhất Việt Nam, biểu tượng của sự phát triển hiện đại." },
            { name: "Bưu điện Trung tâm", desc: "Công trình kiến trúc kết hợp phong cách phương Tây và Á Đông tuyệt đẹp." }
        ],
        dishes: [
            { name: "Cơm tấm Sài Gòn", desc: "Món ăn sáng trứ danh với sườn nướng mật ong, bì, chả trứng và mỡ hành." },
            { name: "Hủ tiếu Nam Vang", desc: "Món nước đậm đà với tôm, thịt bằm, gan heo và trứng cút." },
            { name: "Bánh mì Huỳnh Hoa", desc: "Bánh mì đắt đỏ nhưng chất lượng với lớp pate béo ngậy và thịt nguội đầy ắp." },
            { name: "Ốc Sài Gòn", desc: "Văn hóa ăn ốc vỉa hè đa dạng với hàng chục cách chế biến khác nhau." }
        ]
    },
    "Đà Nẵng": {
        places: [
            { name: "Cầu Rồng", desc: "Biểu tượng mới của Đà Nẵng với khả năng phun lửa và phun nước vào cuối tuần." },
            { name: "Bà Nà Hills", desc: "Đường lên tiên cảnh với Cầu Vàng (Cầu Bàn Tay) nổi tiếng thế giới." },
            { name: "Ngũ Hành Sơn", desc: "Hệ thống 5 ngọn núi đá vôi chứa đựng nhiều hang động và chùa chiền huyền bí." },
            { name: "Bán đảo Sơn Trà", desc: "Lá phổi xanh của thành phố, nơi có chùa Linh Ứng và đàn voọc chà vá chân nâu." }
        ],
        dishes: [
            { name: "Mì Quảng", desc: "Món mì trộn đặc trưng với tôm, thịt, trứng cút và bánh tráng nướng giòn." },
            { name: "Bánh tráng thịt heo", desc: "Thịt heo hai đầu da luộc mềm, cuốn rau sống chấm mắm nêm đậm đà." },
            { name: "Gỏi cá Nam Ô", desc: "Món gỏi cá trích tươi sống ướp thính, dành cho những người sành ăn." }
        ]
    },
    "Huế": {
        places: [
            { name: "Đại Nội Huế", desc: "Hoàng thành cổ kính của triều Nguyễn, di sản văn hóa thế giới." },
            { name: "Chùa Thiên Mụ", desc: "Ngôi chùa cổ linh thiêng nằm bên dòng sông Hương thơ mộng." },
            { name: "Lăng Khải Định", desc: "Lăng tẩm có kiến trúc giao thoa Đông Tây tinh xảo và lộng lẫy nhất." },
            { name: "Sông Hương", desc: "Dòng sông hiền hòa, nơi du khách có thể nghe ca Huế trên thuyền rồng." }
        ],
        dishes: [
            { name: "Bún bò Huế", desc: "Món bún cay nồng vị sả và ruốc, với chân giò heo và chả cua." },
            { name: "Cơm hến", desc: "Món ăn dân dã cay xè từ cơm nguội, hến xào và tóp mỡ." },
            { name: "Bánh bèo nậm lọc", desc: "Bộ ba loại bánh làm từ bột gạo, ăn kèm nước mắm ngọt." },
            { name: "Chè Huế", desc: "Thế giới chè cung đình với hàng chục loại từ chè hạt sen đến chè bột lọc heo quay." }
        ]
    },
    "Hội An": {
        places: [
            { name: "Phố cổ Hội An", desc: "Những ngôi nhà vàng rêu phong và đèn lồng rực rỡ về đêm." },
            { name: "Chùa Cầu", desc: "Biểu tượng của Hội An, cây cầu cổ mang đậm kiến trúc Nhật Bản." },
            { name: "Rừng dừa Bảy Mẫu", desc: "Trải nghiệm đi thuyền thúng giữa rừng dừa nước như ở miền Tây." }
        ],
        dishes: [
            { name: "Cao lầu", desc: "Món mì độc đáo với sợi mì vàng dai, thịt xá xíu và rau sống Trà Quế." },
            { name: "Cơm gà Hội An", desc: "Cơm nấu nước luộc gà vàng ươm, thịt gà xé phay trộn rau răm." },
            { name: "Bánh mì Phượng", desc: "Được mệnh danh là bánh mì ngon nhất thế giới với nước sốt bí truyền." }
        ]
    },
    "Quảng Ninh": {
        places: [
            { name: "Vịnh Hạ Long", desc: "Kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá vôi hùng vĩ." },
            { name: "Sun World Hạ Long", desc: "Tổ hợp vui chơi giải trí lớn nhất miền Bắc với công viên Rồng và công viên nước." },
            { name: "Bảo tàng Quảng Ninh", desc: "Viên ngọc đen bên vịnh biển, nơi lưu giữ văn hóa và lịch sử vùng mỏ." },
            { name: "Đảo Tuần Châu", desc: "Khu du lịch quốc tế với bãi tắm nhân tạo đẹp nhất Hạ Long." }
        ],
        dishes: [
            { name: "Chả mực Hạ Long", desc: "Chả mực giã tay dai giòn sần sật, thơm nức mũi." },
            { name: "Sá sùng", desc: "Loại hải sản quý hiếm, đắt tựa vàng ròng, dùng để nấu nước dùng siêu ngọt." },
            { name: "Bún bề bề", desc: "Bún hải sản với thịt bề bề (tôm tít) tươi ngon, nước dùng chua thanh." }
        ]
    },
    "Ninh Bình": {
        places: [
            { name: "Tràng An", desc: "Di sản kép thế giới, nơi có hệ thống hang động và núi đá vôi tuyệt đẹp." },
            { name: "Chùa Bái Đính", desc: "Ngôi chùa lớn nhất Đông Nam Á với nhiều kỷ lục Phật giáo." },
            { name: "Hang Múa", desc: "Vạn Lý Trường Thành thu nhỏ, nơi ngắm toàn cảnh Tam Cốc từ trên cao." },
            { name: "Tam Cốc Bích Động", desc: "Được mệnh danh là Nam Thiên Đệ Nhị Động, đi thuyền trên sông Ngô Đồng." }
        ],
        dishes: [
            { name: "Cơm cháy Ninh Bình", desc: "Cơm cháy giòn rụm ăn kèm với sốt tim cật dê núi." },
            { name: "Thịt dê núi", desc: "Dê thả núi thịt chắc, chế biến thành các món tái chanh, xào lăn, hầm thuốc bắc." }
        ]
    },
    "Sapa": {
        places: [
            { name: "Đỉnh Fansipan", desc: "Nóc nhà Đông Dương, nơi săn mây và chinh phục độ cao 3143m." },
            { name: "Bản Cát Cát", desc: "Bản làng cổ đẹp nhất Tây Bắc với văn hóa người H'Mông đặc sắc." },
            { name: "Nhà thờ đá Sapa", desc: "Biểu tượng của thành phố sương mù, kiến trúc Gothic cổ kính." },
            { name: "Đèo Ô Quy Hồ", desc: "Một trong tứ đại đỉnh đèo của Việt Nam, nơi ngắm hoàng hôn hùng vĩ." }
        ],
        dishes: [
            { name: "Lẩu cá tầm", desc: "Cá tầm tươi sống nấu lẩu chua cay, ăn kèm rau rừng Sapa." },
            { name: "Thắng cố", desc: "Đặc sản ngựa hầm truyền thống, món ăn thách thức lòng can đảm." },
            { name: "Thịt trâu gác bếp", desc: "Thịt trâu hun khói, dai ngọt, chấm chẩm chéo cay tê." }
        ]
    },
    "Hà Giang": {
        places: [
            { name: "Cao nguyên đá Đồng Văn", desc: "Công viên địa chất toàn cầu với cảnh quan đá tai mèo hùng vĩ." },
            { name: "Sông Nho Quế", desc: "Dòng sông xanh ngọc bích chảy qua hẻm Tu Sản sâu nhất Đông Nam Á." },
            { name: "Cột cờ Lũng Cú", desc: "Điểm cực Bắc thiêng liêng của Tổ quốc." },
            { name: "Dinh thự Vua Mèo", desc: "Công trình kiến trúc độc đáo giữa thung lũng Sà Phìn." }
        ],
        dishes: [
            { name: "Cháo ấu tẩu", desc: "Món cháo giải cảm, vị đắng nhẹ nhưng hậu ngọt, đặc sản vùng cao." },
            { name: "Bánh cuốn trứng", desc: "Bánh cuốn nóng hổi ăn kèm nước hầm xương ngọt lừ." }
        ]
    },
    "Quảng Bình": {
        places: [
            { name: "Động Phong Nha", desc: "Đệ nhất kỳ quan động với hệ thống thạch nhũ tráng lệ." },
            { name: "Hang Sơn Đoòng", desc: "Hang động lớn nhất thế giới, niềm tự hào của du lịch Việt Nam." },
            { name: "Suối Moọc", desc: "Suối nước xanh ngọc bích mát lạnh giữa rừng nguyên sinh." }
        ],
        dishes: [
            { name: "Cháo canh", desc: "Món cháo bột mì nấu với cá lóc, đậm đà hương vị miền Trung." },
            { name: "Bánh bột lọc", desc: "Bánh bột lọc trần nhân tôm thịt, chấm nước mắm cay." }
        ]
    },
    "Quy Nhơn": {
        places: [
            { name: "Kỳ Co", desc: "Maldives của Việt Nam với bãi biển hoang sơ và nước xanh trong vắt." },
            { name: "Eo Gió", desc: "Nơi ngắm bình minh đẹp nhất Việt Nam với con đường đi bộ ven biển." },
            { name: "Tháp Đôi", desc: "Di tích tháp Chăm độc đáo nằm ngay trong lòng thành phố." }
        ],
        dishes: [
            { name: "Bánh xèo tôm nhảy", desc: "Bánh xèo giòn tan với nhân tôm đất tươi roi rói còn nhảy tanh tách." },
            { name: "Bún chả cá Quy Nhơn", desc: "Chả cá làm từ cá thu tươi, nước dùng ngọt thanh không tanh." }
        ]
    },
    "Phú Yên": {
        places: [
            { name: "Gành Đá Đĩa", desc: "Tuyệt tác thiên nhiên với những khối đá hình lăng trụ xếp chồng lên nhau." },
            { name: "Bãi Xép", desc: "Phim trường 'Tôi thấy hoa vàng trên cỏ xanh' đẹp như tranh vẽ." },
            { name: "Mũi Điện", desc: "Nơi đón ánh bình minh đầu tiên trên đất liền Việt Nam." }
        ],
        dishes: [
            { name: "Mắt cá ngừ đại dương", desc: "Món ăn tiềm thuốc bắc bổ dưỡng, đặc sản độc quyền Phú Yên." },
            { name: "Cơm gà Phú Yên", desc: "Cơm gà xối mỡ vàng ươm, thịt gà ta dai ngọt." }
        ]
    },
    "Nha Trang": {
        places: [
            { name: "Đảo Khỉ", desc: "Vương quốc của hơn 1200 chú khỉ sống tự nhiên." },
            { name: "Viện Hải Dương Học", desc: "Nơi lưu giữ hàng ngàn mẫu vật sinh vật biển quý hiếm." },
            { name: "Tháp Bà Ponagar", desc: "Quần thể kiến trúc Chăm Pa cổ kính và linh thiêng." },
            { name: "VinWonders Nha Trang", desc: "Công viên giải trí đẳng cấp quốc tế trên đảo Hòn Tre." }
        ],
        dishes: [
            { name: "Nem nướng Đặng Văn Quyên", desc: "Thương hiệu nem nướng nổi tiếng nhất Nha Trang." },
            { name: "Bò nướng Lạc Cảnh", desc: "Quán bò nướng hơn 40 năm tuổi với bí quyết tẩm ướp gia truyền." },
            { name: "Bún sứa Nha Trang", desc: "Nước dùng thanh ngọt, thịt sứa giòn sần sật." }
        ]
    },
    "Đà Lạt": {
        places: [
            { name: "Thác Datanla", desc: "Thác nước hùng vĩ với hệ thống máng trượt dài nhất Đông Nam Á." },
            { name: "Vườn hoa Cẩm Tú Cầu", desc: "Cánh đồng hoa rộng lớn nở rộ quanh năm, điểm check-in sống ảo cực hot." },
            { name: "Chợ đêm Đà Lạt", desc: "Thiên đường ẩm thực đường phố và đồ len." },
            { name: "Đường Hầm Điêu Khắc", desc: "Công trình kiến trúc độc đáo bằng đất sét tái hiện lịch sử Đà Lạt." },
            { name: "Hồ Xuân Hương", desc: "Trái tim của Đà Lạt, nơi lý tưởng để đi dạo và đạp vịt." }
        ],
        dishes: [
            { name: "Kem bơ", desc: "Kem bơ béo ngậy ăn kèm sầu riêng thơm lừng." },
            { name: "Sữa đậu nành nóng", desc: "Thức uống bình dân sưởi ấm những đêm Đà Lạt se lạnh." },
            { name: "Bánh tráng nướng", desc: "Được mệnh danh là Pizza Đà Lạt." }
        ]
    },
    "Vũng Tàu": {
        places: [
            { name: "Tượng Chúa Kitô Vua", desc: "Tượng Chúa dang tay lớn nhất châu Á trên đỉnh núi Nhỏ." },
            { name: "Hải đăng Vũng Tàu", desc: "Ngọn hải đăng cổ nhất Việt Nam, nơi ngắm toàn cảnh thành phố biển." },
            { name: "Mũi Nghinh Phong", desc: "Mũi đất vươn ra biển đón gió, điểm check-in Cổng Trời." }
        ],
        dishes: [
            { name: "Bánh khọt Gốc Vú Sữa", desc: "Bánh khọt tôm tươi giòn rụm, ăn kèm rau sống và đu đủ ngâm." },
            { name: "Lẩu cá đuối", desc: "Lẩu chua cay nấu măng chua, thịt cá đuối sụn giòn sần sật." }
        ]
    },
    "Phan Thiết": {
        places: [
            { name: "Đồi Cát Bay", desc: "Tiểu sa mạc Sahara với những đồi cát thay đổi hình dạng theo giờ." },
            { name: "Bàu Trắng", desc: "Hồ nước ngọt xanh ngắt nằm giữa đồi cát trắng bao la." },
            { name: "Làng chài Mũi Né", desc: "Nơi ngắm bình minh và mua hải sản tươi sống giá rẻ." }
        ],
        dishes: [
            { name: "Lẩu thả", desc: "Món lẩu nghệ thuật được bày trí như bông hoa, nguyên liệu chính là cá mai." },
            { name: "Bánh căn Phan Thiết", desc: "Bánh căn nướng khuôn đất, chan ngập nước cá kho hoặc xíu mại." }
        ]
    },
    "Cần Thơ": {
        places: [
            { name: "Chợ nổi Cái Răng", desc: "Di sản văn hóa phi vật thể, nét đặc trưng của sông nước miền Tây." },
            { name: "Bến Ninh Kiều", desc: "Biểu tượng của Cần Thơ, nơi giao thoa giữa sông Hậu và thành phố." },
            { name: "Nhà cổ Bình Thủy", desc: "Ngôi nhà cổ kiến trúc Pháp tuyệt đẹp, phim trường của nhiều bộ phim nổi tiếng." }
        ],
        dishes: [
            { name: "Lẩu mắm", desc: "Đặc sản miền Tây với hương vị mắm cá linh đậm đà và hàng chục loại rau đồng." },
            { name: "Vịt nấu chao", desc: "Thịt vịt nấu với chao béo ngậy, ăn kèm bún và rau muống." }
        ]
    },
    "Phú Quốc": {
        places: [
            { name: "Bãi Sao", desc: "Bãi biển đẹp nhất đảo ngọc với cát trắng mịn như kem." },
            { name: "VinWonders Phú Quốc", desc: "Công viên chủ đề lớn nhất Việt Nam." },
            { name: "Grand World", desc: "Thành phố không ngủ với dòng sông Venice thu nhỏ." },
            { name: "Nhà tù Phú Quốc", desc: "Di tích lịch sử hào hùng, nơi được gọi là địa ngục trần gian." }
        ],
        dishes: [
            { name: "Gỏi cá trích", desc: "Món gỏi tươi sống cuốn bánh tráng, dừa nạo và rau rừng." },
            { name: "Bún quậy", desc: "Món bún độc lạ thực khách phải tự pha nước chấm và chờ đợi." },
            { name: "Ghẹ Hàm Ninh", desc: "Ghẹ chắc thịt, ngọt tự nhiên, chỉ cần hấp chấm muối tiêu chanh." }
        ]
    },
    "Côn Đảo": {
        places: [
            { name: "Nhà tù Côn Đảo", desc: "Hệ thống nhà tù lịch sử, nơi ghi dấu sự hy sinh của các anh hùng." },
            { name: "Mộ cô Sáu", desc: "Điểm du lịch tâm linh linh thiêng tại nghĩa trang Hàng Dương." },
            { name: "Bãi Đầm Trầu", desc: "Bãi biển hoang sơ nằm ngay cạnh sân bay Cỏ Ống." }
        ],
        dishes: [
            { name: "Cháo hàu", desc: "Cháo hàu bổ dưỡng, nóng hổi, đặc sản Côn Đảo." },
            { name: "Cua mặt trăng", desc: "Loại cua quý hiếm có hình dáng lạ mắt và thịt rất ngọt." }
        ]
    }
};

// HÀM CHẠY SEED
async function seedMassive() {
    console.log(`🚀 BẮT ĐẦU NẠP DỮ LIỆU KHỔNG LỒ VÀO HỆ THỐNG...`);
    
    // 1. ĐĂNG NHẬP LẤY TOKEN
    let token = null;
    try {
        console.log(`🔑 Đang đăng nhập admin...`);
        const loginRes = await axios.post(`${AUTH_URL}/login`, CREDENTIALS);
        token = loginRes.data.data.accessToken || loginRes.data.data.token;
        console.log(`✅ Đăng nhập thành công! Token: ${token.substring(0, 10)}...`);
    } catch (e) {
        console.error(`❌ Đăng nhập thất bại: ${e.message}`);
        console.error(`   Vui lòng kiểm tra lại server hoặc tài khoản admin.`);
        return;
    }

    // Config Header Auth
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    let totalCount = 0;
    const provinces = Object.keys(DATA_SOURCE);

    for (const province of provinces) {
        const data = DATA_SOURCE[province];
        console.log(`\n📂 Đang xử lý tỉnh: ${province}...`);

        // 2. Thêm địa điểm (Places)
        for (const place of data.places) {
            try {
                process.stdout.write(`   [Place] ${place.name}... `);
                await axios.post(`${API_URL}/place`, {
                    name: place.name,
                    province: province,
                    description: place.desc
                }, config);
                process.stdout.write(`✅\n`);
                totalCount++;
            } catch (e) {
                process.stdout.write(`❌ Lỗi: ${e.message}\n`);
            }
            await new Promise(r => setTimeout(r, 100)); // Delay nhẹ
        }

        // 3. Thêm món ăn (Dishes)
        if (data.dishes) {
            for (const dish of data.dishes) {
                try {
                    process.stdout.write(`   [Dish]  ${dish.name}... `);
                    await axios.post(`${API_URL}/dish`, {
                        name: dish.name,
                        province: province,
                        description: dish.desc
                    }, config);
                    process.stdout.write(`✅\n`);
                    totalCount++;
                } catch (e) {
                    process.stdout.write(`❌ Lỗi: ${e.message}\n`);
                }
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    console.log(`\n🎉 HOÀN TẤT! Đã nạp thành công ${totalCount} mục dữ liệu chất lượng cao.`);
    console.log(`👉 Giờ hãy chạy lại test-full-flow.js để xem Bot thông minh cỡ nào!`);
}

seedMassive();