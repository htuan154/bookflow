// src/api/v1/services/roomAssignment.service.js
const RoomAvailable = require('../../../models/roomAvailable.model');
const roomAssignmentRepository = require('../repositories/roomAssignment.repository');
const RoomRepository = require('../repositories/room.repository');
const roomRepository = new RoomRepository();
const bookingDetailRepository = require('../repositories/bookingDetail.repository'); // Giả định đã có
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');
const hotelStaffRepository = require('../repositories/hotelStaff.repository');

class RoomAssignmentService {
    /**
     * Gán một phòng cụ thể cho một chi tiết đặt phòng.
     * @param {object} assignmentData - Dữ liệu gán phòng.
     * @param {string} userId - ID của người dùng thực hiện (chủ khách sạn/nhân viên).
     * @returns {Promise<RoomAssignment>}
     */
    async assignRoomToBooking(assignmentData, userId, userRole) {
        const { booking_detail_id, room_id } = assignmentData;

        // --- Kiểm tra nghiệp vụ ---
        // 1. Kiểm tra chi tiết đặt phòng có tồn tại không
        const bookingDetail = await bookingDetailRepository.findById(booking_detail_id);
        if (!bookingDetail) {
            throw new AppError('Booking detail not found', 404);
        }

        // 2. Kiểm tra phòng có tồn tại và có sẵn sàng không
        const room = await roomRepository.findById(room_id);
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        if (room.status !== 'available') {
            throw new AppError(`Room ${room.roomNumber} is not available for assignment`, 400);
        }

        // 3. Kiểm tra quyền role
        console.log('User role in service:', userRole);
        if (userRole !== 'hotel_owner' && userRole !== 'hotel_staff') {
            throw new AppError('Forbidden', 403);
        }

        // 4. Kiểm tra quyền sở hữu hoặc staff thuộc khách sạn
        if (userRole === 'hotel_owner' || userRole === 'hotel_staff') {
            const hotelInfo = await roomAssignmentRepository.findHotelByRoomId(room_id);
            if (!hotelInfo) {
                throw new AppError('Hotel information not found for this room', 404);
            }
            if (userRole === 'hotel_owner') {
                if (hotelInfo.owner_id !== userId) {
                    throw new AppError('Forbidden: You do not have permission to assign rooms for this hotel', 403);
                }
            } else if (userRole === 'hotel_staff') {
                // Kiểm tra staff có thuộc khách sạn này không
                const staff = await hotelStaffRepository.findByUserIdAndHotelId(userId, hotelInfo.hotel_id);
                if (!staff) {
                    throw new AppError('Forbidden: You do not have permission to assign rooms for this hotel', 403);
                }
            }
        }

        // --- Thực hiện gán phòng và cập nhật trạng thái ---
        const assignment = await roomAssignmentRepository.create({ ...assignmentData, assigned_by: userId });
        // Sau khi gán, cập nhật trạng thái của phòng thành 'occupied'
        await roomRepository.updateStatus(room_id, 'occupied');
        return assignment;
    }

    /**
     * Lấy danh sách các phòng đã được gán cho một đơn đặt phòng.
     * @param {string} bookingId - ID của đơn đặt phòng.
     * @returns {Promise<any[]>}
     */
    async getAssignmentsForBooking(bookingId) {
        return await roomAssignmentRepository.findByBookingId(bookingId);
    }

    /**
     * Hủy việc gán một phòng.
     * @param {string} assignmentId - ID của việc gán phòng.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<void>}
     */
    async unassignRoom(assignmentId, userId) {
        // Tương tự, cần kiểm tra quyền sở hữu trước khi hủy
        // ... (logic kiểm tra quyền)

        // Lấy thông tin assignment để biết phòng nào cần cập nhật lại trạng thái
        const assignment = await roomAssignmentRepository.findById(assignmentId); // Cần thêm hàm này vào repo
        if (!assignment) {
            throw new AppError('Assignment not found', 404);
        }

        const isDeleted = await roomAssignmentRepository.deleteById(assignmentId);
        if (!isDeleted) {
            throw new AppError('Failed to unassign room', 500);
        }

        // Sau khi hủy gán, cập nhật lại trạng thái phòng thành 'available' (hoặc 'cleaning')
        await roomRepository.updateStatus(assignment.roomId, 'available');
    }

    /**
     * Lấy danh sách phòng trống để xếp phòng cho một booking theo loại phòng.
     * @param {string} roomTypeId
     * @param {string|Date} checkInDate
     * @param {string|Date} checkOutDate
     * @param {number} limit
     * @returns {Promise<RoomAvailable[]>}
     */
    async getAvailableRooms(roomTypeId, checkInDate, checkOutDate, limit = 10000) {
        const rooms = await roomAssignmentRepository.findAvailableRooms(roomTypeId, checkInDate, checkOutDate, limit);
        return rooms.map(r => new RoomAvailable(r));
    }

    /**
     * Cập nhật trạng thái phòng về available khi booking checkout.
     * @param {string} bookingId
     * @returns {Promise<any>}
     */
    async releaseRoomsByBooking(bookingId) {
        return await roomAssignmentRepository.releaseRoomsByBooking(bookingId);
    }
}

module.exports = new RoomAssignmentService();
