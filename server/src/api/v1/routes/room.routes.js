const express = require('express');
const RoomController = require('../controllers/room.controller');

const router = express.Router();
const roomController = new RoomController();

// Create room
router.post('/', async (req, res) => {
  await roomController.createRoom(req, res);
});

// Get all rooms
router.get('/', async (req, res) => {
  await roomController.getAllRooms(req, res);
});

// Search rooms with filters
router.get('/search', async (req, res) => {
  await roomController.searchRooms(req, res);
});

// Get rooms by status
router.get('/status/:status', async (req, res) => {
  await roomController.getRoomsByStatus(req, res);
});

// Get rooms by hotel
router.get('/hotel/:hotelId', async (req, res) => {
  await roomController.getRoomsByHotelId(req, res);
});

// Get available rooms by hotel
router.get('/hotel/:hotelId/available', async (req, res) => {
  await roomController.getAvailableRooms(req, res);
});

// Get room statistics by hotel
router.get('/hotel/:hotelId/stats', async (req, res) => {
  await roomController.getRoomStatsByHotel(req, res);
});

// Get rooms by room type
router.get('/room-type/:roomTypeId', async (req, res) => {
  await roomController.getRoomsByRoomTypeId(req, res);
});

// Get room by ID
router.get('/:id', async (req, res) => {
  await roomController.getRoomById(req, res);
});

// Get room with details
router.get('/:id/details', async (req, res) => {
  await roomController.getRoomWithDetails(req, res);
});

// Check room availability
router.get('/:id/availability', async (req, res) => {
  await roomController.checkRoomAvailability(req, res);
});

// Update room
router.put('/:id', async (req, res) => {
  await roomController.updateRoom(req, res);
});

// Update room status
router.patch('/:id/status', async (req, res) => {
  await roomController.updateRoomStatus(req, res);
});

// Delete room
router.delete('/:id', async (req, res) => {
  await roomController.deleteRoom(req, res);
});

module.exports = router;