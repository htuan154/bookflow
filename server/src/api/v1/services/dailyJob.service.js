// src/api/v1/services/dailyJob.service.js
const dailyJobRepo = require('../repositories/dailyJob.repository');

// Cho phép gọi trực tiếp updateHotelStatusByContract qua API
const updateHotelStatusByContract = async () => {
  const result = await dailyJobRepo.updateHotelStatusByContract();
  return { message: `Đã cập nhật trạng thái cho khách sạn.` };
};

// Cho phép gọi trực tiếp updateExpiredContracts qua API
const updateExpiredContracts = async () => {
  const result = await dailyJobRepo.updateExpiredContracts();
  return { 
    message: `Đã cập nhật ${result.rowCount} hợp đồng hết hạn.`,
    updatedCount: result.rowCount 
  };
};

// Tìm hợp đồng sắp hết hạn trong 90, 60, 30, 3, 1 ngày
const findContractsExpiringIn90Days = async () => {
  return await dailyJobRepo.findContractsExpiringIn90Days();
};
const findContractsExpiringIn60Days = async () => {
  return await dailyJobRepo.findContractsExpiringIn60Days();
};
const findContractsExpiringIn30Days = async () => {
  return await dailyJobRepo.findContractsExpiringIn30Days();
};
const findContractsExpiringIn3Days = async () => {
  return await dailyJobRepo.findContractsExpiringIn3Days();
};
const findContractsExpiringIn1Day = async () => {
  return await dailyJobRepo.findContractsExpiringIn1Day();
};

// Cập nhật hợp đồng từ pending thành draft sau N ngày
const updatePendingContractsToDraft = async (days) => {
  const result = await dailyJobRepo.updatePendingContractsToDraft(days);
  return { 
    message: `Đã cập nhật ${result.rowCount} hợp đồng từ pending thành draft sau ${days} ngày.`,
    updatedCount: result.rowCount,
    days: days
  };
};

// Lấy danh sách hợp đồng pending quá N ngày
const getPendingContractsOverDays = async (days) => {
  return await dailyJobRepo.getPendingContractsOverDays(days);
};

module.exports = {
  updateHotelStatusByContract,
  updateExpiredContracts,
  findContractsExpiringIn90Days,
  findContractsExpiringIn60Days,
  findContractsExpiringIn30Days,
  findContractsExpiringIn3Days,
  findContractsExpiringIn1Day,
  updatePendingContractsToDraft,
  getPendingContractsOverDays
};