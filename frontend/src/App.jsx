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
import Impact      from './pages/Impact';
import Portfolio   from './pages/Portfolio';
import Secondary   from './pages/Secondary';
import Wallet      from './pages/Wallet';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AccountUsers from './pages/AccountUsers';
import AdminPanel from './pages/AdminPanel';
import Profile    from './pages/Profile';
import Layout     from './components/Layout';

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('App crash:', err, info); }
  render() {
    if (this.state.err) {
      return (
        <div dir="rtl" style={{ padding: 24, fontFamily: 'Tajawal,sans-serif', maxWidth: 760, margin: '40px auto' }}>
          <h2 style={{ color: '#DC2626', marginBottom: 8 }}>حدث خطأ في تحميل الصفحة</h2>
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>إن استمرت المشكلة بعد إعادة التحميل، أرسل لي نص الخطأ التالي:</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#FEF2F2', padding: 12, borderRadius: 8, color: '#991B1B', fontSize: 12, border: '1px solid #FCA5A5' }}>
            {String((this.state.err && (this.state.err.stack || this.state.err.message)) || this.state.err)}
          </pre>
          <button onClick={() => { try { if ('caches' in window) caches.keys().then(ks => ks.forEach(k => caches.delete(k))); } catch (e) {} window.location.reload(); }}
            style={{ marginTop: 12, padding: '10px 20px', background: '#4F46E5', color: '#fff', border: 0, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            إعادة تحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen" style={{background:'#F4F6FB'}}><div className="text-xl animate-pulse" style={{color:'#4F46E5'}}>جارٍ التحميل...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => (
  <ErrorBoundary>
  <LanguageProvider>
    <CurrencyProvider>
    <BrowserRouter basename={process.env.PUBLIC_URL || undefined}>
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
          <Route path="impact"       element={<Impact />} />
          <Route path="portfolio"    element={<Portfolio />} />
          <Route path="secondary"    element={<Secondary />} />
          <Route path="wallet"       element={<Wallet />} />
          <Route path="account/users" element={<AccountUsers />} />
          <Route path="profile"      element={<Profile />} />
          <Route path="analytics"    element={<ProtectedRoute roles={['admin','owner']}><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="admin"        element={<ProtectedRoute roles={['admin','owner']}><AdminPanel /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
    </BrowserRouter>
    </CurrencyProvider>
  </LanguageProvider>
  </ErrorBoundary>
);

export default App;
