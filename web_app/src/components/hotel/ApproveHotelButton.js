// src/components/hotel/ApproveHotelButton.js
import React, { useState } from 'react';
import {
    Button,
    CircularProgress,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useHotel } from '../../context/HotelContext';

const ApproveHotelButton = ({ 
    hotelId, 
    size = 'small', 
    variant = 'contained',
    color = 'success'
}) => {
    const { approveHotel, loading } = useHotel();
    const [openDialog, setOpenDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleApprove = async () => {
        try {
            await approveHotel(hotelId);
            setSnackbar({
                open: true,
                message: 'Đã phê duyệt hotel thành công!',
                severity: 'success'
            });
            setOpenDialog(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || 'Có lỗi xảy ra khi phê duyệt hotel',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <Tooltip title="Phê duyệt hotel">
                <Button
                    variant={variant}
                    color={color}
                    size={size}
                    startIcon={loading ? 
                        <CircularProgress size={16} color="inherit" /> : 
                        <CheckCircleIcon />
                    }
                    onClick={() => setOpenDialog(true)}
                    disabled={loading}
                >
                    {size === 'small' ? 'Duyệt' : 'Phê duyệt'}
                </Button>
            </Tooltip>

            {/* Confirmation Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                aria-labelledby="approve-dialog-title"
            >
                <DialogTitle id="approve-dialog-title">
                    Xác nhận phê duyệt
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc chắn muốn phê duyệt hotel này không? 
                        Sau khi phê duyệt, hotel sẽ được hiển thị công khai trên hệ thống.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setOpenDialog(false)}
                        color="inherit"
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleApprove}
                        color="success"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={16} />}
                    >
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ApproveHotelButton;