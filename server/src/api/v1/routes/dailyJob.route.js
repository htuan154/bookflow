// src/api/v1/routes/dailyJob.route.js
const express = require('express');
const router = express.Router();
const dailyJobController = require('../controllers/dailyJob.controller');

// GET các hợp đồng sắp hết hạn trong 90, 60, 30, 3, 1 ngày
router.get('/contracts-expiring-in-90-days', dailyJobController.contractsExpiringIn90Days);
router.get('/contracts-expiring-in-60-days', dailyJobController.contractsExpiringIn60Days);
router.get('/contracts-expiring-in-30-days', dailyJobController.contractsExpiringIn30Days);
router.get('/contracts-expiring-in-3-days', dailyJobController.contractsExpiringIn3Days);
router.get('/contracts-expiring-in-1-day', dailyJobController.contractsExpiringIn1Day);

// POST cập nhật trạng thái khách sạn theo hợp đồng
router.post('/update-hotel-status', dailyJobController.updateHotelStatus);

// POST cập nhật hợp đồng hết hạn
router.post('/update-expired-contracts', dailyJobController.updateExpiredContracts);

// POST cập nhật hợp đồng từ pending thành draft sau N ngày
router.post('/update-pending-contracts-to-draft', dailyJobController.updatePendingContractsToDraft);

// Lấy danh sách hợp đồng pending quá N ngày
router.get('/pending-contracts-over-days/:days', dailyJobController.getPendingContractsOverDays);

module.exports = router;