// src/services/api_essentials.js
// Central axios instance — mirrors the exact behavior of the PawVaidya web app's
// Essentials.jsx / Items.jsx / Cart.jsx (axios calls to /api/essentials and /api/cart).

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://pawvaidya-jgei.onrender.com/api';
const SESSION_COOKIE_KEY = 'pawvaidya.sessionCookie';

const api_essentials = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Render free tier cold starts can take 30-60s
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api_essentials.interceptors.request.use(async (config) => {
  const sessionCookie = await AsyncStorage.getItem(SESSION_COOKIE_KEY);
  if (sessionCookie) {
    config.headers = config.headers || {};
    config.headers.Cookie = sessionCookie;
  }
  return config;
});

api_essentials.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers?.['set-cookie'] || response.headers?.['Set-Cookie'];
    if (setCookie) {
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      const sessionCookie = cookieHeader.split(';')[0];
      if (sessionCookie) {
        await AsyncStorage.setItem(SESSION_COOKIE_KEY, sessionCookie);
      }
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.log('API error:', error?.message);
      console.log('API error response:', JSON.stringify(error?.response?.data));
      console.log('API error status:', error?.response?.status);
    }
    return Promise.reject(error);
  }
);

// ---- Marketplace endpoints ----

// Backend document shape (from web app's Essentials.jsx/Items.jsx):
// { _id, title, image, price, type, quantity, createdAt, updatedAt }
// Our RN UI components use: { _id, name, imageUrl, price, suitableFor }
const normalizeProduct = (item) => ({
  _id: item._id,
  name: item.title || item.name,
  imageUrl: item.image || item.imageUrl,
  price: item.price,
  suitableFor: item.type || item.suitableFor,
  description: item.description,
  benefits: item.benefits,
  rating: item.rating,
  reviews: item.reviews,
});

// GET /api/essentials returns a plain array — no wrapper, no pagination
// (confirmed from web app: `const data = response.data; setEssentialsData(data);`)
export const fetchProducts = async () => {
  const { data } = await api_essentials.get('/essentials');

  if (__DEV__) {
    console.log('RAW /essentials response:', JSON.stringify(data));
  }

  const products = (Array.isArray(data) ? data : []).map(normalizeProduct);
  return { products, hasMore: false }; // backend has no pagination yet
};

// POST /api/cart expects the full item payload, not a productId
// (confirmed from web app's Items.jsx: axios.post("/api/cart", { title, image, price, type }))
export const addToCart = async (product) => {
  const { data } = await api_essentials.post('/cart', {
    title: product.name,
    image: product.imageUrl,
    price: product.price,
    type: product.suitableFor,
  });
  return data;
};

export const fetchBlogs = async () => {
  const { data } = await api_essentials.get('/blog');
  return Array.isArray(data) ? data : data?.blogs || data?.posts || [];
};

export const fetchVets = async () => {
  const { data } = await api_essentials.get('/vet');
  const vets = Array.isArray(data) ? data : data?.vets || [];

  return vets.map((vet) => ({
    ...vet,
    specialty: vet.specialty || vet.post,
  }));
};

export const fetchBlogById = async (blogId) => {
  const { data } = await api_essentials.get(`/blog/${blogId}`);
  return data;
};

export const fetchProductById = async (itemId) => {
  const { data } = await api_essentials.get(`/items/${itemId}`);
  return normalizeProduct(data);
};

export default api_essentials;