import { create } from 'zustand';
import { api } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!api.getToken(),
  
  login: async (password: string) => {
    const res = await api.login(password);
    if (res.token) {
      api.setToken(res.token);
      set({ isAuthenticated: true });
    }
  },
  
  logout: () => {
    api.clearToken();
    set({ isAuthenticated: false });
  },
  
  checkAuth: () => {
    set({ isAuthenticated: !!api.getToken() });
  }
}));
