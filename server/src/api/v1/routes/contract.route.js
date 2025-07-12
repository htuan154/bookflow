const express = require('express');
const contractController = require('../controllers/contract.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createContractSchema, updateStatusSchema } = require('../../../validators/contract.validator');

const router = express.Router();

// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// --- ADMIN-ONLY ROUTES ---
router.post(
    '/',
    authorize(['admin']),
    validate(createContractSchema),
    contractController.createContract
);

router.patch(
    '/:id/status',
    authorize(['admin']),
    validate(updateStatusSchema),
    contractController.updateContractStatus
);

// --- ADMIN & HOTEL OWNER ROUTES ---
router.get(
    '/:id',
    authorize(['admin', 'hotel_owner']),
    contractController.getContractById
);

router.get(
    '/hotels/:hotelId/contracts',
    authorize(['admin', 'hotel_owner']),
    contractController.getContractsByHotel
);

module.exports = router;
