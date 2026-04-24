import axios from 'axios';

// Ensure the base URL always ends with /api for correct path resolution.
// In production: VITE_API_BASE_URL=https://rbac-vsr2.onrender.com → baseURL = https://rbac-vsr2.onrender.com/api
// In local dev: falls back to /api (Vite proxy handles forwarding to localhost:8081)
const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawBase ? `${rawBase.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token from localStorage for cross-origin auth
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('rbac_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login if we get a 401 AND we are not already on the login page
        // This prevents infinite refresh loops
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            localStorage.removeItem('rbac_token');
            // Pass the reason to the login page so the user knows why they were logged out
            const reason = error.response?.data?.message || 'Your session has expired. Please login again.';
            const encoded = encodeURIComponent(reason);
            window.location.href = `/login?session_expired=true&reason=${encoded}`;
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    verifyMfa: (data) => api.post('/auth/verify-mfa', data),
    getTrustedDevices: () => api.get('/auth/trusted-devices'),
    revokeTrustedDevice: (deviceId) => api.delete(`/auth/trusted-devices/${deviceId}/revoke`),
    resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
    getUserById: (id) => api.get(`/user/${id}`),
    getUserByUsername: (username) => api.get(`/user/username/${username}`),
};

export const adminAPI = {
    getAllUsers: () => api.get('/admin/users'),
    assignAdmin: (userId) => api.post(`/admin/users/${userId}/assign-admin`),
    removeAdmin: (userId) => api.post(`/admin/users/${userId}/remove-admin`),
    lockUser: (userId) => api.post(`/admin/users/${userId}/lock`),
    unlockUser: (userId) => api.post(`/admin/users/${userId}/unlock`),
    assignLocationToUser: (userId, locationId) => api.post(`/admin/users/${userId}/assign-location/${locationId}`),
    removeLocationFromUser: (userId) => api.post(`/admin/users/${userId}/remove-location`),
    deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
    getAllRiskData: () => api.get('/risk/all-status'),

    // Location management
    getActiveLocationConfig: () => api.get('/admin/location/active'),
    getAllLocationConfigs: () => api.get('/admin/location/all'),
    saveLocationConfig: (config) => api.post('/admin/location', config),
    toggleLocationRestriction: (configId, enabled) =>
        api.put(`/admin/location/${configId}/toggle?enabled=${enabled}`),
    deleteLocationConfig: (configId) => api.delete(`/admin/location/${configId}`),
    getAuditLogs: (search) => api.get(`/admin/audit-logs${search ? '?search=' + encodeURIComponent(search) : ''}`),
    getDashboardStats: (range = 'hours') => api.get(`/admin/dashboard/stats?range=${range}`),
};

export const riskAPI = {
    evaluateRisk: (userId) => api.get(`/risk/evaluate/${userId}`),
    getRiskStatus: (userId) => api.get(`/risk/status/${userId}`),
    getActiveSessions: (userId) => api.get(`/risk/sessions/${userId}`),
    invalidateSessions: (userId) => api.post(`/risk/invalidate/${userId}`),
    getRiskEvents: (userId, limit = 10) => api.get(`/risk/events/${userId}?limit=${limit}`),
};

// User-accessible endpoints for dashboard (works for all authenticated users)
export const userRiskAPI = {
    getRiskStatus: () => api.get('/user/my-risk-status'),
    getActiveSessions: () => api.get('/user/my-sessions'),
    getRiskEvents: (limit = 10) => api.get(`/user/my-risk-events?limit=${limit}`),
};

export default api;

