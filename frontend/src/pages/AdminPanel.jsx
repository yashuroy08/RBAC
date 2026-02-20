import { useEffect, useState } from 'react';
import { adminAPI, riskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import LocationSettings from '../components/LocationSettings';
import SystemContext from '../components/SystemContext';
import { FiUsers, FiUser, FiActivity, FiShield, FiLock, FiUnlock, FiTrash2, FiSearch, FiAlertTriangle, FiMapPin, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Admin.css';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userRiskData, setUserRiskData] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [locationConfigs, setLocationConfigs] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchLocationConfigs();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getAllUsers();
            if (response.data.success) setUsers(response.data.data);
        } catch (error) {
            showMessage('Error fetching users', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationConfigs = async () => {
        try {
            const response = await adminAPI.getAllLocationConfigs();
            if (response.data.success) setLocationConfigs(response.data.data || []);
        } catch (error) {
            console.error('Error fetching location configs:', error);
        }
    };

    const fetchUserRiskData = async (userId) => {
        try {
            const [statusRes, sessionsRes, eventsRes] = await Promise.all([
                riskAPI.getRiskStatus(userId),
                riskAPI.getActiveSessions(userId),
                riskAPI.getRiskEvents(userId, 10),
            ]);
            setUserRiskData({
                status: statusRes.data.data,
                sessions: sessionsRes.data.data,
                events: eventsRes.data.data,
            });
        } catch (error) {
            console.error('Error fetching risk data:', error);
        }
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        if (user.id) fetchUserRiskData(user.id);
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAssignAdmin = async (userId) => {
        try { await adminAPI.assignAdmin(userId); showMessage('Admin assigned', 'success'); fetchUsers(); }
        catch { showMessage('Failed', 'danger'); }
    };
    const handleRemoveAdmin = async (userId) => {
        try { await adminAPI.removeAdmin(userId); showMessage('Admin removed', 'success'); fetchUsers(); }
        catch { showMessage('Failed', 'danger'); }
    };
    const handleLockUser = async (userId) => {
        try { await adminAPI.lockUser(userId); showMessage('User locked', 'success'); fetchUsers(); isSelectedUpdated(userId); }
        catch { showMessage('Failed', 'danger'); }
    };
    const handleUnlockUser = async (userId) => {
        try { await adminAPI.unlockUser(userId); showMessage('User unlocked', 'success'); fetchUsers(); isSelectedUpdated(userId); }
        catch { showMessage('Failed', 'danger'); }
    };
    const handleInvalidateSessions = async (userId) => {
        if (window.confirm('Invalidate all sessions?')) {
            try { await riskAPI.invalidateSessions(userId); showMessage('Sessions invalidated', 'success'); fetchUserRiskData(userId); }
            catch { showMessage('Failed', 'danger'); }
        }
    };

    const handleAssignLocation = async (userId, locationId) => {
        try {
            const response = await adminAPI.assignLocationToUser(userId, locationId);
            if (response.data.success) {
                showMessage('Location assigned successfully', 'success');
                fetchUsers();
                setSelectedUser(response.data.data);
            }
        } catch {
            showMessage('Failed to assign location', 'danger');
        }
    };

    const handleRemoveLocation = async (userId) => {
        try {
            const response = await adminAPI.removeLocationFromUser(userId);
            if (response.data.success) {
                showMessage('Location removed from user', 'success');
                fetchUsers();
                setSelectedUser(response.data.data);
            }
        } catch {
            showMessage('Failed to remove location', 'danger');
        }
    };

    const isSelectedUpdated = (userId) => {
        if (selectedUser?.id === userId) {
            const updated = users.find(u => u.id === userId);
            if (updated) setSelectedUser({ ...selectedUser, ...updated });
        }
    }

    if (loading) return <div className="loading-screen"><div className="loader"></div></div>;

    return (
        <div className="admin-layout">
            <Navbar />

            <main className="admin-content">
                <header className="admin-header">
                    <h1><FiShield /> Admin Center</h1>
                    <p>User Identity & Access Management</p>
                </header>

                {/* Tab Navigation */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <FiUsers /> Users
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'location' ? 'active' : ''}`}
                        onClick={() => setActiveTab('location')}
                    >
                        <FiMapPin /> Location
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'context' ? 'active' : ''}`}
                        onClick={() => setActiveTab('context')}
                    >
                        <FiActivity /> System Context
                    </button>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`admin-alert ${message.type}`}
                    >
                        {message.type === 'danger' ? <FiAlertTriangle /> : <FiShield />}
                        {message.text}
                    </motion.div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="admin-grid">
                        {/* User List Sidebar */}
                        <aside className="user-list-panel glass-card">
                            <div className="panel-header">
                                <h3><FiUsers /> Users <span className="badge badge-info">{users.length}</span></h3>
                                <div className="search-box">
                                    <FiSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="users-scroll">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <div className="user-avatar-sm">{user.username.charAt(0).toUpperCase()}</div>
                                        <div className="user-info-sm">
                                            <span className="u-name">{user.username}</span>
                                            <span className="u-role">
                                                {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                                                {!user.accountNonLocked && <span className="status-dot danger"></span>}
                                            </span>
                                        </div>
                                        <FiSearch className="arrow-icon" />
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* User Details Panel */}
                        <section className="user-details-panel glass-card">
                            {selectedUser ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={selectedUser.id}
                                    className="details-content"
                                >
                                    <div className="user-profile-header">
                                        <div className="user-avatar-lg">{selectedUser.username.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <h2>{selectedUser.fullName || selectedUser.username}</h2>
                                            <span className="badge badge-info">{selectedUser.email}</span>
                                        </div>
                                        <div className="profile-actions">
                                            {selectedUser.accountNonLocked ? (
                                                <button onClick={() => handleLockUser(selectedUser.id)} className="btn btn-outline-danger">
                                                    <FiLock /> Lock
                                                </button>
                                            ) : (
                                                <button onClick={() => handleUnlockUser(selectedUser.id)} className="btn btn-outline-success">
                                                    <FiUnlock /> Unlock
                                                </button>
                                            )}
                                            <button onClick={() => handleInvalidateSessions(selectedUser.id)} className="btn btn-danger">
                                                <FiTrash2 /> Kill Sessions
                                            </button>
                                        </div>
                                    </div>

                                    <div className="details-grid">
                                        {/* Risk Overview */}
                                        {userRiskData && (
                                            <div className="detail-card">
                                                <h4><FiActivity /> Risk Profile</h4>
                                                <div className="risk-metric">
                                                    <div className="metric-value">{userRiskData.status?.riskScore?.toFixed(1)}%</div>
                                                    <div className="metric-label">Current Risk Score</div>
                                                    <div className="risk-bar">
                                                        <div
                                                            className="risk-fill"
                                                            style={{
                                                                width: `${Math.min(userRiskData.status?.riskScore, 100)}%`,
                                                                background: userRiskData.status?.riskScore > 50 ? 'var(--danger)' : 'var(--success)'
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Role Management */}
                                        <div className="detail-card">
                                            <h4><FiShield /> Roles & Permissions</h4>
                                            <div className="roles-list">
                                                {selectedUser.roles.map(r => (
                                                    <span key={r} className="role-tag">{r.replace('ROLE_', '')}</span>
                                                ))}
                                            </div>
                                            <div className="role-actions">
                                                {!selectedUser.roles.includes('ROLE_ADMIN') ? (
                                                    <button onClick={() => handleAssignAdmin(selectedUser.id)} className="btn btn-sm btn-primary">Make Admin</button>
                                                ) : (
                                                    <button onClick={() => handleRemoveAdmin(selectedUser.id)} className="btn btn-sm btn-secondary">Remove Admin</button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Location Assignment */}
                                        <div className="detail-card">
                                            <h4><FiMapPin /> Location Assignment</h4>
                                            <div className="location-assign-section">
                                                {selectedUser.assignedLocationName ? (
                                                    <div className="assigned-location-info">
                                                        <div className="assigned-badge">
                                                            <FiMapPin />
                                                            <span>{selectedUser.assignedLocationName}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveLocation(selectedUser.id)}
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Remove assigned location"
                                                        >
                                                            <FiX /> Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="no-location-text">No specific location assigned (uses global config)</p>
                                                )}

                                                <div className="location-assign-controls">
                                                    <select
                                                        id={`location-select-${selectedUser.id}`}
                                                        className="location-select"
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleAssignLocation(selectedUser.id, e.target.value);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    >
                                                        <option value="" disabled>Assign a location zone...</option>
                                                        {locationConfigs.map(loc => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.locationName || `Zone #${loc.id}`} ({loc.radiusKm} km)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {locationConfigs.length === 0 && (
                                                    <p className="no-location-text" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                                        No location zones created yet. Go to the "Location Restriction" tab to create one.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="empty-selection">
                                    <FiUser size={64} />
                                    <h3>Select a user to view details</h3>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                    <LocationSettings />
                )}

                {/* System Context Tab */}
                {activeTab === 'context' && (
                    <SystemContext />
                )}
            </main>
        </div>
    );
};

export default AdminPanel;
