// src/hooks/useRoomAssignment.js
import { useContext, useCallback } from 'react';
import { RoomAssignmentContext } from '../context/RoomAssignmentContext';
import * as roomAssignmentService from '../api/roomAssignment.service';

export const useRoomAssignment = () => {
  const { assignments, setAssignments, loading, setLoading, availableRooms, setAvailableRooms } = useContext(RoomAssignmentContext);

  const fetchAssignments = useCallback(async (bookingId) => {
    setLoading(true);
    const data = await roomAssignmentService.getRoomAssignmentsForBooking(bookingId);
    setAssignments(data);
    setLoading(false);
  }, [setLoading, setAssignments]);

  const assign = useCallback(async (data) => {
    setLoading(true);
    const result = await roomAssignmentService.assignRoom(data);
    setLoading(false);
    return result;
  }, [setLoading]);

  const unassign = useCallback(async (assignmentId) => {
    setLoading(true);
    const result = await roomAssignmentService.unassignRoom(assignmentId);
    setLoading(false);
    return result;
  }, [setLoading]);

  const fetchAvailableRooms = useCallback(async (params) => {
    setLoading(true);
    const data = await roomAssignmentService.getAvailableRooms(params);
    setAvailableRooms(data);
    setLoading(false);
    return data;
  }, [setLoading, setAvailableRooms]);

  return { assignments, loading, fetchAssignments, assign, unassign, availableRooms, fetchAvailableRooms };
};
