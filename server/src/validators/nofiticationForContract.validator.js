
'use strict';

const Joi = require('joi');

exports.createNotification = Joi.object({
  contract_id: Joi.string().allow(null).optional(),
  sender_id: Joi.string().required(),
  receiver_id: Joi.string().required(),
  title: Joi.string().min(1).max(255).required(),
  message: Joi.string().min(1).required(),
  notification_type: Joi.string().min(1).max(50).required(),
  hotel_id: Joi.string().optional(),
});
