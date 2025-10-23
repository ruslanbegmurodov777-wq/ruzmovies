// Utility functions for API calls
import axios from "axios";

// Create an axios instance
// Unified deployment: always hit same-origin backend
const baseURL = "/api/v1";

const api = axios.create({
  baseURL: baseURL,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch videos with pagination and simple in-memory cache
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} [params.category]
 * @returns {Promise<Array>} Array of video objects
 */
const __videosCache = new Map(); // key: `${page}:${limit}:${category||''}` -> { t, data }
const __VIDEOS_TTL_MS = 60 * 1000; // 1 minute

export const fetchVideos = async ({ page = 1, limit = 12, category } = {}) => {
  const key = `${page}:${limit}:${category || ''}`;
  const cached = __videosCache.get(key);
  if (cached && Date.now() - cached.t < __VIDEOS_TTL_MS) {
    return cached.data;
  }
  try {
    const params = { page, limit };
    if (category && category !== 'all') params.category = category;
    const response = await api.get("/videos", { params });
    const data = Array.isArray(response.data.data) ? response.data.data : [];
    __videosCache.set(key, { t: Date.now(), data });
    return data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};

/**
 * Fetch a single video by ID
 * @param {string} id - Video ID
 * @returns {Promise<Object>} Video object
 */
export const fetchVideo = async (id) => {
  try {
    const response = await api.get(`/videos/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching video ${id}:`, error);
    throw error;
  }
};

/**
 * Search videos by term
 * @param {string} searchTerm - Term to search for
 * @returns {Promise<Array>} Array of matching video objects
 */
export const searchVideos = async (searchTerm) => {
  try {
    const response = await api.get(
      `/videos/search?searchterm=${encodeURIComponent(searchTerm)}`
    );
    // Ensure we return an array even if response.data.data is not an array
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error(`Error searching videos for "${searchTerm}":`, error);
    // Return empty array on error
    return [];
  }
};

/**
 * User registration
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Response data
 */
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

/**
 * User login
 * @param {Object} credentials - User login credentials
 * @returns {Promise<Object>} Response data
 */
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

/**
 * Create a new video
 * @param {Object} videoData - Video data
 * @returns {Promise<Object>} Created video data
 */
export const createVideo = async (videoData) => {
  try {
    const response = await api.post("/videos", videoData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating video:", error);
    throw error;
  }
};

export default api;