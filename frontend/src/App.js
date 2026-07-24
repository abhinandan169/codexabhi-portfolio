import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Portfolio from '@/pages/Portfolio';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminForgotPassword from '@/pages/AdminForgotPassword';
import AdminResetPassword from '@/pages/AdminResetPassword';
import { ThemeProvider } from '@/lib/theme';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset/:token" element={<AdminResetPassword />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;
