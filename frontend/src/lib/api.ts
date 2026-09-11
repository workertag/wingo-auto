const API_BASE = 'http://localhost:3001/api';

export const api = {
  getToken: () => localStorage.getItem('dashboard_token'),
  setToken: (token: string) => localStorage.setItem('dashboard_token', token),
  clearToken: () => localStorage.removeItem('dashboard_token'),

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API Request failed');
    }

    return data;
  },

  login(password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  getSettings() {
    return this.request('/settings');
  },

  updateSettings(settings: any) {
    return this.request('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  getBotStatus() {
    return this.request('/bot/status');
  },

  startBot() {
    return this.request('/bot/start', { method: 'POST' });
  },

  stopBot() {
    return this.request('/bot/stop', { method: 'POST' });
  },

  getBotLogs() {
    return this.request('/bot/logs');
  },
};
