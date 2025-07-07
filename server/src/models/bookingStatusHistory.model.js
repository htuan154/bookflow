class BookingStatusHistory {
    constructor({ history_id, booking_id, old_status, new_status, changed_by_staff, change_reason, notes, changed_at }) {
        this.historyId = history_id;
        this.bookingId = booking_id;
        this.oldStatus = old_status;
        this.newStatus = new_status;
        this.changedByStaff = changed_by_staff;
        this.changeReason = change_reason;
        this.notes = notes;
        this.changedAt = changed_at;
    }

    toJSON() {
        return {
            historyId: this.historyId,
            bookingId: this.bookingId,
            oldStatus: this.oldStatus,
            newStatus: this.newStatus,
            changedByStaff: this.changedByStaff,
            changedAt: this.changedAt,
        };
    }
}

module.exports = BookingStatusHistory;