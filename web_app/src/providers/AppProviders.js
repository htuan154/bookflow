// src/providers/AppProviders.js
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import {HotelProvider}from '../context/HotelContext';
import { ContractProvider } from '../context/ContractContext';
import { BlogProvider } from '../context/BlogContext';
import { PromotionsProvider } from '../context/PromotionsContext';

const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <HotelProvider>
                <ContractProvider>
                    <BlogProvider>
                        <PromotionsProvider>
                            {children}
                        </PromotionsProvider>
                    </BlogProvider>
                </ContractProvider>
            </HotelProvider>
        </AuthProvider>
    );
};

export default AppProviders;