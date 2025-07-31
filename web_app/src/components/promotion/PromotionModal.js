// src/components/promotion/PromotionModal.js
import React, { useEffect } from 'react';

const PromotionModal = ({ isOpen, onClose, title, children }) => {
    // Handle ESC key press
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore body overflow
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Don't render anything if modal is not open
    if (!isOpen) {
        return null;
    }

    // Handle backdrop click
    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleBackdropClick}
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-4xl">
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {title || 'Chi tiết khuyến mãi'}
                            </h2>
                            
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                aria-label="Đóng modal"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionModal;