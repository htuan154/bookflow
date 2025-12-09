'use strict';

const { z } = require('zod');

// Định nghĩa schema cho một item (địa điểm, món ăn, ...)
// - name: Bắt buộc, chuỗi, ít nhất 1 ký tự
// - hint: Không bắt buộc, chuỗi (gợi ý thêm)
// - where: Không bắt buộc, chuỗi (địa chỉ/vị trí)
// - type: Không bắt buộc, chuỗi (loại item)
const ItemSchema = z.object({
  name: z.string().min(1), // Tên item, bắt buộc
  hint: z.string().optional(), // Tên item, bắt buộc
  where: z.string().optional(), // Tên item, bắt buộc
  type: z.string().optional() // Loại item, bắt buộc
});

// Định nghĩa schema cho response trả về:
// - province: Bắt buộc, chuỗi, tên tỉnh/thành phố
// - places: Mảng các địa điểm (ItemSchema), mặc định []
// - dishes: Mảng các món ăn (ItemSchema), mặc định []
// - tips: Mảng các mẹo/gợi ý (chuỗi), mặc định []
// - source: Nguồn dữ liệu, chỉ nhận 1 trong 3 giá trị ('nosql', 'nosql+llm', 'fallback'), mặc định 'nosql+llm'
const ResponseSchema = z.object({
  province: z.string().min(1), // Tên tỉnh/thành phố, bắt buộc
  places: z.array(ItemSchema).default([]), // Danh sách địa điểm, mặc định []
  dishes: z.array(ItemSchema).default([]), // Danh sách món ăn, mặc định []
  tips: z.array(z.string()).default([]), // Danh sách mẹo/gợi ý, mặc định []
  source: z.enum(['nosql', 'nosql+llm', 'fallback']).default('nosql+llm') // Nguồn dữ liệu, mặc định 'nosql+llm'
});

// Hàm lọc lại các trường places và dishes trong response,
// chỉ giữ lại những item có tên nằm trong danh sách cho phép (doc)
// Mục đích: Đảm bảo chỉ trả về các địa điểm/món ăn hợp lệ, tránh dữ liệu lạ hoặc không mong muốn
function enforceWhitelist(resp, doc) {
  // Tạo tập hợp tên các địa điểm hợp lệ từ doc
  const allowedPlaces = new Set((doc.places || []).map(x => x.name));
  // Tạo tập hợp tên các món ăn hợp lệ từ doc
  const allowedDishes = new Set((doc.dishes || []).map(x => x.name));
  // Lọc lại danh sách places, chỉ giữ những item có tên nằm trong allowedPlaces
  resp.places = (resp.places || []).filter(x => allowedPlaces.has(x.name));
  // Lọc lại danh sách dishes, chỉ giữ những item có tên nằm trong allowedDishes
  resp.dishes = (resp.dishes || []).filter(x => allowedDishes.has(x.name));
  // Trả về response đã được lọc
  return resp;
}

// Hàm validateResponse: Kiểm tra và lọc response dựa trên schema và doc
function validateResponse(resp, doc) {
  const parsed = ResponseSchema.parse(resp);
  return enforceWhitelist(parsed, doc);
}

module.exports = { validateResponse };
