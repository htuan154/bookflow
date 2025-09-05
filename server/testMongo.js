require('dotenv').config();
const { connectDB } = require('./src/config/mongodb');

(async () => {
  try {
    const db = await connectDB();
    const colName = process.env.MONGO_COLLECTION || 'provinces'; // fallback nếu bạn đổi tên
    const col = db.collection(colName);

    // Đếm tổng số doc
    const total = await col.countDocuments();
    console.log(`✅ Tổng số document trong ${colName}:`, total);

    // In thử 3 bản ghi đầu (chỉ name cho gọn)
    const sample = await col.find({}, { projection: { _id: 0, name: 1 } })
                            .limit(3).toArray();
    console.log('📂 3 bản ghi mẫu:', sample);

    // Kiểm tra nhanh các trường chính của 1 doc
    const one = await col.findOne({}, { projection: { _id: 0, name: 1, norm: 1, aliases: 1, places: 1, dishes: 1 } });
    console.log('🔎 Một doc mẫu:', {
      name: one?.name,
      nPlaces: one?.places?.length || 0,
      nDishes: one?.dishes?.length || 0
    });
  } catch (err) {
    console.error('❌ Lỗi test:', err);
    process.exit(1);
  } finally {
    // script test: có thể process.exit(0) cho nhanh
    process.exit(0);
  }
})();
