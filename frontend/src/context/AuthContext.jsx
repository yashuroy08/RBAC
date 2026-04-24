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
        // SECURITY: Clear any stale token BEFORE login attempt
        // This prevents the JWT interceptor from auto-authenticating
        // a previous session on the new login request
        localStorage.removeItem('rbac_token');

        // Get user location before login
        const location = await getUserLocation();

        const loginData = {
            username: credentials.username,
            password: credentials.password,
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
        };

        const response = await authAPI.login(loginData);

        if (response.data.success && response.data.data?.mfaRequired) {
            // MFA is required — do NOT store the JWT token yet.
            // The user must complete MFA verification first.
            // Store only the session ID for the MFA verification call.
            const mfaSessionId = response.data.data.sessionId;
            if (mfaSessionId && typeof mfaSessionId === 'string' && mfaSessionId.trim().length > 0) {
                localStorage.setItem('rbac_mfa_session', mfaSessionId);
            }
            // Do NOT set user state — user is not fully authenticated
        } else if (response.data.success && response.data.data?.token) {
            // Fully authenticated — store token and set user
            localStorage.setItem('rbac_token', response.data.data.token);
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
