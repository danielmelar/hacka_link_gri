import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clavis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clavis_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Leads API
export const leadsApi = {
  getAll: (params?: Record<string, any>) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  getMessages: (id: string, params?: Record<string, any>) =>
    api.get(`/leads/${id}/messages`, { params }),
  claim: (id: string) => api.post(`/leads/${id}/claim`),
  addNote: (id: string, note: string) => api.post(`/leads/${id}/notes`, { note }),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
};

// Properties API
export const propertiesApi = {
  getAll: (params?: Record<string, any>) => api.get('/properties', { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  getFilterOptions: () => api.get('/properties/filters/options'),
};

// Analytics API
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getFunnel: () => api.get('/analytics/funnel'),
  getAgents: () => api.get('/analytics/agents'),
  getMessages: () => api.get('/analytics/messages'),
};

// Dashboard API
export const dashboardApi = {
  getProfile: () => api.get('/profile'),
  getStats: () => api.get('/stats'),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  updateNotifications: (data: any) => api.put('/settings/notifications', data),
  updateWorkingHours: (data: any) => api.put('/settings/working-hours', data),
  regenerateLink: () => api.post('/settings/regenerate-link'),
};

// Follow-ups API
export const followUpsApi = {
  getByLead: (leadId: string) => api.get(`/leads/${leadId}/follow-ups`),
  create: (leadId: string, data: any) => api.post(`/leads/${leadId}/follow-ups`, data),
  update: (id: string, data: any) => api.put(`/follow-ups/${id}`, data),
  delete: (id: string) => api.delete(`/follow-ups/${id}`),
  getCalendar: (params?: Record<string, any>) => api.get('/calendar', { params }),
  schedule: (leadId: string, data: any) => api.post(`/leads/${leadId}/schedule`, data),
};
