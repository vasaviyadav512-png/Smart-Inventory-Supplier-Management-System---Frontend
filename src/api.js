
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smart-inventory-supplier-management-pm4d.onrender.com/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      !err.config?.url?.includes('/auth/login')
    ) {
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  e.response?.data?.message || e.message || 'Something went wrong';

export const money = (v) =>
  '₹' + Number(v ?? 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });

export default api;