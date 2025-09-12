'use strict';

const Joi = require('joi');

exports.uploadBase64 = Joi.object({
  file_name: Joi.string().min(1).max(255).required(),
  mime_type: Joi.string().min(1).required(),
  file_base64: Joi.string().base64({ paddingRequired: false }).required()
});
