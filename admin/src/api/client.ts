import axios from 'axios';
import { apiBaseUrl, resolveUploadUrls, restoreUploadUrls } from './config';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  config.data = restoreUploadUrls(config.data);
  const token = localStorage.getItem('brightmind_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    response.data = resolveUploadUrls(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/me') {
      // Unauthenticated
    }
    return Promise.reject(error);
  }
);

export default api;
