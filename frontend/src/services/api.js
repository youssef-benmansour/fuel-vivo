import axios from 'axios';
import qs from 'qs'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      // If the error is due to an invalid token, clear the token and redirect to login
      localStorage.removeItem('token');
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);

// Add authentication-related API calls
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('API Register Error:', error);
    console.error('Error Response:', error.response);
    console.error('Error Data:', error.response?.data);
    throw error;
  }
};export const getCurrentUser = () => api.get('/auth/me');

// Data API calls
export const getPrices = () => api.get('/data/prices');
export const getPlants = () => api.get('/data/plants');
export const getProducts = () => api.get('/data/products');
export const getClients = () => api.get('/data/clients');
export const getTanks = () => api.get('/data/tanks');
export const getTrucks = (attributes = []) => {
  return api.get('/data/trucks', {
    params: {
      attributes: attributes.join(',')
    }
  });
};

export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/data/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const response = await api.get('/data/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

// Import API calls
export const importData = (importType, formData) => {
  return api.post(`/import/${importType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getImportHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/import/history', { params: { page, limit } });
    return response.data;
  } catch (error) {
    console.error('Error in getImportHistory:', error);
    throw error;
  }
};

// Order related API calls
export const getOrders = ({ startDate, endDate }) => {
  return api.get('/orders', {
    params: {
      startDate,
      endDate
    }
  });
};
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error in getOrderById API call:', error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    let response;
    if (Array.isArray(id)) {
      // Bulk update
      response = await api.put('/orders/bulk-update', {
        orderIds: id,
        ...orderData
      });
    } else {
      // Single order update
      response = await api.put(`/orders/${id}`, orderData);
    }
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const deleteOrder = (id) => {
  return api.delete(`/orders/${id}`);
};

export const deleteMultipleOrders = (orderIds) => {
  return api.post('/orders/delete-multiple', { orderIds });
};

export const getLatestSalesOrder = async () => {
  try {
    const response = await api.get('/orders/latest-sales-order');
    return response.data;
  } catch (error) {
    console.error('Error fetching latest sales order:', error);
    throw error;
  }
};

export const createMultipleOrders = async (ordersData) => {
  try {
    const response = await api.post('/orders/create-multiple', ordersData);
    return response.data;
  } catch (error) {
    console.error('Error in createMultipleOrders:', error);
    throw error;
  }
};

export const importOrders = (ordersData) => {
  return api.post('/orders/import', ordersData);
};

// Trip-related API calls
export const createTrip = (tripData) => {
  return api.post('/trips', tripData);
};

export const getTrips = async (page = 1, pageSize = 10) => {
  console.log(`Fetching trips with page: ${page}, pageSize: ${pageSize}`);
  try {
    const response = await api.get('/trips', {
      params: { page, limit: pageSize },
      paramsSerializer: params => qs.stringify(params)
    });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

export const updateTrip = async (tripId, tripData) => {
  try {
    console.log(`Updating trip with ID: ${tripId}`, tripData);
    const response = await api.put(`/trips/${tripId}`, tripData);
    console.log('Trip update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating trip:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

export const deleteTrip = (tripId) => {
  return api.delete(`/trips/${tripId}`);
};

export const getTripById = async (tripId) => {
  try {
    const response = await api.get(`/trips/${tripId}`);
    
    if (response.data && response.data.Orders) {
      // Ensure Orders is always an array
      response.data.Orders = Array.isArray(response.data.Orders) ? response.data.Orders : [response.data.Orders];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching trip by ID:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const getTripDetails = async (tripId) => {
  try {
    console.log('Fetching trip details for tripId:', tripId);
    const response = await api.get(`/trips/${tripId}`);
    console.log('Trip details response:', response.data);
    return response.data;  // Make sure this line is present
  } catch (error) {
    console.error('Error fetching trip details:', error);
    throw error;
  }
};

export const updateTripLoading = async (tripId, loadingData) => {
  console.log(`Updating trip loading status for ID: ${tripId}`, loadingData);
  try {
    const response = await api.put(`/trips/${tripId}/loading`, loadingData);
    console.log('Update trip loading status response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating trip loading status:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const getOrdersByTripNum = async (tripNum) => {
  try {
    const response = await api.get(`/orders`, { params: { tripNum } });
    return response;
  } catch (error) {
    console.error('Error fetching orders by trip number:', error);
    throw error;
  }
};

export const getTruckById = (vehicleId) => {
  return api.get(`/trucks/${vehicleId}`);
};

export const getClientById = (clientId) => {
  return api.get(`/clients/${clientId}`);
};

export default {
  getPrices,
  getPlants,
  getProducts,
  getClients,
  getAllProducts,
  getTanks,
  getTrucks,
  importData,
  getImportHistory,
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
  deleteMultipleOrders,
  createMultipleOrders,
  createTrip,
  getTrips,
  updateTrip,
  deleteTrip,
  getTripById,
  getOrdersByTripNum,
  getTruckById,
  getClientById,
  updateProduct,
  login,
  register,
  getCurrentUser,
  updateTripLoading,
};