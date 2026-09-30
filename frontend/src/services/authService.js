import api from './api';

export const checkApiHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

const authService = {
  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  login: async (payload) => {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Client logout still proceeds if token is already invalid.
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (payload) => {
    const response = await api.put('/users/profile', payload);
    return response.data;
  },

  changePassword: async (payload) => {
    const response = await api.put('/users/change-password', payload);
    return response.data;
  },
};

export default authService;
