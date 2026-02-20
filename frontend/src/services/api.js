import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login if we get a 401 AND we are not already on the login page
        // This prevents infinite refresh loops
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
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

    // Location management
    getActiveLocationConfig: () => api.get('/admin/location/active'),
    getAllLocationConfigs: () => api.get('/admin/location/all'),
    saveLocationConfig: (config) => api.post('/admin/location', config),
    toggleLocationRestriction: (configId, enabled) =>
        api.put(`/admin/location/${configId}/toggle?enabled=${enabled}`),
    deleteLocationConfig: (configId) => api.delete(`/admin/location/${configId}`),
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

