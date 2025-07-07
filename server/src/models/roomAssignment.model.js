class RoomAssignment {
    constructor({ assignment_id, booking_detail_id, room_id, assigned_at, assigned_by, notes }) {
        this.assignmentId = assignment_id;
        this.bookingDetailId = booking_detail_id;
        this.roomId = room_id;
        this.assignedAt = assigned_at;
        this.assignedBy = assigned_by;
        this.notes = notes;
    }

    toJSON() {
        return {
            assignmentId: this.assignmentId,
            bookingDetailId: this.bookingDetailId,
            roomId: this.roomId,
            assignedAt: this.assignedAt,
            assignedBy: this.assignedBy,
        };
    }
}

module.exports = RoomAssignment;
