import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

// 👇 THÊM 3 PROVIDER NÀY
import { UserProvider } from './context/UserContext';
import { HotelProvider } from './context/HotelContext';
import { IMProvider } from './context/IMContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <UserProvider>
          <HotelProvider>
            <IMProvider>
              <App />
            </IMProvider>
          </HotelProvider>
        </UserProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
