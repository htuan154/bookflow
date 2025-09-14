'use strict';

const Joi = require('joi');
const { create } = require('../api/v1/repositories/contract.repository');

exports.createDM = Joi.object({
  hotel_id: Joi.string().required(),
  admin_id: Joi.string().required(),
  owner_id: Joi.string().required(),
  created_by: Joi.string().required()
});

exports.createGroupA = Joi.object({
  hotel_id: Joi.string().required(),
  name: Joi.string().min(1).max(200).required(),
  owner_id: Joi.string().required(),
  admin_ids: Joi.array().items(Joi.string()).default([]),
  staff_ids: Joi.array().items(Joi.string()).default([])
});

exports.createGroupB = Joi.object({
  hotel_id: Joi.string().required(),
  name: Joi.string().min(1).max(200).default('Owner & All Staff'),
  owner_id: Joi.string().required(),
  staff_ids: Joi.array().items(Joi.string()).default([])
});

exports.list = Joi.object({
  hotel_id: Joi.string().optional(),
  type: Joi.string().valid('dm', 'group').optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  skip: Joi.number().integer().min(0).default(0)
});
