// // src/components/hotel/PendingHotelsList.js
// import React, { useState, useEffect } from 'react';
// import { hotelApiService } from '../../api/hotel.service'; // Đúng tên export
// import HotelDataTable from './HotelDataTable';

// const PendingHotelsList = () => {
//     const [hotels, setHotels] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [statusFilter, setStatusFilter] = useState('all');
//     const [filteredHotels, setFilteredHotels] = useState([]);

//     useEffect(() => {
//         setLoading(true);
//         // Lấy cả pending và rejected
//         Promise.all([
//             hotelApiService.getHotelsByStatus('pending'),
//             hotelApiService.getHotelsByStatus('rejected')
//         ])
//         .then(([pendingRes, rejectedRes]) => {
//             const pending = pendingRes.data || [];
//             const rejected = rejectedRes.data || [];
//             setHotels([...pending, ...rejected]);
//             setLoading(false);
//         })
//         .catch(() => {
//             setError('Không thể tải danh sách khách sạn');
//             setLoading(false);
//         });
//     }, []);

//     useEffect(() => {
//         let filtered = hotels;
//         if (statusFilter !== 'all') {
//             filtered = filtered.filter(hotel => hotel.status === statusFilter);
//         }
//         if (searchTerm) {
//             filtered = filtered.filter(hotel =>
//                 hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 hotel.email?.toLowerCase().includes(searchTerm.toLowerCase())
//             );
//         }
//         setFilteredHotels(filtered);
//     }, [hotels, searchTerm, statusFilter]);

//     const handleSearch = (e) => setSearchTerm(e.target.value);
//     const handleStatusFilter = (status) => setStatusFilter(status);

//     const getStatusCounts = () => {
//         if (!hotels) return { all: 0, pending: 0, rejected: 0 };
//         return {
//             all: hotels.length,
//             pending: hotels.filter(h => h.status === 'pending').length,
//             rejected: hotels.filter(h => h.status === 'rejected').length
//         };
//     };

//     const statusCounts = getStatusCounts();

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                 <span className="ml-2">Đang tải danh sách khách sạn chờ duyệt...</span>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//                 <p>Lỗi khi tải danh sách khách sạn: {error}</p>
//             </div>
//         );
//     }

//     return (
//         <div className="bg-white rounded-lg shadow">
//             <div className="p-6 border-b border-gray-200">
//                 <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-xl font-semibold text-gray-900">
//                         Khách Sạn Chờ Duyệt & Từ Chối ({filteredHotels.length})
//                     </h2>
//                 </div>
//                 <div className="flex space-x-1 mb-4">
//                     <button
//                         onClick={() => handleStatusFilter('all')}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg ${
//                             statusFilter === 'all'
//                                 ? 'bg-blue-100 text-blue-700 border border-blue-300'
//                                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
//                         }`}
//                     >
//                         Tất cả ({statusCounts.all})
//                     </button>
//                     <button
//                         onClick={() => handleStatusFilter('pending')}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg ${
//                             statusFilter === 'pending'
//                                 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
//                                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
//                         }`}
//                     >
//                         Chờ duyệt ({statusCounts.pending})
//                     </button>
//                     <button
//                         onClick={() => handleStatusFilter('rejected')}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg ${
//                             statusFilter === 'rejected'
//                                 ? 'bg-red-100 text-red-700 border border-red-300'
//                                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
//                         }`}
//                     >
//                         Đã từ chối ({statusCounts.rejected})
//                     </button>
//                 </div>
//                 <div className="mb-4">
//                     <input
//                         type="text"
//                         placeholder="Tìm kiếm theo tên, thành phố, email..."
//                         value={searchTerm}
//                         onChange={handleSearch}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                 </div>
//             </div>
//             <div className="p-6">
//                 <HotelDataTable 
//                     hotels={filteredHotels}
//                     showActions={true}
//                     status="pending"
//                 />
//             </div>
//         </div>
//     );
// };

// export default PendingHotelsList;

import React, { useState, useEffect } from 'react';
import { hotelApiService } from '../../api/hotel.service';
import HotelDataTable from './HotelDataTable';

const PendingHotelsList = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [filteredHotels, setFilteredHotels] = useState([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            hotelApiService.getHotelsByStatus('pending'),
            hotelApiService.getHotelsByStatus('rejected'),
            hotelApiService.getHotelsByStatus('approved'),
            hotelApiService.getHotelsByStatus('active'),
            hotelApiService.getHotelsByStatus('inactive'),
        ])
        .then(([pendingRes, rejectedRes, approvedRes, activeRes, inactiveRes]) => {
            const pending = pendingRes.data || [];
            const rejected = rejectedRes.data || [];
            const approved = approvedRes.data || [];
            const active = activeRes.data || [];
            const inactive = inactiveRes.data || [];
            setHotels([...pending, ...rejected, ...approved, ...active, ...inactive]);
            setLoading(false);
        })
        .catch(() => {
            setError('Không thể tải danh sách khách sạn');
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        let filtered = hotels;
        if (statusFilter) {
            filtered = filtered.filter(hotel => hotel.status === statusFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(hotel =>
                hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hotel.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredHotels(filtered);
    }, [hotels, searchTerm, statusFilter]);

    const handleSearch = (e) => setSearchTerm(e.target.value);
    const handleStatusFilter = (status) => setStatusFilter(status);

    const getStatusCounts = () => {
        return {
            pending: hotels.filter(h => h.status === 'pending').length,
            rejected: hotels.filter(h => h.status === 'rejected').length,
            approved: hotels.filter(h => h.status === 'approved').length,
            active: hotels.filter(h => h.status === 'active').length,
            inactive: hotels.filter(h => h.status === 'inactive').length,
        };
    };

    const statusCounts = getStatusCounts();

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Đang tải danh sách khách sạn...</span>
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
                        Danh Sách Khách Sạn ({filteredHotels.length})
                    </h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => handleStatusFilter('pending')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            statusFilter === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Chờ duyệt ({statusCounts.pending})
                    </button>
                    <button
                        onClick={() => handleStatusFilter('rejected')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            statusFilter === 'rejected'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Đã từ chối ({statusCounts.rejected})
                    </button>
                    <button
                        onClick={() => handleStatusFilter('approved')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            statusFilter === 'approved'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Đã duyệt ({statusCounts.approved})
                    </button>
                    <button
                        onClick={() => handleStatusFilter('active')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            statusFilter === 'active'
                                ? 'bg-teal-100 text-teal-700 border border-teal-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Đang hoạt động ({statusCounts.active})
                    </button>
                    <button
                        onClick={() => handleStatusFilter('inactive')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            statusFilter === 'inactive'
                                ? 'bg-gray-200 text-gray-700 border border-gray-400'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Ngừng hoạt động ({statusCounts.inactive})
                    </button>
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
                    showActions={true}
                    status={statusFilter}
                />
            </div>
        </div>
    );
};

export default PendingHotelsList;
