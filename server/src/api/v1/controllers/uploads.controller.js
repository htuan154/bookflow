'use strict';

const uploadsSvc = require('../services/uploads.service');
const v = require('../../../validators/uploads.validator');

/**
 * Nhận file theo 2 cách:
 * 1) JSON base64: { file_name, mime_type, file_base64 }
 * 2) (tùy) nếu bạn có middleware multipart -> req.file.buffer
 */
exports.upload = async (req, res, next) => {
  try {
    // Case multipart (nếu đã dùng multer và có req.file)
    if (req.file && req.file.buffer) {
      const meta = await uploadsSvc.saveBufferToGridFS({
        buffer: req.file.buffer,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype
      });
      return res.json(meta);
    }

    // Case JSON base64
    const { value, error } = v.uploadBase64.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const buffer = Buffer.from(value.file_base64, 'base64');
    const meta = await uploadsSvc.saveBufferToGridFS({
      buffer,
      file_name: value.file_name,
      mime_type: value.mime_type
    });
    res.json(meta);
  } catch (e) { next(e); }
};
