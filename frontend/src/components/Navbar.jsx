import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiShield, FiUser, FiGrid, FiMenu } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar glass-effect">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    <div className="brand-icon">
                        <FiShield />
                    </div>
                    <span className="brand-text">RBAC System</span>
                </Link>

                <div className="navbar-menu">
                    <Link to="/dashboard" className="nav-link">
                        <FiGrid /> Dashboard
                    </Link>
                    {isAdmin() && (
                        <Link to="/admin" className="nav-link">
                            <FiUser /> Admin
                        </Link>
                    )}
                </div>

                <div className="navbar-actions">
                    <div className="user-pill">
                        <div className="user-avatar">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-name">{user?.username}</span>
                    </div>

                    <button onClick={handleLogout} className="logout-btn" title="Logout">
                        <FiLogOut />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
