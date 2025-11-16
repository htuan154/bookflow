// src/context/BookingNightlyPriceContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { bookingNightlyPriceService } from '../api/bookingNightlyPrice.service';

// Initial state
const initialState = {
  nightlyPrices: [],
  loading: false,
  error: null,
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  CREATE_SUCCESS: 'CREATE_SUCCESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const bookingNightlyPriceReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.payload };

    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        nightlyPrices: action.payload,
      };

    case ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        nightlyPrices: [...state.nightlyPrices, action.payload],
      };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// Create context
const BookingNightlyPriceContext = createContext();

// Provider component
export const BookingNightlyPriceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingNightlyPriceReducer, initialState);

  // Fetch nightly prices by booking ID
  const fetchByBookingId = useCallback(async (bookingId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await bookingNightlyPriceService.getByBookingId(bookingId);
      dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: response.data || [] });
      return response;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Create nightly price
  const createNightlyPrice = useCallback(async (data) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await bookingNightlyPriceService.create(data);
      dispatch({ type: ACTIONS.CREATE_SUCCESS, payload: response.data });
      return response;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    nightlyPrices: state.nightlyPrices,
    loading: state.loading,
    error: state.error,
    fetchByBookingId,
    createNightlyPrice,
    clearError,
  };

  return (
    <BookingNightlyPriceContext.Provider value={value}>
      {children}
    </BookingNightlyPriceContext.Provider>
  );
};

// Custom hook
export const useBookingNightlyPrice = () => {
  const context = useContext(BookingNightlyPriceContext);
  if (!context) {
    throw new Error(
      'useBookingNightlyPrice must be used within a BookingNightlyPriceProvider'
    );
  }
  return context;
};

export default BookingNightlyPriceContext;
