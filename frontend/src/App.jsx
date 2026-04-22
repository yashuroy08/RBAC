import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import SaaSLandingPage from './pages/SaaSLandingPage';
import MathematicalLoader from './components/MathematicalLoader';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <MathematicalLoader text="Authenticating Session" />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// App Routes
function AppRoutes() {
    const { user, loading, logout } = useAuth();

    // Auto-logout after 30 minutes of inactivity
    useInactivityTimeout(() => {
        if (user) {
            console.warn('Inactivity timeout reached. Logging out...');
            logout();
        }
    }, 30 * 60 * 1000); // 30 minutes

    if (loading) {
        return <MathematicalLoader text="Initializing Core Systems" />;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={<SaaSLandingPage />}
            />
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to="/dashboard" replace /> : <Register />}
            />
            <Route
                path="/reset-password"
                element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute adminOnly>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right"
                toastOptions={{
                    style: {
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-light-text)',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '13px',
                    },
                    success: {
                        iconTheme: {
                            primary: 'var(--color-safe)',
                            secondary: 'white',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: 'var(--color-crit-solid)',
                            secondary: 'white',
                        },
                    },
                }}
            />
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
