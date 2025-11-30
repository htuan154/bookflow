'use strict';

const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');

/**
 * Admin Data Sync Routes
 * Mounted at: /api/v1/data
 * 
 * TODO: Add admin authentication middleware
 * Example: const { authenticateAdmin } = require('../middlewares/auth.middleware');
 * Then: router.use(authenticateAdmin);
 */

/* #swagger.tags = ['Data Sync']
   #swagger.summary = 'Add a tourist place'
   #swagger.description = 'Auto-generates keywords using AI and syncs to MongoDB + Supabase Vector'
   #swagger.requestBody = {
     required: true,
     content: {
       "application/json": {
         schema: {
           type: "object",
           required: ["name", "province"],
           properties: {
             name: { type: "string", example: "Đại Nội Huế" },
             province: { type: "string", example: "Huế" },
             description: { type: "string", example: "Quần thể di tích cung điện triều Nguyễn" }
           }
         }
       }
     }
   }
*/
router.post('/place', dataController.addPlaceHandler);

/* #swagger.tags = ['Data Sync']
   #swagger.summary = 'Add a local dish'
   #swagger.description = 'Auto-generates keywords using AI and syncs to MongoDB + Supabase Vector'
   #swagger.requestBody = {
     required: true,
     content: {
       "application/json": {
         schema: {
           type: "object",
           required: ["name", "province"],
           properties: {
             name: { type: "string", example: "Bún bò Huế" },
             province: { type: "string", example: "Huế" },
             description: { type: "string", example: "Món bún cay đặc trưng của xứ Huế" }
           }
         }
       }
     }
   }
*/
router.post('/dish', dataController.addDishHandler);

module.exports = router;
