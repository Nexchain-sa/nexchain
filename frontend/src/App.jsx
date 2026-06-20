import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';

// Pages
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import RFQList    from './pages/RFQList';
import RFQDetail  from './pages/RFQDetail';
import RFQCreate  from './pages/RFQCreate';
import Competitions from './pages/Competitions';
import Financing  from './pages/Financing';
import Invoices   from './pages/Invoices';
import Installments from './pages/Installments';
import Deals       from './pages/Deals';
import Agreements  from './pages/Agreements';
import Manufacturing from './pages/Manufacturing';
import AdminPanel from './pages/AdminPanel';
import Profile    from './pages/Profile';
import Layout     from './components/Layout';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen" style={{background:'#F4F6FB'}}><div className="text-xl animate-pulse" style={{color:'#4F46E5'}}>جارٍ التحميل...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => (
  <LanguageProvider>
    <CurrencyProvider>
    <BrowserRouter>
    <AuthProvider>
      <Toaster position="bottom-left" toastOptions={{
        style: { background:'#1E293B', color:'#E8EAF6', border:'1px solid #EEF2FF', fontFamily:'Tajawal,sans-serif', direction:'rtl' },
        success: { iconTheme: { primary:'#059669', secondary:'#fff' } },
        error:   { iconTheme: { primary:'#ef4444', secondary:'#fff' } },
      }} />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="rfqs"         element={<RFQList />} />
          <Route path="rfqs/new"     element={<ProtectedRoute roles={['buyer']}><RFQCreate /></ProtectedRoute>} />
          <Route path="rfqs/:id"     element={<RFQDetail />} />
          <Route path="competitions" element={<Competitions />} />
          <Route path="financing"    element={<Financing />} />
          <Route path="invoices"     element={<Invoices />} />
          <Route path="installments" element={<Installments />} />
          <Route path="deals"        element={<Deals />} />
          <Route path="agreements"   element={<Agreements />} />
          <Route path="manufacturing" element={<Manufacturing />} />
          <Route path="profile"      element={<Profile />} />
          <Route path="admin"        element={<ProtectedRoute roles={['admin','owner']}><AdminPanel /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
    </BrowserRouter>
    </CurrencyProvider>
  </LanguageProvider>
);

export default App;
