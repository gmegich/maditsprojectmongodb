import api from './api';

const paymentService = {
  initiateMpesa: async (payload) => {
    const response = await api.post('/payments/mpesa', payload);
    return response.data;
  },

  getPayment: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  getPaymentsByOrder: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },

  mockComplete: async (payload) => {
    const response = await api.post('/payments/mpesa/mock-complete', payload);
    return response.data;
  },
};

export default paymentService;
