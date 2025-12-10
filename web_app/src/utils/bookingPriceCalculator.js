// src/utils/bookingPriceCalculator.js

/**
 * Tính giá booking theo từng đêm với seasonal pricing
 * @param {Date} checkInDate - Ngày check-in
 * @param {Date} checkOutDate - Ngày check-out
 * @param {number} basePrice - Giá gốc của phòng
 * @param {number} numRooms - Số phòng
 * @param {Array} seasonalPricings - Danh sách seasonal pricing
 * @returns {Object} { nightlyPrices: Array, totalPrice: number }
 */
export const calculateBookingPrice = (
  checkInDate,
  checkOutDate,
  basePrice,
  numRooms,
  seasonalPricings = []
) => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) {
    return { nightlyPrices: [], totalPrice: 0 };
  }

  const nightlyPrices = [];
  let totalPrice = 0;

  // Duyệt qua từng ngày
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = new Date(checkIn);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    
    // Normalize ngày về 00:00:00 UTC để so sánh chính xác
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    // Tìm seasonal pricing áp dụng cho ngày hiện tại
    let applicableSeasonalPricing = null;
    for (const pricing of seasonalPricings) {
      // Ưu tiên camelCase (từ API) trước, fallback về snake_case
      const startDate = new Date(pricing.startDate || pricing.start_date);
      const endDate = new Date(pricing.endDate || pricing.end_date);
      
      // Normalize ngày start và end về 00:00:00 để so sánh chính xác
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      // Debug log
      if (dayOffset === 0) {
        console.log(`Checking pricing "${pricing.name}":`, {
          currentDate: currentDateOnly.toISOString().split('T')[0],
          startDate: startDateOnly.toISOString().split('T')[0],
          endDate: endDateOnly.toISOString().split('T')[0],
          matches: currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly
        });
      }
      
      if (currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly) {
        applicableSeasonalPricing = pricing;
        console.log(`✅ Applied "${pricing.name}" on ${currentDateOnly.toISOString().split('T')[0]}`);
        break;
      }
    }

    let dailyPrice;
    let seasonInfo = null;

    if (applicableSeasonalPricing) {
      // Ưu tiên camelCase (từ API) trước
      const priceModifier = parseFloat(applicableSeasonalPricing.priceModifier || applicableSeasonalPricing.price_modifier || 1);
      dailyPrice = basePrice * priceModifier;
      seasonInfo = {
        name: applicableSeasonalPricing.name || applicableSeasonalPricing.season_name,
        modifier: priceModifier,
        id: applicableSeasonalPricing.pricingId || applicableSeasonalPricing.pricing_id || applicableSeasonalPricing.id,
      };
    } else {
      dailyPrice = basePrice;
    }

    nightlyPrices.push({
      date: currentDate.toISOString().split('T')[0],
      basePrice: basePrice,
      dailyPrice: dailyPrice,
      seasonInfo: seasonInfo,
      numRooms: numRooms,
      totalDailyPrice: dailyPrice * numRooms,
    });

    totalPrice += dailyPrice * numRooms;
  }

  return {
    nightlyPrices,
    totalPrice,
    totalDays,
    numRooms,
  };
};

/**
 * Format giá VND
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Tạo message text chi tiết booking với bảng giá
 */
export const createBookingDetailMessage = (bookingData) => {
  const {
    roomTypeName,
    checkInDate,
    checkOutDate,
    numGuests,
    numRooms,
    nightlyPrices,
    totalPrice,
    userInfo,
  } = bookingData;

  let message = `THÔNG TIN ĐẶT PHÒNG\n\n`;
  
  if (userInfo) {
    message += `Khách hàng: ${userInfo.fullName || userInfo.full_name || 'N/A'}\n`;
    message += `Email: ${userInfo.email || 'N/A'}\n`;
    message += `SĐT: ${userInfo.phoneNumber || userInfo.phone_number || 'N/A'}\n\n`;
  }

  message += `Loại phòng: ${roomTypeName}\n`;
  message += `Check-in: ${new Date(checkInDate).toLocaleDateString('vi-VN')}\n`;
  message += `Check-out: ${new Date(checkOutDate).toLocaleDateString('vi-VN')}\n`;
  message += `Số khách: ${numGuests}\n`;
  message += `Số phòng: ${numRooms}\n\n`;

  message += `CHI TIẾT GIÁ THEO TỪNG NGÀY:\n`;
  message += `${'─'.repeat(50)}\n`;

  nightlyPrices.forEach((night, index) => {
    const currentDate = new Date(night.date);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dateFrom = currentDate.toLocaleDateString('vi-VN');
    const dateTo = nextDate.toLocaleDateString('vi-VN');
    const seasonText = night.seasonInfo
      ? ` (${night.seasonInfo.name} x${night.seasonInfo.modifier})`
      : ' (Giá thường)';
    
    message += `Ngày ${index + 1} (${dateFrom} -> ${dateTo})\n`;
    message += `Giá gốc: ${formatPrice(night.basePrice)} × ${numRooms} phòng${seasonText}\n`;
    message += `Thành tiền: ${formatPrice(night.totalDailyPrice)}\n`;
    message += `\n`; // Xuống dòng sau mỗi ngày
  });

  message += `${'─'.repeat(50)}\n`;
  message += `💵 TỔNG CỘNG: ${formatPrice(totalPrice)}\n`;

  return message;
};

/**
 * Tạo message khi không có phòng phù hợp
 */
export const createNoRoomAvailableMessage = () => {
  return "Xin lỗi anh/chị, hiện tại chúng tôi không thể đáp ứng yêu cầu của anh/chị, nhưng chúng tôi sẵn sàng hỗ trợ tìm giải pháp thay thế phù hợp hoặc giúp anh/chị lựa chọn một phương án khác.";
};
