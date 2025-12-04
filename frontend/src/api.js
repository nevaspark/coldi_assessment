import axios from 'axios';

// Default to local backend during development. Override with VITE_API_URL in production or env.
const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL || 'https://unexonerative-merilyn-emulatively.ngrok-free.dev';

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function sseUrl(tenantId) {
  const base = `${API_BASE}/events`;
  const token = localStorage.getItem('token');
  if (tenantId) return `${base}?tenantId=${tenantId}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
