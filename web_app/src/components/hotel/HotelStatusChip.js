// src/components/hotel/HotelStatusChip.js
import React from 'react';
import { Chip } from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Block as BlockIcon,
    Pause as PauseIcon
} from '@mui/icons-material';

const HotelStatusChip = ({ status, size = 'small' }) => {
    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'active':
                return {
                    label: 'Đã duyệt',
                    color: 'success',
                    icon: <CheckCircleIcon />
                };
            
            case 'pending':
            case 'waiting':
                return {
                    label: 'Chờ duyệt',
                    color: 'warning',
                    icon: <ScheduleIcon />
                };
            
            case 'rejected':
            case 'declined':
                return {
                    label: 'Từ chối',
                    color: 'error',
                    icon: <CancelIcon />
                };
            
            case 'blocked':
            case 'banned':
                return {
                    label: 'Bị chặn',
                    color: 'error',
                    icon: <BlockIcon />
                };
            
            case 'inactive':
            case 'disabled':
                return {
                    label: 'Tạm dừng',
                    color: 'default',
                    icon: <PauseIcon />
                };
            
            case 'draft':
                return {
                    label: 'Nháp',
                    color: 'info',
                    icon: <ScheduleIcon />
                };
            
            default:
                return {
                    label: status || 'Không xác định',
                    color: 'default',
                    icon: <ScheduleIcon />
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Chip
            label={config.label}
            color={config.color}
            size={size}
            icon={config.icon}
            variant="filled"
            sx={{
                fontWeight: 'medium',
                '& .MuiChip-icon': {
                    fontSize: size === 'small' ? '16px' : '20px'
                }
            }}
        />
    );
};

export default HotelStatusChip;