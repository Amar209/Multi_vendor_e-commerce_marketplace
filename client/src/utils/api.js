// Centralized API Base URL configuration for local dev and production deployment
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const apiUrl = (path = '') => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

export default apiUrl;
