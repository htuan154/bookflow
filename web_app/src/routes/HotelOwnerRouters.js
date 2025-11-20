// src/routes/HotelOwnerRouters.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES } from '../config/roles';
import useAuth from '../hooks/useAuth';

import HotelOwnerLayout from '../components/layout/hotel_owner/HotelOwnerLayout';
import HotelOwnerWelcomePage from '../pages/hotel_owner/HotelOwnerWelcomePage';
import HotelStaffWelcomePage from '../pages/hotel_owner/HotelStaffWelcomePage';
import HotelDashboardPage from '../pages/hotel_owner/HotelDashboardPage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import HotelOwnerOnlyRoute from './HotelOwnerOnlyRoute';

import HotelInfo from '../pages/hotel_owner/hotel_management/HotelInfo';
import HotelDetailPage from '../pages/hotel_owner/hotel_management/HotelDetailPage';
import HotelImages from '../pages/hotel_owner/hotel_management/HotelImages';
import HotelAmenities from '../pages/hotel_owner/hotel_management/HotelAmenities';

import StaffList from '../pages/hotel_owner/staff/StaffList';
import AddStaff from '../pages/hotel_owner/staff/AddStaff';
import StaffDetail from '../pages/hotel_owner/staff/StaffDetail';
import EditStaff from '../pages/hotel_owner/staff/EditStaff';
import StaffWrapper from '../pages/hotel_owner/staff/StaffWrapper';

// === Quản lý phòng: Pages
import RoomTypeListPage from '../pages/hotel_owner/roomtype_management/RoomTypeListPage';
import RoomTypeDetailPage from '../pages/hotel_owner/roomtype_management/RoomTypeDetailPage';
import RoomsByTypePage from '../pages/hotel_owner/roomtype_management/RoomsByTypePage';
import RoomManagementPage from '../pages/hotel_owner/roomtype_management/RoomManagementPage';
import RoomTypeImagesPage from '../pages/hotel_owner/roomtype_management/RoomTypeImagesPage';
import RoomTypeRoomsPage from '../pages/hotel_owner/roomtype_management/RoomTypeRoomsPage';
import RoomManagementWrapper from '../pages/hotel_owner/roomtype_management/RoomManagementWrapper';

// === Quản lý phòng: Providers (điều chỉnh path nếu bạn lưu khác)
import { RoomTypeProvider } from '../context/RoomTypeContext';
import { RoomProvider } from '../context/RoomContext';
import { HotelOwnerContractProvider } from '../context/HotelOwnerContractContext';
import { RoomTypeImageProvider } from '../context/RoomTypeImageContext';
import { HotelAmenityProvider } from '../context/HotelAmenityContext';
import { BankAccountProvider } from '../context/BankAccountContext';
import { StaffProvider } from '../context/StaffContext';
import ContractManagement from '../pages/hotel_owner/contract_management/ContractManagement';
import { IMProvider } from '../context/IMContext';
import OwnerMessagesPage from '../pages/hotel_owner/messages';

// === Pricing Pages
import { PricingIndex } from '../pages/hotel_owner/pricing';
import PromotionsPage from '../pages/hotel_owner/pricing/PromotionsPage';
import SeasonalPricingPage from '../pages/hotel_owner/pricing/SeasonalPricingPage';
import SeasonalPricingDetailPage from '../pages/hotel_owner/pricing/SeasonalPricingDetailPage';
import PricingWrapper from '../pages/hotel_owner/pricing/PricingWrapper';

// === Marketing Pages
import MarketingPage from '../pages/hotel_owner/marketing/MarketingPage';

// === Support Pages
import CustomerSupportPage from '../pages/hotel_owner/support/CustomerSupportPage';

// === Booking Pages
import { BookingManagementPage, BookingDetailView, BookingEditPage } from '../pages/hotel_owner/bookings';
import RoomAssignmentPage from '../pages/hotel_owner/bookings/RoomAssignmentPage';
import BookingWrapper from '../pages/hotel_owner/bookings/BookingWrapper';
import { RoomAssignmentProvider } from '../context/RoomAssignmentContext';
import { BookingProvider } from '../context/BookingContext';
import { ReviewProvider } from '../context/ReviewContext';
import { ReviewImageProvider } from '../context/ReviewImageContext';

import OwnerReportsPage from '../pages/hotel_owner/reports/OwnerReportsPage';
import { ReviewsPage } from '../pages/hotel_owner/reviews';


// Bank Accounts
import { HotelBankAccountsPage } from '../pages/hotel_owner/bank_accounts';

// Profile
import ProfilePage from '../pages/shared/ProfilePage';
const HotelOwnerRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  // Debug logs
  console.log('[HotelOwnerRoutes] isAuthenticated:', isAuthenticated);
  console.log('[HotelOwnerRoutes] user:', user);
  console.log('[HotelOwnerRoutes] user.roleId:', user?.roleId);
  console.log('[HotelOwnerRoutes] HOTEL_OWNER role:', USER_ROLES.HOTEL_OWNER);
  console.log('[HotelOwnerRoutes] HOTEL_STAFF role:', USER_ROLES.HOTEL_STAFF);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Allow both HOTEL_OWNER and HOTEL_STAFF to access these routes
  if (user?.roleId !== USER_ROLES.HOTEL_OWNER && user?.roleId !== USER_ROLES.HOTEL_STAFF) {
    console.log('[HotelOwnerRoutes] Access denied - redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  console.log('[HotelOwnerRoutes] Access granted');
  // có chỉnh sửa ngày 19/09 và 19/11
  return (
    <ReviewProvider>
      <ReviewImageProvider>
        <StaffProvider>
          <RoomTypeProvider>
            <RoomProvider>
              <RoomTypeImageProvider>
                <HotelAmenityProvider>
                  <BankAccountProvider>
                    <Routes>
              <Route element={<HotelOwnerLayout />}>
                {/* Welcome - accessible to all (show different page based on role) */}
                <Route index element={
                  user?.roleId === USER_ROLES.HOTEL_STAFF 
                    ? <HotelStaffWelcomePage /> 
                    : <HotelOwnerWelcomePage />
                } />
                <Route path="welcome" element={
                  user?.roleId === USER_ROLES.HOTEL_STAFF 
                    ? <HotelStaffWelcomePage /> 
                    : <HotelOwnerWelcomePage />
                } />

                {/* Profile - accessible to all */}
                <Route path="profile" element={<ProfilePage />} />

                {/* ======================= HOTEL_OWNER ONLY ROUTES ======================= */}
                <Route element={<HotelOwnerOnlyRoute />}>
                  {/* Dashboard */}
                  <Route path="dashboard" element={<HotelDashboardPage />} />
                  
                  {/* Bank Accounts & Financial Management */}
                  <Route path="financial" element={<HotelBankAccountsPage />} />
                  <Route path="bank-accounts" element={<HotelBankAccountsPage />} />

                  {/* Hotel management */}
                  <Route path="hotel" element={<Navigate to="/hotel-owner/hotel/info" replace />} />
                  <Route path="hotel/info" element={<HotelInfo />} />
                  <Route path="hotel/:hotelId" element={<HotelDetailPage />} />
                  <Route path="hotel/images" element={<HotelImages />} />
                  <Route path="hotel/amenities" element={<HotelAmenities />} />
                  <Route path="hotel/settings" element={<div>Cài đặt chung</div>} />

                  {/* Staff */}
                  <Route path="staff" element={<StaffWrapper />}>
                    <Route index element={<Navigate to="/hotel-owner/staff/list" replace />} />
                    <Route path="list" element={<StaffList />} />
                    <Route path="add" element={<AddStaff />} />
                    <Route path=":staffId" element={<StaffDetail />} />
                    <Route path="edit/:staffId" element={<EditStaff />} />
                  </Route>

                  {/* ======================= QUẢN LÝ PHÒNG ======================= */}
                  <Route path="rooms" element={<Navigate to="/hotel-owner/rooms/types" replace />} />
                  <Route path="rooms/types" element={<RoomTypeListPage />} />
                  <Route path="rooms/types/:roomTypeId/detail" element={<RoomTypeDetailPage />} />
                  <Route path="rooms/list" element={<RoomsByTypePage />} />
                  <Route path="rooms/images" element={<RoomTypeImagesPage />} />
                  
                  {/* Wrap only management and room detail pages to preserve state */}
                  <Route element={<RoomManagementWrapper />}>
                    <Route path="rooms/management" element={<RoomManagementPage />} />
                    <Route path="rooms/types/:roomTypeId/rooms" element={<RoomTypeRoomsPage />} />
                  </Route>

                  {/* Quản lý hợp đồng khách sạn */}
                  <Route path="contracts" element={
                    <HotelOwnerContractProvider>
                      <ContractManagement />
                    </HotelOwnerContractProvider>
                  } />

                  {/* ======================= PRICING MANAGEMENT ======================= */}
                  <Route path="pricing" element={<Navigate to="/hotel-owner/pricing/seasonal" replace />} />
                  {/* Wrap pricing routes to preserve state */}
                  <Route element={<PricingWrapper />}>
                    <Route path="pricing/seasonal" element={<SeasonalPricingPage />} />
                    <Route path="pricing/seasonal/:roomTypeId" element={<SeasonalPricingDetailPage />} />
                  </Route>
                  <Route path="pricing/promotions" element={<PromotionsPage />} />
                </Route>

                {/* ======================= ACCESSIBLE TO BOTH HOTEL_OWNER AND HOTEL_STAFF ======================= */}
                {/* Reports - now accessible to staff */}
                <Route path="reports" element={<OwnerReportsPage />} />
                
                {/* Messages */}
                <Route path="messages" element={
                  <IMProvider>
                    <OwnerMessagesPage />
                  </IMProvider>
                } />


                {/* ======================= MARKETING ======================= */}
                <Route path="marketing" element={<MarketingPage />} />
                {/* ======================= BOOKING MANAGEMENT ======================= */}
                <Route path="bookings" element={
                  <RoomAssignmentProvider>
                    <BookingManagementPage />
                  </RoomAssignmentProvider>
                } />
                <Route path="bookings/list" element={
                  <RoomAssignmentProvider>
                    <BookingManagementPage />
                  </RoomAssignmentProvider>
                } />
                <Route path="bookings/:bookingId" element={
                  <RoomAssignmentProvider>
                    <BookingDetailView />
                  </RoomAssignmentProvider>
                } />
                <Route path="bookings/:bookingId/edit" element={
                  <RoomAssignmentProvider>
                    <BookingEditPage />
                  </RoomAssignmentProvider>
                } />
                <Route path="bookings/:bookingId/assign-rooms" element={
                  <RoomAssignmentProvider>
                    <RoomAssignmentPage />
                  </RoomAssignmentProvider>
                } />

                {/* ======================= CUSTOMER SUPPORT ======================= */}
                <Route path="support" element={<CustomerSupportPage />} />

                {/* ======================= REVIEWS ======================= */}
                <Route path="reviews" element={<ReviewsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </BankAccountProvider>
                </HotelAmenityProvider>
              </RoomTypeImageProvider>
            </RoomProvider>
          </RoomTypeProvider>
        </StaffProvider>
      </ReviewImageProvider>
    </ReviewProvider>
  );
};

export default HotelOwnerRoutes;
