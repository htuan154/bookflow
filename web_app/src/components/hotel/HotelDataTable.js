// src/components/hotel/HotelDataTable.js
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const HotelDataTable = ({ hotels = [], showActions = true, currentTab = 'all' }) => {
  // Helper function để xử lý NULL values
  const formatValue = (value, defaultText = "Chưa cập nhật") => {
    if (value === null || value === undefined || value === '') {
      return defaultText;
    }
    return value;
  };

  // Helper function để format địa chỉ
  const formatAddress = (address, city) => {
    const addr = formatValue(address, '');
    const cityName = formatValue(city, '');
    
    if (!addr && !cityName) return "Chưa cập nhật địa chỉ";
    if (!addr) return cityName;
    if (!cityName) return addr;
    return `${addr}, ${cityName}`;
  };

  // Helper function để format status
  const getStatusConfig = (status) => {
    const statusMap = {
      'pending': { 
        label: 'Chờ duyệt', 
        color: 'warning'
      },
      'approved': { 
        label: 'Đã duyệt', 
        color: 'success'
      },
      'rejected': { 
        label: 'Từ chối', 
        color: 'error'
      },
      'active': { 
        label: 'Hoạt động', 
        color: 'primary'
      }
    };
    
    return statusMap[status] || { 
      label: 'Không xác định', 
      color: 'default'
    };
  };

  // Helper function để format rating
  const formatRating = (rating) => {
    if (rating === null || rating === undefined || rating === 0) {
      return "Chưa có đánh giá";
    }
    return `${rating}/5`;
  };

  // Helper function để format date
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return "Ngày không hợp lệ";
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0) {
      return <Typography color="primary" variant="body2">Liên hệ</Typography>;
    }
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  };

  // Handle actions
  const handleViewDetails = (hotel) => {
    console.log('View details:', hotel.hotel_id);
    // TODO: Navigate to hotel details page
  };

  const handleEdit = (hotel) => {
    console.log('Edit hotel:', hotel.hotel_id);
    // TODO: Navigate to edit page
  };

  const handleApprove = (hotel) => {
    console.log('Approve hotel:', hotel.hotel_id);
    // TODO: Call approve API
  };

  const handleReject = (hotel) => {
    console.log('Reject hotel:', hotel.hotel_id);
    // TODO: Call reject API
  };

  if (!hotels || hotels.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="200px"
        textAlign="center"
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
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Hình ảnh</TableCell>
            <TableCell>Tên Hotel</TableCell>
            <TableCell>Địa chỉ</TableCell>
            <TableCell align="center">Số sao</TableCell>
            <TableCell align="center">Trạng thái</TableCell>
            <TableCell align="center">Đánh giá</TableCell>
            <TableCell align="right">Giá từ</TableCell>
            <TableCell align="center">Ngày tạo</TableCell>
            {showActions && <TableCell align="center">Thao tác</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {hotels.map((hotel) => {
            const statusConfig = getStatusConfig(hotel.status);
            
            return (
              <TableRow 
                key={hotel.hotel_id} // ✅ Key prop đã có
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {/* Hình ảnh */}
                <TableCell>
                  <Avatar
                    src={hotel.image}
                    alt={formatValue(hotel.name, 'Hotel')}
                    sx={{ width: 60, height: 60 }}
                    variant="rounded"
                  >
                    {formatValue(hotel.name, 'H')[0].toUpperCase()}
                  </Avatar>
                </TableCell>

                {/* Tên Hotel */}
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {formatValue(hotel.name, 'Tên khách sạn chưa cập nhật')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {hotel.hotel_id?.substring(0, 8)}...
                    </Typography>
                  </Box>
                </TableCell>

                {/* Địa chỉ */}
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {formatAddress(hotel.address, hotel.city)}
                    </Typography>
                    {hotel.phone_number && (
                      <Typography variant="caption" color="text.secondary">
                        {hotel.phone_number}
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Số sao */}
                <TableCell align="center">
                  {hotel.star_rating ? (
                    <Box display="flex" alignItems="center" justifyContent="center">
                      <Typography variant="body2">
                        {'⭐'.repeat(hotel.star_rating)} ({hotel.star_rating})
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chưa xếp hạng
                    </Typography>
                  )}
                </TableCell>

                {/* Trạng thái */}
                <TableCell align="center">
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                {/* Đánh giá */}
                <TableCell align="center">
                  <Box>
                    <Typography variant="body2">
                      {formatRating(hotel.average_rating)}
                    </Typography>
                    {hotel.total_reviews > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        ({hotel.total_reviews} đánh giá)
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Giá từ */}
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatPrice(hotel.min_price)}
                  </Typography>
                </TableCell>

                {/* Ngày tạo */}
                <TableCell align="center">
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(hotel.created_at)}
                  </Typography>
                </TableCell>

                {/* Thao tác */}
                {showActions && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewDetails(hotel)}
                        title="Xem chi tiết"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleEdit(hotel)}
                        title="Chỉnh sửa"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      {hotel.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleApprove(hotel)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleReject(hotel)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default HotelDataTable;