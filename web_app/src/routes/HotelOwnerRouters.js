import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES } from '../config/roles';
import useAuth from '../hooks/useAuth';
import HotelOwnerLayout from '../components/layout/hotel_owner/HotelOwnerLayout';
import HotelOwnerWelcomePage from '../pages/hotel_owner/HotelOwnerWelcomePage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import HotelInfo from '../pages/hotel_owner/HotelInfo';
import HotelImages from '../pages/hotel_owner/HotelImages';
import HotelAmenities from '../pages/hotel_owner/HotelAmenities';
import StaffList from '../pages/hotel_owner/staff/StaffList';
import AddStaff from '../pages/hotel_owner/staff/AddStaff';

const HotelOwnerRoutes = () => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.roleId !== USER_ROLES.HOTEL_OWNER) {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <Routes>
            <Route element={<HotelOwnerLayout />}>
                <Route index element={<HotelOwnerWelcomePage />} />
                <Route path="dashboard" element={<HotelOwnerWelcomePage />} />
                
                {/* Hotel management routes */}
                <Route path="hotel" element={<Navigate to="/hotel-owner/hotel/info" replace />} />
                <Route path="hotel/info" element={<HotelInfo />} />
                <Route path="hotel/images" element={<HotelImages />} />
                <Route path="hotel/amenities" element={<HotelAmenities />} />
                <Route path="hotel/settings" element={<div>Cài đặt chung</div>} />
                
                {/* Staff management routes */}
                <Route path="staff" element={<Navigate to="/hotel-owner/staff/list" replace />} />
                <Route path="staff/list" element={<StaffList />} />
                <Route path="staff/add" element={<AddStaff />} />
                <Route path="staff/edit/:staffId" element={<div>Edit Staff</div>} />
                <Route path="staff/schedules" element={<div>Staff Schedules</div>} />
                
            </Route>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default HotelOwnerRoutes;