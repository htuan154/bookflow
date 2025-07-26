// src/components/hotel/HotelStatusTabs.js
import React from 'react';
import { Box, Tabs, Tab, Badge, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  fontWeight: 600,
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
}));

const TabLabel = ({ label, count, color = 'default' }) => (
  <Box display="flex" alignItems="center" gap={1}>
    <Typography variant="body2" component="span">
      {label}
    </Typography>
    <Badge 
      badgeContent={count} 
      color={color}
      sx={{
        '& .MuiBadge-badge': {
          right: -3,
          top: 2,
          fontSize: '0.75rem',
          minWidth: '18px',
          height: '18px',
        }
      }}
    />
  </Box>
);

const HotelStatusTabs = ({ 
  currentTab, 
  onTabChange, 
  totalCount = 0, 
  approvedCount = 0, 
  pendingRejectedCount = 0,
  loading = false 
}) => {
  const handleChange = (event, newValue) => {
    onTabChange(newValue);
  };

  const tabs = [
    {
      value: 'all',
      label: 'Tất cả',
      count: totalCount,
      color: 'default'
    },
    {
      value: 'approved',
      label: 'Đã duyệt',
      count: approvedCount,
      color: 'success'
    },
    {
      value: 'pending-rejected',
      label: 'Chờ duyệt/Từ chối',
      count: pendingRejectedCount,
      color: 'warning'
    }
  ];

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <StyledTabs
        value={currentTab}
        onChange={handleChange}
        aria-label="hotel status tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabs.map((tab) => (
          <StyledTab
            key={tab.value}
            value={tab.value}
            label={
              <TabLabel 
                label={tab.label} 
                count={loading ? 0 : tab.count} 
                color={tab.color}
              />
            }
            disabled={loading}
          />
        ))}
      </StyledTabs>
      
      {/* Optional: Tab descriptions */}
      <Box sx={{ mt: 1, px: 2 }}>
        {currentTab === 'all' && (
          <Typography variant="body2" color="text.secondary">
            Hiển thị tất cả các hotel trong hệ thống
          </Typography>
        )}
        {currentTab === 'approved' && (
          <Typography variant="body2" color="text.secondary">
            Hiển thị các hotel đã được duyệt và đang hoạt động
          </Typography>
        )}
        {currentTab === 'pending-rejected' && (
          <Typography variant="body2" color="text.secondary">
            Hiển thị các hotel đang chờ duyệt hoặc đã từ chối
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default HotelStatusTabs;