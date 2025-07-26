// src/context/HotelContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { hotelApiService as hotelService } from '../api/hotel.service';

// Initial state
const initialState = {
  hotels: [],
  approvedHotels: [],       
  pendingRejectedHotels: [], 
  loading: false,
  error: null,
  currentHotel: null,
  totalCount: 0,
  approvedCount: 0,         
  pendingRejectedCount: 0,   
  currentPage: 1,
  pageSize: 10
};

// Action types
const HOTEL_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  FETCH_HOTELS_SUCCESS: 'FETCH_HOTELS_SUCCESS',
  FETCH_APPROVED_HOTELS_SUCCESS: 'FETCH_APPROVED_HOTELS_SUCCESS',    
  FETCH_PENDING_REJECTED_HOTELS_SUCCESS: 'FETCH_PENDING_REJECTED_HOTELS_SUCCESS', 
  FETCH_HOTEL_SUCCESS: 'FETCH_HOTEL_SUCCESS',
  UPDATE_HOTEL_SUCCESS: 'UPDATE_HOTEL_SUCCESS',
  DELETE_HOTEL_SUCCESS: 'DELETE_HOTEL_SUCCESS',
  SET_PAGE: 'SET_PAGE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const hotelReducer = (state, action) => {
  switch (action.type) {
    case HOTEL_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case HOTEL_ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.payload };
      
    case HOTEL_ACTIONS.FETCH_HOTELS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        hotels: Array.isArray(action.payload?.data) ? action.payload.data : 
               Array.isArray(action.payload?.hotels) ? action.payload.hotels :
               Array.isArray(action.payload) ? action.payload : [],
        totalCount: action.payload?.totalCount || action.payload?.total || 
                   action.payload?.pagination?.total ||
                   (Array.isArray(action.payload?.data) ? action.payload.data.length : 
                    Array.isArray(action.payload) ? action.payload.length : 0)
      };
      
    case HOTEL_ACTIONS.FETCH_APPROVED_HOTELS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        approvedHotels: Array.isArray(action.payload?.data) ? action.payload.data : 
                       Array.isArray(action.payload?.hotels) ? action.payload.hotels :
                       Array.isArray(action.payload) ? action.payload : [],
        approvedCount: action.payload?.totalCount || action.payload?.total || 
                      action.payload?.pagination?.total ||
                      (Array.isArray(action.payload?.data) ? action.payload.data.length : 
                       Array.isArray(action.payload) ? action.payload.length : 0)
      };
      
    case HOTEL_ACTIONS.FETCH_PENDING_REJECTED_HOTELS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        pendingRejectedHotels: Array.isArray(action.payload?.data) ? action.payload.data : 
                              Array.isArray(action.payload?.hotels) ? action.payload.hotels :
                              Array.isArray(action.payload) ? action.payload : [],
        pendingRejectedCount: action.payload?.totalCount || action.payload?.total || 
                             action.payload?.pagination?.total ||
                             (Array.isArray(action.payload?.data) ? action.payload.data.length : 
                              Array.isArray(action.payload) ? action.payload.length : 0)
      };
      
    case HOTEL_ACTIONS.FETCH_HOTEL_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        currentHotel: action.payload
      };
      
    case HOTEL_ACTIONS.UPDATE_HOTEL_SUCCESS:
      const updatedHotel = action.payload;
      return {
        ...state,
        loading: false,
        error: null,
        hotels: state.hotels.map(hotel => 
          hotel.hotel_id === updatedHotel.hotel_id ? { ...hotel, ...updatedHotel } : hotel
        ),
        approvedHotels: state.approvedHotels.map(hotel => 
          hotel.hotel_id === updatedHotel.hotel_id ? { ...hotel, ...updatedHotel } : hotel
        ),
        pendingRejectedHotels: state.pendingRejectedHotels.map(hotel => 
          hotel.hotel_id === updatedHotel.hotel_id ? { ...hotel, ...updatedHotel } : hotel
        ),
        currentHotel: updatedHotel
      };
      
    case HOTEL_ACTIONS.DELETE_HOTEL_SUCCESS:
      const hotelId = action.payload;
      return {
        ...state,
        loading: false,
        error: null,
        hotels: state.hotels.filter(hotel => hotel.hotel_id !== hotelId),
        approvedHotels: state.approvedHotels.filter(hotel => hotel.hotel_id !== hotelId),
        pendingRejectedHotels: state.pendingRejectedHotels.filter(hotel => hotel.hotel_id !== hotelId)
      };
      
    case HOTEL_ACTIONS.SET_PAGE:
      return { ...state, currentPage: action.payload };
      
    case HOTEL_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
      
    default:
      return state;
  }
};

// Create context
const HotelContext = createContext();

// Provider component
export const HotelProvider = ({ children }) => {
  const [state, dispatch] = useReducer(hotelReducer, initialState);

  // Separate loading refs for each API call to avoid blocking
  const loadingRefs = React.useRef({
    allHotels: false,
    approvedHotels: false,
    pendingRejectedHotels: false
  });

  // Fetch all hotels - Fixed with separate loading ref
  const fetchAllHotels = useCallback(async (filters = {}) => {
    // Prevent multiple simultaneous calls for this specific API
    if (loadingRefs.current.allHotels) {
      console.log('Already loading all hotels, skipping fetch request');
      return;
    }

    try {
      loadingRefs.current.allHotels = true;
      dispatch({ type: HOTEL_ACTIONS.SET_LOADING, payload: true });
      console.log('🔄 Fetching all hotels with filters:', filters);
      
      const response = await hotelService.getHotelsForAdmin(filters);
      console.log('✅ All Hotels API Response:', response);
      
      // Validate response
      if (!response) {
        throw new Error('No response from server');
      }

      dispatch({
        type: HOTEL_ACTIONS.FETCH_HOTELS_SUCCESS,
        payload: response
      });
    } catch (error) {
      console.error('❌ Error fetching all hotels:', error);
      dispatch({
        type: HOTEL_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error.message || 'Không thể tải danh sách hotel'
      });
    } finally {
      loadingRefs.current.allHotels = false;
    }
  }, []);

  // Fetch approved hotels - Fixed with separate loading ref
  const fetchApprovedHotels = useCallback(async (filters = {}) => {
    if (loadingRefs.current.approvedHotels) {
      console.log('Already loading approved hotels, skipping fetch');
      return;
    }

    try {
      loadingRefs.current.approvedHotels = true;
      dispatch({ type: HOTEL_ACTIONS.SET_LOADING, payload: true });
      console.log('🔄 Fetching approved hotels with filters:', filters);
      
      const response = await hotelService.getApprovedHotels(filters);
      console.log('✅ Approved Hotels API Response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }

      dispatch({
        type: HOTEL_ACTIONS.FETCH_APPROVED_HOTELS_SUCCESS,
        payload: response
      });
    } catch (error) {
      console.error('❌ Error fetching approved hotels:', error);
      dispatch({
        type: HOTEL_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error.message || 'Không thể tải danh sách hotel đã duyệt'
      });
    } finally {
      loadingRefs.current.approvedHotels = false;
    }
  }, []);

  // Fetch pending/rejected hotels - Fixed with separate loading ref
  const fetchPendingRejectedHotels = useCallback(async (filters = {}) => {
    if (loadingRefs.current.pendingRejectedHotels) {
      console.log('Already loading pending/rejected hotels, skipping fetch');
      return;
    }

    try {
      loadingRefs.current.pendingRejectedHotels = true;
      dispatch({ type: HOTEL_ACTIONS.SET_LOADING, payload: true });
      console.log('🔄 Fetching pending/rejected hotels with filters:', filters);
      
      const response = await hotelService.getPendingRejectedHotels(filters);
      console.log('✅ Pending/Rejected Hotels API Response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }

      dispatch({
        type: HOTEL_ACTIONS.FETCH_PENDING_REJECTED_HOTELS_SUCCESS,
        payload: response
      });
    } catch (error) {
      console.error('❌ Error fetching pending/rejected hotels:', error);
      dispatch({
        type: HOTEL_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error.message || 'Không thể tải danh sách hotel chờ duyệt/từ chối'
      });
    } finally {
      loadingRefs.current.pendingRejectedHotels = false;
    }
  }, []);

  // Get hotel by ID
  const fetchHotelById = useCallback(async (hotelId) => {
    try {
      dispatch({ type: HOTEL_ACTIONS.SET_LOADING, payload: true });
      const response = await hotelService.getHotelById(hotelId);
      dispatch({
        type: HOTEL_ACTIONS.FETCH_HOTEL_SUCCESS,
        payload: response.data || response
      });
      return response.data || response;
    } catch (error) {
      console.error('Error fetching hotel by ID:', error);
      dispatch({
        type: HOTEL_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error.message || 'Không thể tải thông tin hotel'
      });
      throw error;
    }
  }, []);

  // Update hotel
  const updateHotel = useCallback(async (hotelId, updateData) => {
    try {
      dispatch({ type: HOTEL_ACTIONS.SET_LOADING, payload: true });
      const response = await hotelService.updateHotel(hotelId, updateData);
      dispatch({
        type: HOTEL_ACTIONS.UPDATE_HOTEL_SUCCESS,
        payload: response.data || response
      });
      return response.data || response;
    } catch (error) {
      console.error('Error updating hotel:', error);
      dispatch({
        type: HOTEL_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error.message || 'Không thể cập nhật hotel'
      });
      throw error;
    }
  }, []);

  // Delete hotel
  const deleteHotel = useCallback(async (hotelId) => {
    try {
      dispatch({ type: HOTEL_ACTIONS.SET_LOADING, payload: true });
      await hotelService.deleteHotel(hotelId);
      dispatch({
        type: HOTEL_ACTIONS.DELETE_HOTEL_SUCCESS,
        payload: hotelId
      });
    } catch (error) {
      console.error('Error deleting hotel:', error);
      dispatch({
        type: HOTEL_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error.message || 'Không thể xóa hotel'
      });
      throw error;
    }
  }, []);

  // Set page
  const setPage = useCallback((page) => {
    dispatch({ type: HOTEL_ACTIONS.SET_PAGE, payload: page });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: HOTEL_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    // State
    hotels: state.hotels,
    approvedHotels: state.approvedHotels,                   
    pendingRejectedHotels: state.pendingRejectedHotels,     
    loading: state.loading,
    error: state.error,
    currentHotel: state.currentHotel,
    totalCount: state.totalCount,
    approvedCount: state.approvedCount,                     
    pendingRejectedCount: state.pendingRejectedCount,       
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    
    // Actions
    fetchAllHotels,
    fetchApprovedHotels,           
    fetchPendingRejectedHotels,    
    fetchHotelById,
    updateHotel,
    deleteHotel,
    setPage,
    clearError
  };

  return (
    <HotelContext.Provider value={value}>
      {children}
    </HotelContext.Provider>
  );
};

// Custom hook
export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};

export default HotelContext;