
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicAccess from '../components/PublicAccess';
import AdminDashboard from '../components/AdminDashboard';
import Login from '../components/Login';
import BrandHeader from '../components/BrandHeader';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header com as duas logos para todas as páginas públicas */}
      <div className="pt-8 pb-4">
        <BrandHeader />
      </div>
      
      <Routes>
        <Route path="/" element={<PublicAccess />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
};

export default Index;
