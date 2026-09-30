import api from './api';

const sellerService = {
  getMyProfile: async () => {
    const response = await api.get('/sellers/me');
    return response.data;
  },

  updateMyProfile: async (payload) => {
    const response = await api.put('/sellers/me', payload);
    return response.data;
  },
};

export default sellerService;
