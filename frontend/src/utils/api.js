import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
  approveUser: (id, approve) => API.put(`/admin/users/${id}/approve`, { approve }),
};

export const categoriesAPI = { list: () => API.get('/categories') };

export default API;
