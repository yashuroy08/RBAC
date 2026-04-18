import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, Grid, Settings } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 border-b py-0 mb-0" style={{
            background: 'rgba(12, 20, 32, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'var(--color-border-subtle)',
        }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
                {/* Brand */}
                <Link to="/dashboard" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-command) 0%, var(--color-signal) 100%)',
                            boxShadow: '0 0 12px var(--color-signal-glow)',
                        }}>
                        <Shield size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-wide text-canvas select-none hidden sm:inline">
                        RBAC<span className="text-text-muted font-medium ml-1">System</span>
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-1">
                    <Link
                        to="/dashboard"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            isActive('/dashboard')
                                ? 'text-signal bg-signal/10'
                                : 'text-text-muted hover:text-canvas hover:bg-white/5'
                        }`}
                    >
                        <Grid size={14} /> Dashboard
                    </Link>
                    {isAdmin() && (
                        <Link
                            to="/admin"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                isActive('/admin')
                                    ? 'text-signal bg-signal/10'
                                    : 'text-text-muted hover:text-canvas hover:bg-white/5'
                            }`}
                        >
                            <Settings size={14} /> Admin
                        </Link>
                    )}
                </div>

                {/* User + Logout */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md border"
                        style={{
                            background: 'rgba(15, 28, 46, 0.6)',
                            borderColor: 'var(--color-border-subtle)',
                        }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-command) 0%, var(--color-signal) 100%)',
                                color: 'white',
                            }}>
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-canvas hidden sm:inline">{user?.username}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-text-muted hover:text-crit-solid hover:bg-crit-solid/10 rounded-md transition-all"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
