import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexachain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized 401 handling -> bounce to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexachain_token');
      localStorage.removeItem('nexachain_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
};

export const investmentApi = {
  create: (payload) => api.post('/investments', payload),
  list: (params) => api.get('/investments', { params }),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard'),
  roiHistory: (params) => api.get('/dashboard/roi-history', { params }),
  referralIncomeHistory: (params) => api.get('/dashboard/referral-income', { params }),
};

export const referralApi = {
  direct: () => api.get('/referrals/direct'),
  tree: () => api.get('/referrals/tree'),
};

export default api;
