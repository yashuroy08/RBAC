import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Only check auth if we have a stored token
            const token = localStorage.getItem('rbac_token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            const response = await authAPI.getCurrentUser();
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            localStorage.removeItem('rbac_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get user's current geolocation using browser API
     * Returns { latitude, longitude } or null if unavailable
     */
    const getUserLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation not supported by browser');
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                }
            );
        });
    };

    const login = async (credentials) => {
        // Get user location before login
        const location = await getUserLocation();

        const loginData = {
            username: credentials.username,
            password: credentials.password,
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
        };

        const response = await authAPI.login(loginData);
        // Store JWT token for cross-origin auth
        if (response.data.success && response.data.data?.token) {
            localStorage.setItem('rbac_token', response.data.data.token);
        }
        // ONLY set user if MFA is not required. 
        // If MFA is required, we wait until it's verified to set the user state.
        if (response.data.success && !response.data.data?.mfaRequired) {
            setUser(response.data.data);
        }
        return response.data;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        return response.data;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (e) {
            // Logout may fail if session expired, that's OK
        }
        localStorage.removeItem('rbac_token');
        setUser(null);
    };

    const isAdmin = () => {
        return user?.roles?.includes('ROLE_ADMIN');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
