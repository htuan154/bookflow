'use strict';

/**
 * Data Controller - Admin API for adding Places & Dishes
 * Auto-sync to MongoDB + Supabase Vector
 */

const dataService = require('../services/data.service');

/**
 * POST /api/v1/data/place
 * Thêm địa điểm du lịch
 */
async function addPlaceHandler(req, res, next) {
  try {
    const { name, province, description } = req.body;

    // Validation
    if (!name || !province) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'name and province are required'
      });
    }

    console.log(`[DataController] Adding place: ${name} in ${province}`);

    const result = await dataService.addPlace({
      name: String(name).trim(),
      province: String(province).trim(),
      description: description ? String(description).trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Place added and synced successfully',
      data: result.data
    });
  } catch (error) {
    console.error('[DataController] addPlaceHandler error:', error);
    next(error);
  }
}

/**
 * POST /api/v1/data/dish
 * Thêm món ăn đặc sản
 */
async function addDishHandler(req, res, next) {
  try {
    const { name, province, description } = req.body;

    // Validation
    if (!name || !province) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'name and province are required'
      });
    }

    console.log(`[DataController] Adding dish: ${name} in ${province}`);

    const result = await dataService.addDish({
      name: String(name).trim(),
      province: String(province).trim(),
      description: description ? String(description).trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Dish added and synced successfully',
      data: result.data
    });
  } catch (error) {
    console.error('[DataController] addDishHandler error:', error);
    next(error);
  }
}

module.exports = {
  addPlaceHandler,
  addDishHandler
};
