// src/routes/HotelOwnerRouters.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES } from '../config/roles';
import useAuth from '../hooks/useAuth';

import HotelOwnerLayout from '../components/layout/hotel_owner/HotelOwnerLayout';
import HotelOwnerWelcomePage from '../pages/hotel_owner/HotelOwnerWelcomePage';
import NotFoundPage from '../pages/shared/NotFoundPage';

import HotelInfo from '../pages/hotel_owner/hotel_management/HotelInfo';
import HotelDetailPage from '../pages/hotel_owner/hotel_management/HotelDetailPage';
import HotelImages from '../pages/hotel_owner/hotel_management/HotelImages';
import HotelAmenities from '../pages/hotel_owner/hotel_management/HotelAmenities';

import StaffList from '../pages/hotel_owner/staff/StaffList';
import AddStaff from '../pages/hotel_owner/staff/AddStaff';

// === Quản lý phòng: Pages
import RoomTypeListPage from '../pages/hotel_owner/roomtype_management/RoomTypeListPage';
import RoomTypeDetailPage from '../pages/hotel_owner/roomtype_management/RoomTypeDetailPage';
import RoomsByTypePage from '../pages/hotel_owner/roomtype_management/RoomsByTypePage';
import RoomManagementPage from '../pages/hotel_owner/roomtype_management/RoomManagementPage';
import RoomTypeImagesPage from '../pages/hotel_owner/roomtype_management/RoomTypeImagesPage';
import RoomTypeRoomsPage from '../pages/hotel_owner/roomtype_management/RoomTypeRoomsPage';

// === Quản lý phòng: Providers (điều chỉnh path nếu bạn lưu khác)
import { RoomTypeProvider } from '../context/RoomTypeContext';
import { RoomProvider } from '../context/RoomContext';
import { HotelOwnerContractProvider } from '../context/HotelOwnerContractContext';
import { RoomTypeImageProvider } from '../context/RoomTypeImageContext';
import { HotelAmenityProvider } from '../context/HotelAmenityContext';
import { BankAccountProvider } from '../context/BankAccountContext';
import ContractManagement from '../pages/hotel_owner/contract_management/ContractManagement';
import { IMProvider } from '../context/IMContext';
import OwnerMessagesPage from '../pages/hotel_owner/messages';

// === Pricing Pages
import { PricingIndex } from '../pages/hotel_owner/pricing';
import PromotionsPage from '../pages/hotel_owner/pricing/PromotionsPage';
import SeasonalPricingPage from '../pages/hotel_owner/pricing/SeasonalPricingPage';
import SeasonalPricingDetailPage from '../pages/hotel_owner/pricing/SeasonalPricingDetailPage';

// === Marketing Pages
import MarketingPage from '../pages/hotel_owner/marketing/MarketingPage';

// === Support Pages
import CustomerSupportPage from '../pages/hotel_owner/support/CustomerSupportPage';

// === Booking Pages
import { BookingManagementPage, BookingDetailView, BookingEditPage } from '../pages/hotel_owner/bookings';

import OwnerReportsPage from '../pages/hotel_owner/reports/OwnerReportsPage';
import RevenuePage from '../pages/hotel_owner/reports/RevenuePage';

// Bank Accounts
import { HotelBankAccountsPage } from '../pages/hotel_owner/bank_accounts';
const HotelOwnerRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.roleId !== USER_ROLES.HOTEL_OWNER) return <Navigate to="/unauthorized" replace />;
  // có chỉnh sửa ngày 19/09
  return (
    <RoomTypeProvider>
      <RoomProvider>
        <RoomTypeImageProvider>
          <HotelAmenityProvider>
            <BankAccountProvider>
              <Routes>
              <Route element={<HotelOwnerLayout />}>
                {/* Dashboard */}
                <Route index element={<HotelOwnerWelcomePage />} />
                <Route path="dashboard" element={<HotelOwnerWelcomePage />} />
                {/* Reports (Báo cáo & Thống kê) */}
                <Route path="reports" element={<OwnerReportsPage />} />
                <Route path="reports/revenue" element={<RevenuePage />} />

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
                <Route path="staff" element={<Navigate to="/hotel-owner/staff/list" replace />} />
                <Route path="staff/list" element={<StaffList />} />
                <Route path="staff/add" element={<AddStaff />} />

                {/* ======================= QUẢN LÝ PHÒNG ======================= */}
                <Route path="rooms/types" element={<RoomTypeListPage />} />
                <Route path="rooms/types/:roomTypeId/detail" element={<RoomTypeDetailPage />} />
                <Route path="rooms/types/:roomTypeId/rooms" element={<RoomTypeRoomsPage />} />
                <Route path="rooms/list" element={<RoomsByTypePage />} />
                <Route path="rooms/management" element={<RoomManagementPage />} />
                <Route path="rooms/images" element={<RoomTypeImagesPage />} />
                <Route path="rooms" element={<Navigate to="/hotel-owner/rooms/types" replace />} />

   
                {/* Quản lý hợp đồng khách sạn */}
                <Route path="contracts" element={
                  <HotelOwnerContractProvider>
                    <ContractManagement />
                  </HotelOwnerContractProvider>
                } />

                {/* Messages */}
                <Route path="messages" element={
                  <IMProvider>
                    <OwnerMessagesPage />
                  </IMProvider>
                } />

                {/* ======================= PRICING MANAGEMENT ======================= */}
                <Route path="pricing" element={<Navigate to="/hotel-owner/pricing/seasonal" replace />} />
                <Route path="pricing/seasonal" element={<SeasonalPricingPage />} />
                <Route path="pricing/seasonal/:roomTypeId" element={<SeasonalPricingDetailPage />} />
                <Route path="pricing/promotions" element={<PromotionsPage />} />


                {/* ======================= MARKETING ======================= */}
                <Route path="marketing" element={<MarketingPage />} />
                {/* ======================= BOOKING MANAGEMENT ======================= */}
                <Route path="bookings" element={<BookingManagementPage />} />
                <Route path="bookings/list" element={<BookingManagementPage />} />
                <Route path="bookings/:bookingId" element={<BookingDetailView />} />
                <Route path="bookings/:bookingId/edit" element={<BookingEditPage />} />

                {/* ======================= CUSTOMER SUPPORT ======================= */}
                <Route path="support" element={<CustomerSupportPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </BankAccountProvider>
          </HotelAmenityProvider>
        </RoomTypeImageProvider>
      </RoomProvider>
    </RoomTypeProvider>
  );
};

export default HotelOwnerRoutes;
