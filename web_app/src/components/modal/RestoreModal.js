// src/components/modal/RestoreModal.js
import React, { useState, useEffect } from 'react';
import { FaTimes, FaUndo } from 'react-icons/fa';

const RestoreModal = ({ isOpen, onClose, onConfirm, hotelName }) => {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNote('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        try {
            await onConfirm(note.trim());
            onClose();
        } catch (error) {
            console.error('Error submitting:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="bg-yellow-50 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                                <FaUndo className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Khôi phục khách sạn
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Bạn có chắc chắn muốn khôi phục khách sạn <strong>{hotelName}</strong>? 
                                        Khách sạn sẽ được chuyển về trạng thái "Chờ duyệt" và chủ khách sạn sẽ nhận được thông báo.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 pt-2 pb-4 sm:p-6 sm:pt-2">
                            <div>
                                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                                    Lý do khôi phục (tùy chọn)
                                </label>
                                <textarea
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                                    placeholder="Thêm lý do khôi phục khách sạn (không bắt buộc)..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận khôi phục'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RestoreModal;