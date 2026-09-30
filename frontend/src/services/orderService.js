import api from './api';

const orderService = {
  createOrder: async (payload) => {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getTracking: async (id) => {
    const response = await api.get(`/orders/${id}/tracking`);
    return response.data;
  },

  trackByOrderNumber: async (orderNumber) => {
    const response = await api.get(`/orders/track/${encodeURIComponent(orderNumber)}`);
    return response.data;
  },

  updateOrderStatus: async (id, payload) => {
    const response = await api.put(`/orders/${id}/status`, payload);
    return response.data;
  },

  cancelOrder: async (id, reason = '') => {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
};

export default orderService;
