// src/services/roomAssignment.service.js

import { API_ENDPOINTS } from '../config/apiEndpoints';

const getToken = () => localStorage.getItem('token');


export const assignRoom = async (data) => {
  const res = await fetch(API_ENDPOINTS.ROOM_ASSIGNMENTS.ASSIGN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data),
  });
  return res.json();
};


export const unassignRoom = async (assignmentId) => {
  const res = await fetch(API_ENDPOINTS.ROOM_ASSIGNMENTS.UNASSIGN(assignmentId), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return res.json();
};


export const getRoomAssignmentsForBooking = async (bookingId) => {
  const res = await fetch(API_ENDPOINTS.ROOM_ASSIGNMENTS.GET_FOR_BOOKING(bookingId), {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return res.json();
};

export const getAvailableRooms = async ({ roomTypeId, checkInDate, checkOutDate, limit }) => {
  const url = API_ENDPOINTS.ROOM_ASSIGNMENTS.GET_AVAILABLE_ROOMS({ roomTypeId, checkInDate, checkOutDate, limit });
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return res.json();
};

export const releaseRoomsByBooking = async (bookingId) => {
  const res = await fetch(API_ENDPOINTS.ROOM_ASSIGNMENTS.RELEASE_ROOMS(bookingId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return res.json();
};