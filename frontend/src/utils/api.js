import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const activeRole = localStorage.getItem('fl_active_role');
  if (activeRole) config.headers['x-active-role'] = activeRole;
  return config;
});

// Handle expired token
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fl_token');
      localStorage.removeItem('fl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)         => API.post('/auth/register', data),
  login:    (data)         => API.post('/auth/login', data),
  me:       ()             => API.get('/auth/me'),
  updateProfile: (data)    => API.put('/auth/profile', data),
  changePassword: (data)   => API.put('/auth/change-password', data),
  updateDocuments: (data)  => API.put('/auth/documents', data),
};

// ── RFQs ──────────────────────────────────────────────────────────────────────
export const rfqAPI = {
  list:       (params)            => API.get('/rfqs', { params }),
  get:        (id)                => API.get(`/rfqs/${id}`),
  create:     (data)              => API.post('/rfqs', data),
  update:     (id, data)          => API.put(`/rfqs/${id}`, data),
  remove:     (id)                => API.delete(`/rfqs/${id}`),
  getQuotes:  (id)                => API.get(`/rfqs/${id}/quotes`),
  award:      (rfqId, quoteId)    => API.post(`/rfqs/${rfqId}/award/${quoteId}`),
  submitQuote:(rfqId, data)       => API.post(`/rfqs/${rfqId}/quotes`, data),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoiceAPI = {
  list:   ()     => API.get('/invoices'),
  create: (data) => API.post('/invoices', data),
};

// ── Financing ─────────────────────────────────────────────────────────────────
export const financingAPI = {
  request:     (data)    => API.post('/financing/request', data),
  listRequests: ()       => API.get('/financing/requests'),
  submitBid:   (reqId, data) => API.post(`/financing/requests/${reqId}/bid`, data),
  acceptBid:   (bidId)   => API.post(`/financing/bids/${bidId}/accept`),
  fundByPlatform: (reqId, data) => API.post(`/financing/requests/${reqId}/fund-by-platform`, data),
  agreements: () => API.get('/financing/agreements'),
  signAgreement: (id, data) => API.put(`/financing/requests/${id}/sign`, data),
  portfolio: () => API.get('/financing/portfolio'),
  getAutoInvest: () => API.get('/financing/auto-invest'),
  setAutoInvest: (data) => API.put('/financing/auto-invest', data),
};

// ── Competitions ──────────────────────────────────────────────────────────────
export const competitionAPI = {
  list:      (params) => API.get('/competitions', { params }),
  create:    (data)   => API.post('/competitions', data),
  submitBid: (compId, data) => API.post(`/competitions/${compId}/bid`, data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  stats:         () => API.get('/dashboard/stats'),
  notifications: () => API.get('/notifications'),
  markRead:      () => API.put('/notifications/read'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  users:       ()           => API.get('/admin/users'),
  approveUser: (id, approve, note) => API.put(`/admin/users/${id}/approve`, { approve, note }),
  testEmail:   (to)         => API.post('/admin/test-email', { to }),
};

export const categoriesAPI = { list: () => API.get('/categories') };

export const accountAPI = {
  members:      ()        => API.get('/account/members'),
  addMember:    (data)    => API.post('/account/members', data),
  updateMember: (id,data) => API.put(`/account/members/${id}`, data),
  removeMember: (id)      => API.delete(`/account/members/${id}`),
  activity:     ()        => API.get('/account/activity'),
};

export const installmentAPI = {
  list:    ()   => API.get('/installments'),
  pay:     (id, data) => API.post(`/installments/${id}/pay`, data),
  confirm: (id) => API.put(`/installments/${id}/confirm`),
  settleEarly: (reqId, data) => API.post(`/installments/settle/${reqId}`, data),
  confirmSettlement: (reqId) => API.put(`/installments/settle/${reqId}/confirm`),
};

export const dealAPI = { list: () => API.get('/deals') };

export const mfgAPI = {
  list:        ()        => API.get('/manufacturing/orders'),
  create:      (data)    => API.post('/manufacturing/orders', data),
  stages:      (id)      => API.get(`/manufacturing/orders/${id}/stages`),
  match:       (id,data) => API.put(`/manufacturing/orders/${id}/match`, data),
  progress:    (sid,data)=> API.put(`/manufacturing/stages/${sid}/progress`, data),
  qa:          (sid,data)=> API.put(`/manufacturing/stages/${sid}/qa`, data),
  receive:     (sid)     => API.put(`/manufacturing/stages/${sid}/receive`),
  factories:   ()        => API.get('/manufacturing/factories'),
  estimate:    (data)    => API.post('/manufacturing/estimate', data),
  suggest:     (id)      => API.get(`/manufacturing/orders/${id}/suggest`),
  submitOffer: (id,data) => API.post(`/manufacturing/orders/${id}/offers`, data),
  offers:      (id)      => API.get(`/manufacturing/orders/${id}/offers`),
  acceptOffer: (oid)     => API.put(`/manufacturing/offers/${oid}/accept`),
  finance:     (id)      => API.post(`/manufacturing/orders/${id}/finance`),
  review:      (id,data) => API.post(`/manufacturing/orders/${id}/review`, data),
  raiseDispute:(id,data) => API.post(`/manufacturing/orders/${id}/disputes`, data),
  disputes:    (id)      => API.get(`/manufacturing/orders/${id}/disputes`),
  resolveDispute: (did,data) => API.put(`/manufacturing/disputes/${did}/resolve`, data),
};

export const analyticsAPI = {
  impact: () => API.get('/impact'),
  dashboard: (params) => API.get('/analytics/dashboard', { params }),
};

export const walletAPI = { ledger: () => API.get('/wallet/ledger') };

export const secondaryAPI = {
  list:        ()        => API.get('/secondary/listings'),
  create:      (data)    => API.post('/secondary/listings', data),
  buy:         (id)      => API.post(`/secondary/listings/${id}/buy`),
  myPositions: ()        => API.get('/secondary/my-positions'),
};

export default API;
