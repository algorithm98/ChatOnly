const API_URL = import.meta.env.VITE_API_URL || '';

export const api = (path) => `${API_URL}${path}`;

export default api;
