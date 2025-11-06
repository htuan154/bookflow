// src/context/RoomAssignmentContext.js
import React, { createContext, useState } from 'react';

export const RoomAssignmentContext = createContext();

export const RoomAssignmentProvider = ({ children }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  return (
    <RoomAssignmentContext.Provider value={{ assignments, setAssignments, loading, setLoading, availableRooms, setAvailableRooms }}>
      {children}
    </RoomAssignmentContext.Provider>
  );
};
