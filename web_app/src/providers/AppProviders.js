// src/providers/AppProviders.js
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import {HotelProvider}from '../context/HotelContext';
import { ContractProvider } from '../context/ContractContext';
import { BlogProvider } from '../context/BlogContext';
import { PromotionsProvider } from '../context/PromotionsContext';
import { ChatbotProvider } from '../context/ChatbotContext';
const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
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
        </AuthProvider>
    );
};

export default AppProviders;