import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Storefront from './pages/Storefront';
import VendorPortal from './pages/VendorPortal';
import AdminPortal from './pages/AdminPortal';
import LoginPage from './pages/LoginPage';
import MyOrdersPage from './pages/MyOrdersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Customer Storefront */}
          <Route path="/" element={<Storefront />} />

          {/* 2. Customer Order Tracking & Invoices */}
          <Route path="/my-orders" element={<MyOrdersPage />} />

          {/* 3. Authentication & Account Access */}
          <Route path="/login" element={<LoginPage />} />

          {/* 4. Dedicated Seller Central Portal (Vendors Only) */}
          <Route path="/vendor" element={<VendorPortal />} />

          {/* 5. Dedicated Master Admin Backoffice (Admins Only) */}
          <Route path="/admin" element={<AdminPortal />} />

          {/* Fallback to Storefront */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
