import { useEffect, useState } from 'react';
import { adminAPI, riskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import LocationSettings from '../components/LocationSettings';
import SystemContext from '../components/SystemContext';
import { Users, User, Activity, Shield, Lock, Unlock, Trash2, Search, AlertTriangle, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-r-2 border-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen text-light-text pb-12 font-sans selection:bg-primary/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8 p-6 glass-card flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-light-text mb-2 m-0 flex items-center gap-3">Admin Center</h1>
                        <p className="text-dark-text-muted m-0 text-lg">User Identity & Access Management</p>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-dark-border pb-px overflow-x-auto">
                    <button
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-primary text-primary bg-primary/5 rounded-t-lg shadow-[inset_0_-2px_10px_rgba(37,99,235,0.1)]' : 'border-transparent text-dark-text-muted hover:text-light-text hover:bg-dark-bg/50 rounded-t-lg'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={18} /> Users
                    </button>
                    <button
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'location' ? 'border-primary text-primary bg-primary/5 rounded-t-lg shadow-[inset_0_-2px_10px_rgba(37,99,235,0.1)]' : 'border-transparent text-dark-text-muted hover:text-light-text hover:bg-dark-bg/50 rounded-t-lg'}`}
                        onClick={() => setActiveTab('location')}
                    >
                        <MapPin size={18} /> Location
                    </button>
                    <button
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'context' ? 'border-primary text-primary bg-primary/5 rounded-t-lg shadow-[inset_0_-2px_10px_rgba(37,99,235,0.1)]' : 'border-transparent text-dark-text-muted hover:text-light-text hover:bg-dark-bg/50 rounded-t-lg'}`}
                        onClick={() => setActiveTab('context')}
                    >
                        <Activity size={18} /> System Context
                    </button>
                </div>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`flex items-center gap-3 p-4 mb-6 rounded-xl border font-medium ${message.type === 'danger' ? 'bg-danger/10 border-danger/30 text-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-success/10 border-success/30 text-success shadow-[0_0_15px_rgba(34,197,94,0.2)]'}`}
                        >
                            {message.type === 'danger' ? <AlertTriangle size={20} /> : <Shield size={20} />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-300px)] min-h-[600px]">
                        {/* User List Sidebar */}
                        <aside className="lg:col-span-4 glass-card flex flex-col overflow-hidden p-0">
                            <div className="p-5 border-b border-dark-border bg-dark-bg/30">
                                <h3 className="text-xl font-bold text-light-text m-0 flex items-center gap-3 mb-4">
                                    <Users size={20} className="text-primary" /> Users 
                                    <span className="badge badge-info shadow-[0_0_10px_rgba(6,182,212,0.2)]">{users.length}</span>
                                </h3>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        className="w-full bg-dark-bg border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-light-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-dark-text-muted"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedUser?.id === user.id ? 'bg-primary/10 border-primary/40 shadow-[0_0_10px_rgba(37,99,235,0.15)]' : 'border-transparent hover:bg-dark-bg hover:border-dark-border'}`}
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${selectedUser?.id === user.id ? 'bg-primary text-white shadow-lg' : 'bg-dark-border text-light-text'}`}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold text-light-text truncate">{user.username}</span>
                                            <span className="flex items-center gap-2 text-xs text-dark-text-muted mt-0.5">
                                                {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                                                {!user.accountNonLocked && <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" title="Locked"></span>}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="p-6 text-center text-dark-text-muted text-sm">
                                        No users match your search.
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* User Details Panel */}
                        <section className="lg:col-span-8 glass-card overflow-y-auto custom-scrollbar relative">
                            {selectedUser ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={selectedUser.id}
                                    className="p-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-dark-border">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-4 ring-dark-bg shrink-0">
                                            {selectedUser.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-light-text m-0 mb-2">{selectedUser.fullName || selectedUser.username}</h2>
                                            <span className="badge badge-info">{selectedUser.email}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                                            {selectedUser.accountNonLocked ? (
                                                <button onClick={() => handleLockUser(selectedUser.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/50 text-danger hover:bg-danger/10 transition-colors font-medium">
                                                    <Lock size={18} /> Lock
                                                </button>
                                            ) : (
                                                <button onClick={() => handleUnlockUser(selectedUser.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-success/50 text-success hover:bg-success/10 transition-colors font-medium">
                                                    <Unlock size={18} /> Unlock
                                                </button>
                                            )}
                                            <button onClick={() => handleInvalidateSessions(selectedUser.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger text-white hover:bg-red-600 transition-colors font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-danger/50">
                                                <Trash2 size={18} /> Kill Sessions
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        {/* Risk Overview */}
                                        {userRiskData && (
                                            <div className="bg-dark-bg/40 border border-dark-border rounded-xl p-5 shadow-sm">
                                                <h4 className="flex items-center gap-2 text-lg font-bold text-light-text mb-4 m-0 border-b border-dark-border/50 pb-2"><Activity className="text-primary" size={20} /> Risk Profile</h4>
                                                <div className="flex flex-col items-center justify-center bg-dark-bg/80 p-6 rounded-lg border border-dark-border">
                                                    <div className="text-4xl font-mono font-extrabold" style={{ color: userRiskData.status?.riskScore > 50 ? 'var(--color-danger)' : 'var(--color-success)', textShadow: `0 0 15px ${userRiskData.status?.riskScore > 50 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>{userRiskData.status?.riskScore?.toFixed(1) || 0}%</div>
                                                    <div className="text-xs uppercase tracking-wider text-dark-text-muted mt-2 font-medium">Current Risk Score</div>
                                                    <div className="w-full h-2.5 bg-dark-bg rounded-full mt-4 overflow-hidden border border-dark-border/50">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${Math.min(userRiskData.status?.riskScore || 0, 100)}%`,
                                                                background: `linear-gradient(90deg, ${userRiskData.status?.riskScore > 50 ? 'var(--color-warning)' : 'var(--color-success)'} 0%, ${userRiskData.status?.riskScore > 50 ? 'var(--color-danger)' : 'var(--color-success)'} 100%)`,
                                                                boxShadow: `0 0 10px ${userRiskData.status?.riskScore > 50 ? 'var(--color-danger)' : 'var(--color-success)'}`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Role Management */}
                                        <div className="bg-dark-bg/40 border border-dark-border rounded-xl p-5 shadow-sm flex flex-col">
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-light-text mb-4 m-0 border-b border-dark-border/50 pb-2"><Shield className="text-primary" size={20} /> Roles & Permissions</h4>
                                            <div className="flex flex-wrap gap-2 mb-6 flex-1">
                                                {selectedUser.roles.map(r => (
                                                    <span key={r} className="px-3 py-1 bg-dark-border text-light-text font-medium text-xs rounded-full border border-dark-text-muted/20 uppercase tracking-wide">{r.replace('ROLE_', '')}</span>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-dark-border/50 mt-auto">
                                                {!selectedUser.roles.includes('ROLE_ADMIN') ? (
                                                    <button onClick={() => handleAssignAdmin(selectedUser.id)} className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-bold transition-all shadow-[0_0_10px_rgba(37,99,235,0.1)]">Make Admin</button>
                                                ) : (
                                                    <button onClick={() => handleRemoveAdmin(selectedUser.id)} className="w-full py-2.5 bg-dark-bg hover:bg-dark-border text-dark-text-muted hover:text-light-text border border-dark-border rounded-lg text-sm font-bold transition-all">Remove Admin</button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Location Assignment */}
                                        <div className="bg-dark-bg/40 border border-dark-border rounded-xl p-5 shadow-sm md:col-span-2">
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-light-text mb-4 m-0 border-b border-dark-border/50 pb-2"><MapPin className="text-primary" size={20} /> Location Assignment</h4>
                                            <div className="flex flex-col gap-4">
                                                {selectedUser.assignedLocationName ? (
                                                    <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/20">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/20 text-primary rounded-lg shrink-0">
                                                                <MapPin size={20} />
                                                            </div>
                                                            <span className="font-semibold text-light-text text-lg truncate pr-3">{selectedUser.assignedLocationName}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveLocation(selectedUser.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-danger hover:text-white bg-danger/10 hover:bg-danger rounded-lg border border-danger/30 transition-all shrink-0"
                                                            title="Remove assigned location"
                                                        >
                                                            <X size={14} /> Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-dark-text-muted italic bg-dark-bg/50 p-4 rounded-xl border border-dark-border m-0 text-center">No specific location assigned (uses global config)</p>
                                                )}

                                                <div className="mt-2 relative">
                                                    <select
                                                        id={`location-select-${selectedUser.id}`}
                                                        className="w-full bg-dark-bg border border-dark-border rounded-xl p-3.5 text-light-text text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer hover:border-dark-text-muted/50 pb-3.5"
                                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
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
                                                    <p className="text-xs text-warning mt-1 m-0 flex items-center gap-1.5 bg-warning/10 p-2 rounded border border-warning/20">
                                                        <AlertTriangle size={14} className="shrink-0" /> No location zones created yet. Go to the "Location" tab to create one.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-dark-text-muted p-6 opacity-60">
                                    <div className="w-24 h-24 rounded-full bg-dark-bg flex items-center justify-center mb-6 shadow-inner border border-dark-border">
                                        <User size={48} className="text-dark-text-muted opacity-50" />
                                    </div>
                                    <h3 className="text-xl font-bold text-light-text mb-2">Select a user to view details</h3>
                                    <p className="text-center max-w-sm">Click on any user from the list on the left to see their risk profile, roles, and location settings.</p>
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
