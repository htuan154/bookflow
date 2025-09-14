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
    authorize(['hotel_owner']),
    validate(createContractSchema),
    contractController.createContract
);
//Cập nhật hợp đồng ngày 24/8
// Chủ khách sạn được update hợp đồng của mình
router.patch(
    '/:id',
    authorize(['hotel_owner']),
    contractController.updateContract
);
// xóa hợp đồng ngày 24/8
// Xóa hợp đồng (chỉ chủ khách sạn được xóa hợp đồng của chính mình)
router.delete(
    '/:id',
    authorize(['hotel_owner']),
    contractController.deleteContract
);


router.patch(
    '/:id/status',
    authorize(['admin']),
    validate(updateStatusSchema),
    contractController.updateContractStatus
);

// ✅ Thêm API lấy hợp đồng theo trạng thái (Admin)
router.get(
    '/status/:status',
    authorize(['admin']),
    contractController.getContractsByStatus
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

// ✅ Thêm API lấy tất cả hợp đồng (Admin only)
router.get(
    '/',
    authorize(['admin','hotel_owner']),
    contractController.getAllContracts
);
// Chủ khách sạn gửi duyệt hợp đồng (draft -> pending)
router.patch(
    '/:id/send-for-approval',
    authorize(['hotel_owner']),
    contractController.sendForApproval
);


module.exports = router;
