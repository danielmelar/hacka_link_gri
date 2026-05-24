import { create } from 'zustand';
import { authApi } from '../services/api';
import { connectSSE, disconnectSSE } from '../services/sse';

interface Broker {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  deepLinkToken: string;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  broker: Broker | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('clavis_token'),
  broker: null,
  isAuthenticated: !!localStorage.getItem('clavis_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      const { token, broker } = response.data.data;

      localStorage.setItem('clavis_token', token);
      set({ token, broker, isAuthenticated: true, isLoading: false });
      connectSSE();
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Erro ao fazer login',
      });
    }
  },

  logout: () => {
    localStorage.removeItem('clavis_token');
    disconnectSSE();
    set({ token: null, broker: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('clavis_token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.me();
      const broker = response.data.data;
      set({ broker, isAuthenticated: true, isLoading: false });
      connectSSE();
    } catch {
      localStorage.removeItem('clavis_token');
      set({ token: null, broker: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
