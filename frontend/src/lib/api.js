import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
};
