// src/pages/admin/PromotionManagementPage/PromotionManagementPage.js
import React, { useState, useEffect } from 'react';
import PromotionDataTable from '../../../components/promotion/PromotionDataTable';
import PromotionForm from '../../../components/promotion/PromotionForm';
import PromotionModal from '../../../components/promotion/PromotionModal';
import { getAllPromotions, createPromotion, updatePromotion } from '../../../api/promotion.service';
import Spinner from '../../../components/common/Spinner';

const PromotionManagementPage = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all promotions on component mount
    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllPromotions();
            setPromotions(response.data || []);
        } catch (err) {
            setError('Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.');
            console.error('Error fetching promotions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromotion = async (promotionData) => {
        try {
            setIsSubmitting(true);
            setError(null);
            
            const response = await createPromotion(promotionData);
            
            // Add new promotion to the list
            setPromotions(prev => [...prev, response.data]);
            
            // Show success message
            alert('Tạo khuyến mãi thành công!');
            
        } catch (err) {
            setError('Không thể tạo khuyến mãi. Vui lòng kiểm tra lại thông tin.');
            console.error('Error creating promotion:', err);
            throw err; // Re-throw to handle in form
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePromotion = async (promotionData) => {
        try {
            setIsSubmitting(true);
            setError(null);
            
            const response = await updatePromotion(selectedPromotion.promotionId, promotionData);
            
            // Update promotion in the list
            setPromotions(prev =>
                prev.map(promotion =>
                    promotion.promotionId === selectedPromotion.promotionId
                        ? { ...promotion, ...response.data }
                        : promotion
                )
            );
            
            // Close modal and reset selected promotion
            setShowModal(false);
            setSelectedPromotion(null);
            
            // Show success message
            alert('Cập nhật khuyến mãi thành công!');
            
        } catch (err) {
            setError('Không thể cập nhật khuyến mãi. Vui lòng kiểm tra lại thông tin.');
            console.error('Error updating promotion:', err);
            throw err; // Re-throw to handle in form
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPromotion = (promotion) => {
        setSelectedPromotion(promotion);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedPromotion(null);
    };

    const handleRefresh = () => {
        fetchPromotions();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Quản lý khuyến mãi
                </h1>
                <p className="text-gray-600">
                    Quản lý các chương trình khuyến mãi của hệ thống
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <div className="text-red-800">
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Promotion Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                        Tạo khuyến mãi mới
                    </h2>
                </div>
                <div className="p-6">
                    <PromotionForm
                        onSubmit={handleCreatePromotion}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>

            {/* Promotions List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        Danh sách khuyến mãi ({promotions.length})
                    </h2>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
                <div className="p-6">
                    <PromotionDataTable
                        promotions={promotions}
                        onEdit={handleEditPromotion}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <PromotionModal
                isOpen={showModal}
                onClose={handleCloseModal}
                title="Cập nhật khuyến mãi"
            >
                <PromotionForm
                    initialData={selectedPromotion}
                    onSubmit={handleUpdatePromotion}
                    isSubmitting={isSubmitting}
                    isEdit={true}
                />
            </PromotionModal>
        </div>
    );
};

export default PromotionManagementPage;