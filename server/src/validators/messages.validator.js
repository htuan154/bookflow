'use strict';

const Joi = require('joi');

exports.sendText = Joi.object({
  conversation_id: Joi.string().required(),
  text: Joi.string().allow('').max(4000).required(),
  links: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      image_url: Joi.string().uri().optional()
    })
  ).default([])
});

exports.sendFile = Joi.object({
  conversation_id: Joi.string().required(),
  text: Joi.string().allow('').max(4000).optional(),
  attachments: Joi.array().items(
    Joi.object({
      gridfs_id: Joi.alternatives(Joi.string(), Joi.object()).required(),
      file_name: Joi.string().required(),
      mime_type: Joi.string().required(),
      size: Joi.number().integer().min(1).required()
    })
  ).min(1).required()
});

exports.history = Joi.object({
  conversation_id: Joi.string().required(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  cursor: Joi.string().optional()
});

exports.markRead = Joi.object({
  conversation_id: Joi.string().required(),
  last_read_message_id: Joi.string().required()
});
