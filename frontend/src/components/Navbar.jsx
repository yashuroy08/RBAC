import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User, Grid } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-dark-card/80 border-b border-dark-border py-4 px-6 mb-8 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-3 transition-all hover:scale-105">
                    <div className="flex items-center justify-center bg-primary/20 text-primary p-2 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Shield size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-wider text-light-text select-none">RBAC System</span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="flex items-center gap-2 text-dark-text-muted hover:text-primary transition-colors font-medium">
                        <Grid size={18} /> Dashboard
                    </Link>
                    {isAdmin() && (
                        <Link to="/admin" className="flex items-center gap-2 text-dark-text-muted hover:text-primary transition-colors font-medium">
                            <User size={18} /> Admin
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3 bg-dark-bg/50 px-4 py-2 rounded-full border border-dark-border">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm ring-1 ring-primary/40">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-light-text">{user?.username}</span>
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="p-2 text-dark-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all" 
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
