// src/routes/HotelOwnerRouters.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES } from '../config/roles';
import useAuth from '../hooks/useAuth';

import HotelOwnerLayout from '../components/layout/hotel_owner/HotelOwnerLayout';
import HotelOwnerWelcomePage from '../pages/hotel_owner/HotelOwnerWelcomePage';
import NotFoundPage from '../pages/shared/NotFoundPage';

import HotelInfo from '../pages/hotel_owner/hotel_management/HotelInfo';
import HotelImages from '../pages/hotel_owner/hotel_management/HotelImages';
import HotelAmenities from '../pages/hotel_owner/hotel_management/HotelAmenities';

import StaffList from '../pages/hotel_owner/staff/StaffList';
import AddStaff from '../pages/hotel_owner/staff/AddStaff';

// === Quản lý phòng: Pages
import RoomTypeListPage from '../pages/hotel_owner/roomtype_management/RoomTypeListPage';
import RoomsByTypePage from '../pages/hotel_owner/roomtype_management/RoomsByTypePage';
import RoomStatusPage from '../pages/hotel_owner/roomtype_management/RoomStatusPage';
import RoomTypeImagesPage from '../pages/hotel_owner/roomtype_management/RoomTypeImagesPage';

// === Quản lý phòng: Providers (điều chỉnh path nếu bạn lưu khác)
import { RoomTypeProvider } from '../context/RoomTypeContext';
import { RoomProvider } from '../context/RoomContext';
import { HotelOwnerContractProvider } from '../context/HotelOwnerContractContext';
import { RoomTypeImageProvider } from '../context/RoomTypeImageContext';
import { HotelAmenityProvider } from '../context/HotelAmenityContext';
import ContractManagement from '../pages/hotel_owner/contract_management/ContractManagement';
import { IMProvider } from '../context/IMContext';
import OwnerMessagesPage from '../pages/hotel_owner/messages';


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
            <Routes>
              <Route element={<HotelOwnerLayout />}>
                {/* Dashboard */}
                <Route index element={<HotelOwnerWelcomePage />} />
                <Route path="dashboard" element={<HotelOwnerWelcomePage />} />

                {/* Hotel management */}
                <Route path="hotel" element={<Navigate to="/hotel-owner/hotel/info" replace />} />
                <Route path="hotel/info" element={<HotelInfo />} />
                <Route path="hotel/images" element={<HotelImages />} />
                <Route path="hotel/amenities" element={<HotelAmenities />} />
                <Route path="hotel/settings" element={<div>Cài đặt chung</div>} />

                {/* Staff */}
                <Route path="staff" element={<Navigate to="/hotel-owner/staff/list" replace />} />
                <Route path="staff/list" element={<StaffList />} />
                <Route path="staff/add" element={<AddStaff />} />

                {/* ======================= QUẢN LÝ PHÒNG ======================= */}
                <Route path="rooms/types" element={<RoomTypeListPage />} />
                <Route path="rooms/list" element={<RoomsByTypePage />} />
                <Route path="rooms/status" element={<RoomStatusPage />} />
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
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </HotelAmenityProvider>
        </RoomTypeImageProvider>
      </RoomProvider>
    </RoomTypeProvider>
  );
};

export default HotelOwnerRoutes;
