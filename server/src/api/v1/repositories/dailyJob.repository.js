// src/api/v1/repositories/dailyJob.repository.js


const pool = require('../../../config/db');

// Hàm cập nhật trạng thái khách sạn dựa vào hợp đồng
const updateHotelStatusByContract = async () => {
  const query = `
    UPDATE hotels h
    SET status = CASE
        WHEN EXISTS (
            SELECT 1
            FROM contracts c
            WHERE c.hotel_id = h.hotel_id
              AND c.status = 'active'
              AND c.start_date <= CURRENT_DATE
              AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
        )
        THEN 'active'
        WHEN EXISTS (
            SELECT 1
            FROM contracts c
            WHERE c.hotel_id = h.hotel_id
              AND c.status IN ('active', 'expired')
              AND c.end_date IS NOT NULL
              AND c.end_date < CURRENT_DATE
        )
        THEN 'inactive'
        ELSE h.status
    END
    WHERE EXISTS (
        SELECT 1
        FROM contracts c
        WHERE c.hotel_id = h.hotel_id
    )
    AND h.status IN ('active', 'inactive', 'approved');
  `;
  const result = await pool.query(query);
  return { rowCount: result.rowCount };
};

// Hàm cập nhật hợp đồng hết hạn
const updateExpiredContracts = async () => {
  const query = `
    UPDATE contracts
    SET status = 'expired'
    WHERE status = 'active'
      AND end_date IS NOT NULL
      AND end_date <= CURRENT_DATE;
  `;
  const result = await pool.query(query);
  return { rowCount: result.rowCount };
};

// Đây là nơi thao tác DB nếu cần
const doJob = async () => {
  // Gọi hàm cập nhật trạng thái khách sạn
  const updateResult = await updateHotelStatusByContract();
  return `Đã cập nhật trạng thái cho ${updateResult.rowCount} khách sạn.`;
};

// Tìm hợp đồng sắp hết hạn trong N ngày
const findContractsExpiringInDays = async (days) => {
  const query = `
    SELECT contracts.*, hotels.name
    FROM contracts
    JOIN hotels ON contracts.hotel_id = hotels.hotel_id
    WHERE end_date = CURRENT_DATE + INTERVAL '${days} days'
      AND contracts.status = 'active';
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Hàm cụ thể cho từng mốc ngày
const findContractsExpiringIn90Days = () => findContractsExpiringInDays(90);
const findContractsExpiringIn60Days = () => findContractsExpiringInDays(60);
const findContractsExpiringIn30Days = () => findContractsExpiringInDays(30);
const findContractsExpiringIn3Days = () => findContractsExpiringInDays(3);
const findContractsExpiringIn1Day = () => findContractsExpiringInDays(1);

// Hàm cập nhật hợp đồng từ pending thành draft sau N ngày
const updatePendingContractsToDraft = async (days) => {
  const query = `
    UPDATE contracts
    SET status = 'draft'
    WHERE status = 'pending'
      AND created_at <= NOW() - INTERVAL '${days} days';
  `;
  const result = await pool.query(query);
  return { rowCount: result.rowCount };
};

// Lấy danh sách hợp đồng pending quá N ngày
const getPendingContractsOverDays = async (days) => {
  const query = `
    SELECT contract_id, hotel_id, user_id
    FROM contracts
    WHERE status = 'pending' AND created_at <= NOW() - INTERVAL '${days} days'
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Cập nhật trạng thái promotions theo ngày (inactive nếu hết hạn, active nếu đã đến ngày bắt đầu)
const updatePromotionStatusByDate = async () => {
  const query = `
    UPDATE promotions
    SET status = CASE
        WHEN valid_until < NOW() THEN 'inactive'
        WHEN status = 'approved' AND valid_from <= NOW() THEN 'active'
        ELSE status
    END
    WHERE (status IN ('approved', 'active') AND valid_until < NOW())
       OR (status = 'approved' AND valid_from <= NOW());
  `;
  const result = await pool.query(query);
  return { rowCount: result.rowCount };
};

const autoApprovePromotions = async () => {
  const query = `
    UPDATE promotions
    SET status = CASE
        WHEN 
            LENGTH(name) >= 5
            AND LENGTH(code) >= 5
            AND discount_value <= 20
            AND min_booking_price > 0
            AND max_discount_amount >= (discount_value / 100) * min_booking_price
            AND valid_from < valid_until
            AND usage_limit > 0
            AND status = 'pending'
        THEN 'approved'
        ELSE 'rejected'
    END
    WHERE status = 'pending';
  `;
  const result = await pool.query(query);
  return { rowCount: result.rowCount };
};

module.exports = {
  doJob,
  updateHotelStatusByContract,
  updateExpiredContracts,
  findContractsExpiringIn90Days,
  findContractsExpiringIn60Days,
  findContractsExpiringIn30Days,
  findContractsExpiringIn3Days,
  findContractsExpiringIn1Day,
  updatePendingContractsToDraft,
  getPendingContractsOverDays,
  updatePromotionStatusByDate,
  autoApprovePromotions
};