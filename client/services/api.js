import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

// Event emitter for auth state changes
let authChangeCallback = null;
export const setAuthChangeCallback = (callback) => {
    authChangeCallback = callback;
};

const api = axios.create({
    baseURL: env.API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401/403 - token expired or invalid
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Clear auth data
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            
            // Notify auth context to update state
            if (authChangeCallback) {
                authChangeCallback(null, null);
            }
        }

        // Create user-friendly error message
        const errorMessage = getErrorMessage(error);
        error.userMessage = errorMessage;

        return Promise.reject(error);
    }
);

// Helper to get user-friendly error messages
const getErrorMessage = (error) => {
    if (!error.response) {
        return 'Network error. Please check your connection.';
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    const requestUrl = error.config?.url || '';

    // Don't show "session expired" for profile check (bootstrap) - it's a silent check
    const isBackgroundCheck = requestUrl.includes('/auth/profile');

    switch (status) {
        case 400:
            return serverMessage || 'Invalid request. Please check your input.';
        case 401:
            // Only show session expired for actual user-initiated actions, not background checks
            return isBackgroundCheck ? '' : (serverMessage || 'Invalid credentials.');
        case 403:
            return isBackgroundCheck ? '' : 'Access denied. Please log in.';
        case 404:
            return serverMessage || 'Not found.';
        case 422:
            return serverMessage || 'Validation error. Please check your input.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return serverMessage || 'Something went wrong. Please try again.';
    }
};

export default api;
