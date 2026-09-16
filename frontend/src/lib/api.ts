const API_BASE = '/api';

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

  startBot(data?: any) {
    return this.request('/bot/start', {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  stopBot() {
    return this.request('/bot/stop', { method: 'POST' });
  },

  getBotLogs() {
    return this.request('/bot/logs');
  },

  getBotStats() {
    return this.request('/bot/stats');
  },

  getBotSessions() {
    return this.request('/bot-sessions');
  },

  // Time Slots
  getTimeSlots() {
    return this.request('/time-slots');
  },
  createTimeSlot(data: any) {
    return this.request('/time-slots', { method: 'POST', body: JSON.stringify(data) });
  },
  updateTimeSlot(id: string, data: any) {
    return this.request(`/time-slots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteTimeSlot(id: string) {
    return this.request(`/time-slots/${id}`, { method: 'DELETE' });
  },

  // Strategies
  getStrategies() {
    return this.request('/strategies');
  },
  createStrategy(data: any) {
    return this.request('/strategies', { method: 'POST', body: JSON.stringify(data) });
  },
  updateStrategy(id: string, data: any) {
    return this.request(`/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteStrategy(id: string) {
    return this.request(`/strategies/${id}`, { method: 'DELETE' });
  }
};
