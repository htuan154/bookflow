// src/pages/admin/HotelManagement/HotelListPage.js
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Container 
} from '@mui/material';
import { useHotel } from '../../../hooks/useHotel';
import HotelDataTable from '../../../components/hotel/HotelDataTable';
import HotelStatusTabs from '../../../components/hotel/HotelStatusTabs';

const HotelListPage = () => {
  const { 
    hotels, 
    approvedHotels, 
    pendingRejectedHotels,
    loading, 
    error, 
    totalCount,
    approvedCount,
    pendingRejectedCount,
    fetchAllHotels,
    fetchApprovedHotels,
    fetchPendingRejectedHotels
  } = useHotel();

  const [currentTab, setCurrentTab] = useState('all');

  // Gọi dữ liệu tương ứng khi tab thay đổi hoặc khi component mount
  useEffect(() => {
    if (currentTab === 'all') {
      fetchAllHotels();
    } else if (currentTab === 'approved') {
      fetchApprovedHotels();
    } else if (currentTab === 'pending-rejected') {
      fetchPendingRejectedHotels();
    }
  }, [currentTab, fetchAllHotels, fetchApprovedHotels, fetchPendingRejectedHotels]);

  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
  };

  const getCurrentHotels = () => {
    switch (currentTab) {
      case 'all':
        return hotels;
      case 'approved':
        return approvedHotels;
      case 'pending-rejected':
        return pendingRejectedHotels;
      default:
        return hotels;
    }
  };

  const getCurrentCount = () => {
    switch (currentTab) {
      case 'all':
        return totalCount;
      case 'approved':
        return approvedCount;
      case 'pending-rejected':
        return pendingRejectedCount;
      default:
        return totalCount;
    }
  };

  const currentHotels = getCurrentHotels();
  const currentCount = getCurrentCount();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản lý Hotel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Danh sách tất cả các hotel trong hệ thống
        </Typography>
      </Box>

      {/* Tabs */}
      <HotelStatusTabs
        currentTab={currentTab}
        onTabChange={handleTabChange}
        totalCount={totalCount}
        approvedCount={approvedCount}
        pendingRejectedCount={pendingRejectedCount}
        loading={loading}
      />

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            {currentTab === 'all' && 'Tất cả Hotels'}
            {currentTab === 'approved' && 'Hotels Đã Duyệt'}
            {currentTab === 'pending-rejected' && 'Hotels Chờ Duyệt/Từ Chối'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng: {currentCount} hotel{currentCount !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {currentHotels && currentHotels.length > 0 ? (
          <HotelDataTable 
            hotels={currentHotels} 
            showActions={true}
            currentTab={currentTab}
          />
        ) : (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="200px"
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Không có hotel nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTab === 'all' && 'Chưa có hotel nào trong hệ thống'}
              {currentTab === 'approved' && 'Chưa có hotel nào được duyệt'}
              {currentTab === 'pending-rejected' && 'Không có hotel nào đang chờ duyệt hoặc từ chối'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default HotelListPage;