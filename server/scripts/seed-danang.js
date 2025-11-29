'use strict';
require('dotenv').config();
const { addDocument } = require('../src/api/v1/services/vector.service'); 

async function seed() {
  console.log('🚀 Đang nạp dữ liệu Cầu Rồng (Full Info)...');

  // Cập nhật nội dung đầy đủ: Vị trí (Hải Châu/Sơn Trà) + Tính năng (Phun lửa)
  await addDocument({
    content: 'Cầu Rồng Đà Nẵng. Địa chỉ: Đường Nguyễn Văn Linh, thuộc phường Phước Ninh, quận Hải Châu, nối liền với quận Sơn Trà. Cây cầu bắc qua sông Hàn với thiết kế hình con rồng vàng. Điểm đặc biệt là cầu có khả năng phun lửa và phun nước vào dịp cuối tuần (Thứ 7, Chủ Nhật lúc 21:00).',
    metadata: { name: 'Cầu Rồng', type: 'place', province: 'Đà Nẵng' }
  });
  console.log('✅ Đã update: Cầu Rồng (Có địa chỉ quận Hải Châu)');

  console.log('🎉 Hoàn tất! Hãy chạy lại test.');
  process.exit(0);
}

seed();