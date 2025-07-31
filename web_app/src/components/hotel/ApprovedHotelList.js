// src/components/hotel/ApprovedHotelsList.js
import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import HotelDataTable from './HotelDataTable';
import { toast } from 'react-toastify';

const ApprovedHotelsList = () => {
    const { approvedHotels, fetchApprovedHotels, loading, error } = useHotel();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredHotels, setFilteredHotels] = useState([]);

    useEffect(() => {
        fetchApprovedHotels();
    }, []);

    useEffect(() => {
        if (approvedHotels) {
            const filtered = approvedHotels.filter(hotel =>
                hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hotel.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredHotels(filtered);
        }
    }, [approvedHotels, searchTerm]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Đang tải danh sách khách sạn đã duyệt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>Lỗi khi tải danh sách khách sạn: {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Khách Sạn Đã Duyệt ({filteredHotels.length})
                    </h2>
                </div>
                
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, thành phố, email..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="p-6">
                <HotelDataTable 
                    hotels={filteredHotels}
                    showActions={false}
                    status="approved"
                />
            </div>
        </div>
    );
};

export default ApprovedHotelsList;