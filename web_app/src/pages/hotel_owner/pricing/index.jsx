// src/pages/hotel_owner/pricing/index.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PricingIndex = () => {
  // Redirect to rates page by default
  return <Navigate to="/hotel-owner/pricing/rates" replace />;
};

export default PricingIndex;