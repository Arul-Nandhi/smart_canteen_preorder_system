import axios from 'axios';

// Support both VITE_API_URL and VITE_API_BASE_URL; strip trailing /api to avoid double-prefix
let _raw = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// Remove trailing slash and /api suffix if present
_raw = _raw.replace(/\/+$/, '').replace(/\/api$/, '');
const API_URL = _raw;
const api = axios.create({ baseURL: `${API_URL}/api` });


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
