// src/api/v1/controllers/dailyJob.controller.js
const dailyJobService = require('../services/dailyJob.service');

// GET /api/v1/dailyjob/contracts-expiring-in-90-days
const contractsExpiringIn90Days = async (req, res, next) => {
  try {
    const result = await dailyJobService.findContractsExpiringIn90Days();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dailyjob/contracts-expiring-in-60-days
const contractsExpiringIn60Days = async (req, res, next) => {
  try {
    const result = await dailyJobService.findContractsExpiringIn60Days();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dailyjob/contracts-expiring-in-30-days
const contractsExpiringIn30Days = async (req, res, next) => {
  try {
    const result = await dailyJobService.findContractsExpiringIn30Days();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dailyjob/contracts-expiring-in-3-days
const contractsExpiringIn3Days = async (req, res, next) => {
  try {
    const result = await dailyJobService.findContractsExpiringIn3Days();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dailyjob/contracts-expiring-in-1-day
const contractsExpiringIn1Day = async (req, res, next) => {
  try {
    const result = await dailyJobService.findContractsExpiringIn1Day();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/dailyjob/update-hotel-status
const updateHotelStatus = async (req, res, next) => {
  try {
    const result = await dailyJobService.updateHotelStatusByContract();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/dailyjob/update-expired-contracts
const updateExpiredContracts = async (req, res, next) => {
  try {
    const result = await dailyJobService.updateExpiredContracts();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/dailyjob/update-pending-contracts-to-draft
const updatePendingContractsToDraft = async (req, res, next) => {
  try {
    const { days } = req.body;
    
    // Validate days parameter
    if (!days || !Number.isInteger(days) || days <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'days parameter is required and must be a positive integer' 
      });
    }
    
    const result = await dailyJobService.updatePendingContractsToDraft(days);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dailyjob/pending-contracts-over-days/:days
const getPendingContractsOverDays = async (req, res, next) => {
  try {
    const days = parseInt(req.params.days, 10);
    if (!days || days <= 0) {
      return res.status(400).json({ success: false, message: 'days parameter is required and must be a positive integer' });
    }
    const result = await dailyJobService.getPendingContractsOverDays(days);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateHotelStatus,
  updateExpiredContracts,
  contractsExpiringIn90Days,
  contractsExpiringIn60Days,
  contractsExpiringIn30Days,
  contractsExpiringIn3Days,
  contractsExpiringIn1Day,
  updatePendingContractsToDraft,
  getPendingContractsOverDays
};