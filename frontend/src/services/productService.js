import api from './api';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  ''
);

export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getMyProducts: async (params = {}) => {
    const response = await api.get('/products', { params: { ...params, mine: true } });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (payload, files = []) => {
    if (files.length) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      files.forEach((file) => formData.append('images', file));

      const response = await api.post('/products', formData);
      return response.data;
    }

    const response = await api.post('/products', payload);
    return response.data;
  },

  updateProduct: async (id, payload, files = []) => {
    if (files.length) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      files.forEach((file) => formData.append('images', file));

      const response = await api.put(`/products/${id}`, formData);
      return response.data;
    }

    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

export default productService;
