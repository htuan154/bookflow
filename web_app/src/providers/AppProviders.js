// src/providers/AppProviders.js
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import {HotelProvider}from '../context/HotelContext';
import { ContractProvider } from '../context/ContractContext';
import { BlogProvider } from '../context/BlogContext';
import { PromotionsProvider } from '../context/PromotionsContext';
import { ChatbotProvider } from '../context/ChatbotContext';
const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <NotificationProvider>
                <ChatbotProvider>
                    <HotelProvider>
                        <ContractProvider>
                            <BlogProvider>
                                <PromotionsProvider>
                                    {children}
                                </PromotionsProvider>
                            </BlogProvider>
                        </ContractProvider>
                    </HotelProvider>
                </ChatbotProvider>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default AppProviders;