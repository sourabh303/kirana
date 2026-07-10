import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  loginWithPassword: (mobile, password) => api.post('/auth/login/password', { mobile, password }),
  getProfile: () => api.get('/users/profile'),
};

export const catalogService = {
  getCentralCatalog: () => api.get('/catalog'),
};

export const shopService = {
  discoverShops: (lat, lng, radius) => api.get('/shops', { params: { lat, lng, radius } }),
  getShopDetails: (shopId) => api.get(`/shops/${shopId}`),
  getShopProducts: (shopId) => api.get(`/shops/${shopId}/products`),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (shopId, shopProductId, quantity) => api.post('/cart/items', { shopId, shopProductId, quantity }),
  updateItem: (shopProductId, quantity) => api.patch(`/cart/items/${shopProductId}`, { quantity }),
  clearCart: () => api.delete('/cart'),
};

export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  getOrderDetails: (orderId) => api.get(`/orders/${orderId}`),
};

export default api;
