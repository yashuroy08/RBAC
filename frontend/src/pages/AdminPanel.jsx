import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, riskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import LocationSettings from '../components/LocationSettings';
import AdaptiveSkeleton from '../components/AdaptiveSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MapPin, Activity, Shield, Trash2, UserCheck,
    ChevronDown, Info, AlertTriangle, Search, RefreshCw,
    Monitor, Smartphone, Globe, Clock, User, X,
    Lock, Unlock, ShieldAlert, Zap, Globe2, ScanFace,
    Filter, ArrowUpDown, ClipboardList, CheckCircle2, XCircle, Download
} from 'lucide-react';

const TABS = [
    { key: 'users', label: 'User Management', icon: <Users size={14} /> },
    { key: 'location', label: 'Location Policy', icon: <MapPin size={14} /> },
    { key: 'risk', label: 'Risk Monitor', icon: <Activity size={14} /> },
    { key: 'audit', label: 'Audit Logs', icon: <ClipboardList size={14} /> },
];

const AdminPanel = () => {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [allRiskData, setAllRiskData] = useState([]);
    const [locationConfigs, setLocationConfigs] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserSessions, setSelectedUserSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filtering & Sorting State
    const [filterRole, setFilterRole] = useState('ALL'); // ALL, ROLE_ADMIN, ROLE_USER
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, LOCKED
    const [sortBy, setSortBy] = useState('username_asc'); // username_asc, email_asc, status_desc, etc.

    // Risk Filtering State
    const [riskSearchQuery, setRiskSearchQuery] = useState('');
    const [riskLevelFilter, setRiskLevelFilter] = useState('ALL'); // ALL, CRITICAL, ELEVATED, SAFE
    const [riskStatusFilter, setRiskStatusFilter] = useState('ALL'); // ALL, RE_AUTH, PASSIVE

    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditSearchQuery, setAuditSearchQuery] = useState('');
    const [auditLoading, setAuditLoading] = useState(false);

    useEffect(() => {
        if (isAdmin()) {
            fetchUsers();
            fetchAllRisk();
            fetchLocationConfigs();
            fetchAuditLogs();
        }
    }, [isAdmin]);

    // Debounce search query for audit logs
    useEffect(() => {
        if (activeTab === 'audit') {
            const timeoutId = setTimeout(() => {
                fetchAuditLogs();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [auditSearchQuery, activeTab]);

    // Update selectedUser if users list changes
    useEffect(() => {
        if (selectedUser) {
            const updated = users.find(u => u.id === selectedUser.id);
            if (updated) setSelectedUser(updated);
            fetchUserSessions(selectedUser.id);
        }
    }, [users, selectedUser?.id]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getAllUsers();
            setUsers(res.data.data || []);
        } catch (e) {
            console.error('Error fetching users', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllRisk = async () => {
        try {
            const res = await adminAPI.getAllRiskData();
            setAllRiskData(res.data.data || []);
        } catch (e) {
            console.error('Error fetching risk data', e);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            setAuditLoading(true);
            const res = await adminAPI.getAuditLogs(auditSearchQuery);
            setAuditLogs(res.data.data || []);
        } catch (e) {
            console.error('Error fetching audit logs', e);
        } finally {
            setAuditLoading(false);
        }
    };

    const downloadLogsAsCSV = () => {
        if (!auditLogs.length) return;
        const headers = ['Timestamp', 'Event Category', 'Action', 'Severity', 'Actor', 'Target', 'Outcome', 'IP Address', 'Device', 'Description'];
        const csvRows = [headers.join(',')];
        
        auditLogs.forEach(log => {
            const date = new Date(log.timestamp).toISOString();
            const values = [
                date,
                log.category,
                log.action,
                log.severity,
                log.actorUsername,
                log.targetUsername || '',
                log.outcome,
                log.ipAddress || '',
                // Escape commas to prevent breaking CSV
                `"${(log.deviceInfo || '').replace(/"/g, '""')}"`,
                `"${(log.description || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(values.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const fetchLocationConfigs = async () => {
        try {
            const res = await adminAPI.getAllLocationConfigs();
            setLocationConfigs(res.data.data || []);
        } catch (e) {
            console.error('Error fetching location configs', e);
        }
    };

    const fetchUserSessions = async (userId) => {
        try {
            setSessionsLoading(true);
            const res = await riskAPI.getActiveSessions(userId);
            setSelectedUserSessions(res.data.data || []);
        } catch (e) {
            console.error('Error fetching user sessions', e);
        } finally {
            setSessionsLoading(false);
        }
    };

    const showNotification = (text, type) => {
        setNotification({ text, type });
        setTimeout(() => setNotification(null), 4000);
    };

    /* Actions */
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await adminAPI.deleteUser(userId);
            showNotification('User deleted successfully', 'success');
            if (selectedUser?.id === userId) setSelectedUser(null);
            fetchUsers();
        } catch (e) {
            showNotification('Failed to delete user', 'error');
        }
    };

    const handleAssignAdmin = async (userId) => {
        try {
            await adminAPI.assignAdmin(userId);
            showNotification('Admin privileges granted', 'success');
            fetchUsers();
        } catch (e) { showNotification('Failed to assign admin', 'error'); }
    };

    const handleRemoveAdmin = async (userId) => {
        try {
            await adminAPI.removeAdmin(userId);
            showNotification('Admin privileges removed', 'success');
            fetchUsers();
        } catch (e) { showNotification('Failed to remove admin', 'error'); }
    };

    const handleLockUser = async (userId) => {
        try {
            await adminAPI.lockUser(userId);
            showNotification('User account locked', 'success');
            fetchUsers();
        } catch (e) { showNotification('Failed to lock user', 'error'); }
    };

    const handleUnlockUser = async (userId) => {
        try {
            await adminAPI.unlockUser(userId);
            showNotification('User account unlocked', 'success');
            fetchUsers();
        } catch (e) { showNotification('Failed to unlock user', 'error'); }
    };

    const handleKillAllSessions = async (userId) => {
        if (!window.confirm('Are you sure you want to terminate all active sessions for this user? They will be signed out immediately.')) return;
        try {
            await riskAPI.invalidateSessions(userId);
            showNotification('All sessions terminated', 'success');
            fetchUserSessions(userId);
            fetchAllRisk();
        } catch (e) { showNotification('Failed to terminate sessions', 'error'); }
    };

    const handleAssignLocation = async (userId, locationId) => {
        try {
            await adminAPI.assignLocationToUser(userId, locationId);
            showNotification('Location zone assigned to user', 'success');
            fetchUsers();
        } catch (e) { showNotification('Failed to assign location', 'error'); }
    };

    const handleRemoveLocation = async (userId) => {
        try {
            await adminAPI.removeLocationFromUser(userId);
            showNotification('Specific location restriction removed', 'success');
            fetchUsers();
        } catch (e) { showNotification('Failed to remove location', 'error'); }
    };

    const getScoreLevel = (score) => {
        if (score >= 70) return { label: 'CRITICAL', bg: 'var(--color-crit-bg)', text: 'var(--color-crit-text)', color: 'var(--color-crit-solid)' };
        if (score >= 40) return { label: 'ELEVATED', bg: 'var(--color-warn-bg)', text: 'var(--color-warn-text)', color: 'var(--color-warn)' };
        return { label: 'SAFE', bg: 'var(--color-safe-bg)', text: 'var(--color-safe-text)', color: 'var(--color-safe)' };
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesRole = true;
        if (filterRole === 'ROLE_ADMIN') matchesRole = u.roles?.includes('ROLE_ADMIN');
        if (filterRole === 'ROLE_USER') matchesRole = !u.roles?.includes('ROLE_ADMIN');

        let matchesStatus = true;
        if (filterStatus === 'LOCKED') matchesStatus = !u.accountNonLocked;
        if (filterStatus === 'ACTIVE') matchesStatus = u.accountNonLocked;

        return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
        const [field, direction] = sortBy.split('_');
        const modifier = direction === 'asc' ? 1 : -1;

        if (field === 'username') return (a.username || '').localeCompare(b.username || '') * modifier;
        if (field === 'email') return (a.email || '').localeCompare(b.email || '') * modifier;
        if (field === 'status') {
            const statusA = a.accountNonLocked ? 1 : 0;
            const statusB = b.accountNonLocked ? 1 : 0;
            return (statusA - statusB) * modifier;
        }
        return 0; // Default fallback
    });

    const filteredRiskData = allRiskData.filter(r => {
        const matchesSearch = r.username?.toLowerCase().includes(riskSearchQuery.toLowerCase());
        
        const level = getScoreLevel(r.riskScore || 0);
        const matchesLevel = riskLevelFilter === 'ALL' || level.label === riskLevelFilter;

        let matchesStatus = true;
        if (riskStatusFilter === 'RE_AUTH') matchesStatus = r.mfaRequired;
        if (riskStatusFilter === 'PASSIVE') matchesStatus = !r.mfaRequired;

        return matchesSearch && matchesLevel && matchesStatus;
    });

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-deep)' }}>
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
                {/* Notification */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold z-50 fixed top-20 right-8"
                            style={{
                                background: notification.type === 'error' ? 'var(--color-crit-bg)' : 'var(--color-safe-bg)',
                                color: notification.type === 'error' ? 'var(--color-crit-text)' : 'var(--color-safe-text)',
                                border: `1px solid ${notification.type === 'error' ? 'var(--color-crit-solid)' : 'var(--color-safe)'}`,
                                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            {notification.type === 'error' ? <AlertTriangle size={14} /> : <Shield size={14} />}
                            {notification.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-canvas flex items-center gap-2">
                            <Shield size={18} style={{ color: 'var(--color-signal)' }} />
                            Administration
                        </h1>
                        <p className="text-xs text-text-muted mt-1">Manage users, policies, and security posture</p>
                    </div>
                    <button onClick={() => { fetchUsers(); fetchAllRisk(); fetchLocationConfigs(); }}
                        className="btn btn-secondary text-xs gap-1.5 border border-border-subtle bg-bg-card hover:bg-bg-elevated transition-all">
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--color-bg-card)' }}>
                    {TABS.map(tab => (
                        <button key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSelectedUser(null); }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all flex-1 justify-center ${
                                activeTab === tab.key
                                    ? 'text-canvas shadow-sm'
                                    : 'text-text-muted hover:text-canvas'
                            }`}
                            style={activeTab === tab.key ? {
                                background: 'var(--color-bg-elevated)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                color: 'var(--color-signal)'
                            } : {}}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'users' && (
                        <motion.div key="users"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative items-start">
                                {/* Left Column: User List */}
                                <div className={`glass-card overflow-hidden lg:col-span-${selectedUser ? '2' : '3'} transition-all duration-300`}>
                                    {/* Search & Filters */}
                                    <div className="p-4 flex flex-col items-stretch gap-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                                            <div className="relative flex-1 w-full">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                                <input
                                                    type="text"
                                                    placeholder="Search username or email..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="input-field input-field-with-icon py-2 text-xs w-full"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="badge badge-info whitespace-nowrap">{filteredUsers.length} users</span>
                                                {loading && <div className="w-4 h-4 border-2 border-signal/30 border-t-signal rounded-full animate-spin" />}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex items-center gap-1.5 border border-border-subtle rounded px-2 py-1 bg-midnight/30">
                                                <Filter size={12} className="text-text-muted opacity-70" />
                                                <select 
                                                    value={filterRole} 
                                                    onChange={(e) => setFilterRole(e.target.value)}
                                                    className="bg-transparent text-[10px] text-text-muted outline-none cursor-pointer uppercase font-bold tracking-widest"
                                                >
                                                    <option value="ALL">All Roles</option>
                                                    <option value="ROLE_ADMIN">Admins Only</option>
                                                    <option value="ROLE_USER">Users Only</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-1.5 border border-border-subtle rounded px-2 py-1 bg-midnight/30">
                                                <Filter size={12} className="text-text-muted opacity-70" />
                                                <select 
                                                    value={filterStatus} 
                                                    onChange={(e) => setFilterStatus(e.target.value)}
                                                    className="bg-transparent text-[10px] text-text-muted outline-none cursor-pointer uppercase font-bold tracking-widest"
                                                >
                                                    <option value="ALL">All Status</option>
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="LOCKED">Locked</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-1.5 border border-border-subtle rounded px-2 py-1 bg-midnight/30 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                                                <ArrowUpDown size={12} className="text-text-muted opacity-70" />
                                                <select 
                                                    value={sortBy} 
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="bg-transparent text-[10px] text-text-muted outline-none cursor-pointer uppercase font-bold tracking-widest w-full"
                                                >
                                                    <option value="username_asc">Sort: A-Z (Name)</option>
                                                    <option value="username_desc">Sort: Z-A (Name)</option>
                                                    <option value="email_asc">Sort: A-Z (Email)</option>
                                                    <option value="email_desc">Sort: Z-A (Email)</option>
                                                    <option value="status_desc">Sort: Locked First</option>
                                                    <option value="status_asc">Sort: Active First</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                                                    <th className="text-left py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">User</th>
                                                    <th className="text-left py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Email</th>
                                                    <th className="text-left py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider hidden sm:table-cell">Role</th>
                                                    <th className="text-left py-2.5 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    // Show skeletons while loading
                                                    Array(5).fill(0).map((_, i) => (
                                                        <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                                            <td colSpan="4" className="py-2 px-4">
                                                                <AdaptiveSkeleton type="table-row" style={{ background: 'transparent' }} />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : filteredUsers.map(u => (
                                                    <tr key={u.id} 
                                                        onClick={() => setSelectedUser(u)}
                                                        className="transition-colors cursor-pointer group"
                                                        style={{ 
                                                            borderBottom: '1px solid var(--color-border-subtle)',
                                                            background: selectedUser?.id === u.id ? 'var(--color-bg-elevated)' : 'transparent',
                                                            boxShadow: selectedUser?.id === u.id ? 'inset 2px 0 0 var(--color-signal)' : 'none'
                                                        }}>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-inner group-hover:scale-110 transition-transform"
                                                                    style={{ background: 'linear-gradient(135deg, var(--color-command), var(--color-signal))' }}>
                                                                    {u.username?.[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="text-xs font-semibold text-canvas">{u.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-text-muted truncate max-w-[150px]">{u.email}</td>
                                                        <td className="py-3 px-4 hidden sm:table-cell">
                                                            <span className="text-[9px] uppercase font-bold text-text-muted bg-midnight/50 px-2 py-0.5 rounded-md border" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                                                {u.roles && u.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className={`badge text-[8px] px-1.5 py-0.5 ${u.mfaEnabled ? 'badge-success' : 'badge-warning'}`}>
                                                                    MFA {u.mfaEnabled ? 'ON' : 'OFF'}
                                                                </span>
                                                                {!u.accountNonLocked && (
                                                                    <span className="badge badge-danger text-[8px] px-1.5 py-0.5"><Lock size={8} className="mr-0.5"/>LOCKED</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {!loading && filteredUsers.length === 0 && (
                                        <div className="p-12 text-center text-xs text-text-muted opacity-60">
                                            <Search size={24} className="mx-auto mb-3" />
                                            No users matched your search criteria
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Details Pane */}
                                <AnimatePresence>
                                    {selectedUser && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto max-h-[80vh] scrollbar-hide"
                                        >
                                            {/* User Identity Details */}
                                            <div className="glass-card p-4 relative overflow-hidden flex-shrink-0">
                                                <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 text-text-muted hover:text-white transition-colors p-1 hover:bg-white/5 rounded">
                                                    <X size={14} />
                                                </button>
                                                
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
                                                        style={{ background: 'linear-gradient(135deg, var(--color-command), var(--color-signal))' }}>
                                                        {selectedUser.username?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h3 className="text-sm font-bold text-canvas uppercase tracking-wide truncate">{selectedUser.username}</h3>
                                                        <p className="text-[10px] text-text-muted truncate">{selectedUser.email}</p>
                                                    </div>
                                                </div>

                                                {/* UUID + Created At + MFA */}
                                                <div className="flex flex-col gap-1.5 mb-4 p-2.5 rounded-lg border border-border-subtle/50 bg-midnight/20">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] uppercase font-bold text-text-muted tracking-widest w-10 shrink-0">UUID</span>
                                                        {selectedUser.publicId ? (
                                                            <code className="text-[9px] font-mono text-signal truncate select-all">{selectedUser.publicId}</code>
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-crit-text bg-crit-bg/10 px-1 rounded border border-crit-solid/10">PENDING SYNC</span>
                                                        )}
                                                    </div>
                                                    {selectedUser.createdAt && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] uppercase font-bold text-text-muted tracking-widest w-10 shrink-0">Joined</span>
                                                            <span className="text-[9px] text-text-muted">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] uppercase font-bold text-text-muted tracking-widest w-10 shrink-0">MFA</span>
                                                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${selectedUser.mfaEnabled ? 'bg-safe-bg text-safe-text' : 'bg-warn-bg text-warn-text'}`}>
                                                            {selectedUser.mfaEnabled ? '● Active' : '● Inactive'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-5 pt-4 border-t border-[var(--color-border-subtle)]">
                                                    {/* Security Posture */}
                                                    <div>
                                                        <p className="sec-label mb-2 flex items-center gap-1.5"><ShieldAlert size={10}/> Account Access Control</p>
                                                        <div className="flex flex-col gap-2">
                                                            {selectedUser.accountNonLocked ? (
                                                                <button onClick={() => handleLockUser(selectedUser.id)} className="btn bg-crit-bg text-crit-text border border-crit-solid/20 hover:bg-crit-solid hover:text-white text-[10px] h-9 w-full justify-center">
                                                                    <Lock size={12}/> Terminate All Access (Lock)
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => handleUnlockUser(selectedUser.id)} className="btn bg-safe-bg text-safe-text border border-safe/20 hover:bg-safe hover:text-white text-[10px] h-9 w-full justify-center">
                                                                    <Unlock size={12}/> Restore Account Access
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sessions Management */}
                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="sec-label flex items-center gap-1.5"><Zap size={10}/> Active Sessions</p>
                                                            <span className="text-[10px] font-bold text-signal px-1.5 bg-signal/10 rounded">{selectedUserSessions.length}</span>
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
                                                            {sessionsLoading ? (
                                                                <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-signal/30 border-t-signal rounded-full animate-spin" /></div>
                                                            ) : selectedUserSessions.length > 0 ? (
                                                                selectedUserSessions.map((session, idx) => (
                                                                    <div key={idx} className="p-2 rounded bg-midnight/30 border border-border-subtle/50 text-[9px] flex items-center justify-between group">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <Monitor size={10} className="text-text-muted shrink-0" />
                                                                            <div className="truncate">
                                                                                <p className="text-canvas font-medium truncate">{session.deviceName || 'Unknown Device'}</p>
                                                                                <p className="text-text-muted opacity-70 font-mono tracking-tighter">{session.ipAddress} • {new Date(session.loginTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse shrink-0"></div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-[9px] text-center py-3 text-text-muted italic border border-dashed border-border-subtle rounded">No active web sessions</p>
                                                            )}
                                                        </div>
                                                        
                                                        {selectedUserSessions.length > 0 && (
                                                            <button 
                                                                onClick={() => handleKillAllSessions(selectedUser.id)} 
                                                                className="btn btn-secondary text-[10px] w-full justify-center py-2 text-crit-solid border-crit-solid/20 hover:bg-crit-solid hover:text-white"
                                                            >
                                                                <Zap size={12} className="mr-1.5"/> Kill All Active Sessions
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Roles & Permissions */}
                                                    <div>
                                                        <p className="sec-label mb-2 flex items-center gap-1.5"><Shield size={10}/> Authority Matrix</p>
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {(selectedUser.roles || ['ROLE_USER']).map((r, idx) => (
                                                                <span key={idx} className="badge text-[8px] bg-bg-elevated text-text-muted border border-border-subtle">
                                                                    {r.replace('ROLE_', '')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {!(selectedUser.roles || []).includes('ROLE_ADMIN') ? (
                                                            <button onClick={() => handleAssignAdmin(selectedUser.id)} className="btn btn-secondary text-[10px] w-full justify-center py-2">Elevate to System Admin</button>
                                                        ) : (
                                                            <button onClick={() => handleRemoveAdmin(selectedUser.id)} className="btn btn-secondary text-[10px] w-full justify-center py-2 text-warn border-warn/20 hover:bg-warn-bg">Demote to Standard User</button>
                                                        )}
                                                    </div>

                                                    {/* Location Constraints */}
                                                    <div>
                                                        <p className="sec-label mb-2 flex items-center gap-1.5"><Globe2 size={10}/> Geographic Fencing</p>
                                                        {selectedUser.assignedLocationName ? (
                                                            <div className="p-3 rounded-lg border flex flex-col gap-2 relative group overflow-hidden" style={{ background: 'var(--color-signal-bg)', borderColor: 'var(--color-signal)' }}>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin size={12} style={{ color: 'var(--color-signal)' }} />
                                                                    <span className="text-xs font-bold text-signal">{selectedUser.assignedLocationName}</span>
                                                                </div>
                                                                <button onClick={() => handleRemoveLocation(selectedUser.id)} className="text-[9px] text-crit-solid font-bold uppercase tracking-tighter border border-crit-solid/20 bg-background/50 px-2 py-1 rounded transition-all hover:bg-crit-solid hover:text-white self-start">
                                                                    Clear Zone
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-[9px] text-text-muted italic bg-bg-elevated/50 p-3 rounded-lg border border-border-subtle border-dashed">
                                                                User is utilizing Global Policy (no specialized zone assigned).
                                                            </div>
                                                        )}
                                                        
                                                        <div className="mt-3">
                                                            <select
                                                                className="input-field text-[10px] py-1.5 truncate leading-tight w-full pr-8 appearance-none bg-bg-card"
                                                                defaultValue=""
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        handleAssignLocation(selectedUser.id, e.target.value);
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                            >
                                                                <option value="" disabled>Deploy Specialized Zone...</option>
                                                                {locationConfigs.map(loc => (
                                                                    <option key={loc.id} value={loc.id}>
                                                                        {loc.locationName || `Zone #${loc.id}`} ({loc.radiusKm} km radius)
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* ── Danger Zone ── */}
                                                    <div className="pt-4 mt-2 border-t border-crit-solid/10">
                                                        <p className="sec-label mb-2 flex items-center gap-1.5 text-crit-solid"><Trash2 size={10}/> Danger Zone</p>
                                                        <button 
                                                            onClick={() => handleDeleteUser(selectedUser.id)} 
                                                            className="btn text-[10px] w-full justify-center py-2.5 border border-crit-solid/30 bg-crit-bg text-crit-text hover:bg-crit-solid hover:text-white transition-all font-bold uppercase tracking-wide"
                                                        >
                                                            <Trash2 size={12} className="mr-1.5"/> Permanently Delete User
                                                        </button>
                                                        <p className="text-[8px] text-text-muted mt-2 text-center italic">This action is irreversible. All sessions, roles, and data will be purged.</p>
                                                    </div>

                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'location' && (
                        <motion.div key="location"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <LocationSettings />
                        </motion.div>
                    )}

                    {activeTab === 'risk' && (
                        <motion.div key="risk"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <div className="glass-card overflow-hidden">
                                <div className="p-4 flex flex-col items-stretch gap-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md" style={{ background: 'rgba(55, 138, 221, 0.10)', color: 'var(--color-signal)' }}>
                                                <Activity size={14} />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-canvas block">Global Risk Surveillance</span>
                                                <span className="text-[10px] text-text-muted">Real-time heuristics evaluation across entire fleet</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-info text-[10px]">{filteredRiskData.length} entities tracked</span>
                                            <button onClick={fetchAllRisk} className="p-1.5 hover:bg-white/5 rounded transition-all text-text-muted"><RefreshCw size={12}/></button>
                                        </div>
                                    </div>

                                    {/* Risk Filters */}
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="relative flex-1 w-full">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                            <input
                                                type="text"
                                                placeholder="Search by username..."
                                                value={riskSearchQuery}
                                                onChange={(e) => setRiskSearchQuery(e.target.value)}
                                                className="input-field input-field-with-icon py-1.5 text-xs w-full"
                                            />
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                            <div className="flex items-center gap-1.5 border border-border-subtle rounded px-2 py-1.5 bg-midnight/30 flex-1 sm:flex-initial">
                                                <Filter size={12} className="text-text-muted opacity-70" />
                                                <select 
                                                    value={riskLevelFilter} 
                                                    onChange={(e) => setRiskLevelFilter(e.target.value)}
                                                    className="bg-transparent text-[10px] text-text-muted outline-none cursor-pointer uppercase font-bold tracking-widest w-full"
                                                >
                                                    <option value="ALL">Severity: All</option>
                                                    <option value="CRITICAL">Critical</option>
                                                    <option value="ELEVATED">Elevated</option>
                                                    <option value="SAFE">Safe</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-1.5 border border-border-subtle rounded px-2 py-1.5 bg-midnight/30 flex-1 sm:flex-initial">
                                                <Filter size={12} className="text-text-muted opacity-70" />
                                                <select 
                                                    value={riskStatusFilter} 
                                                    onChange={(e) => setRiskStatusFilter(e.target.value)}
                                                    className="bg-transparent text-[10px] text-text-muted outline-none cursor-pointer uppercase font-bold tracking-widest w-full"
                                                >
                                                    <option value="ALL">Enforcement: All</option>
                                                    <option value="RE_AUTH">RE-AUTH</option>
                                                    <option value="PASSIVE">PASSIVE</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto min-h-[300px]">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-elevated)' }}>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider border-r border-border-subtle/30">Entity ID</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Inertia Score</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Risk Classification</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Concurrent Loads</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Protocol Enforcement</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Detected Factors</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRiskData.map((r, i) => {
                                                const level = getScoreLevel(r.riskScore || 0);
                                                return (
                                                    <tr key={i} className="transition-all hover:bg-white/[0.03] animate-in fade-in slide-in-from-bottom-2 duration-300"
                                                        style={{ borderBottom: '1px solid var(--color-border-subtle)', animationDelay: `${i * 50}ms` }}>
                                                        <td className="py-3 px-4 border-r border-border-subtle/30">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: level.color }}></div>
                                                                <span className="text-xs font-bold text-canvas font-mono tracking-tighter">{r.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-24 h-1.5 rounded-full overflow-hidden"
                                                                    style={{ background: 'var(--color-midnight)' }}>
                                                                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                                                        style={{
                                                                            width: `${Math.min(r.riskScore || 0, 100)}%`,
                                                                            background: level.color,
                                                                            boxShadow: `0 0 10px ${level.color}80`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-bold font-mono min-w-[3ch]" style={{ color: level.color }}>
                                                                    {Math.round(r.riskScore) || 0}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm" style={{ background: level.bg, color: level.text, borderColor: `${level.color}40` }}>
                                                                {level.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-1.5 text-xs text-canvas font-mono">
                                                                <Monitor size={12} className="text-text-muted" />
                                                                {r.activeSessions} / {r.allowedSessions}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${r.mfaRequired ? 'text-crit-solid' : 'text-safe'}`}>
                                                                {r.mfaRequired ? <Zap size={12} className="animate-pulse" /> : <ScanFace size={12} />}
                                                                {r.mfaRequired ? 'RE-AUTH REQUIRED' : 'PASSIVE MONITORING'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(r.riskFactors && r.riskFactors.length > 0) ? r.riskFactors.map((factor, idx) => (
                                                                    <span key={idx} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-text-muted whitespace-nowrap">
                                                                        {factor}
                                                                    </span>
                                                                )) : (
                                                                    <span className="text-[9px] text-text-muted italic opacity-50">Establishing baseline...</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {!loading && allRiskData.length === 0 && (
                                    <div className="p-20 text-center">
                                        <div className="w-12 h-12 bg-signal/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-signal/20">
                                            <ScanFace size={24} className="text-signal opacity-50" />
                                        </div>
                                        <h3 className="text-sm font-bold text-canvas mb-1">Surveillance Offline</h3>
                                        <p className="text-xs text-text-muted max-w-xs mx-auto">Unable to aggregate risk heuristics. Ensure the Risk Evaluator microservice is operational.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'audit' && (
                        <motion.div key="audit"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <div className="glass-card overflow-hidden">
                                <div className="p-4 flex flex-col items-stretch gap-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md" style={{ background: 'rgba(55, 138, 221, 0.10)', color: 'var(--color-signal)' }}>
                                                <ClipboardList size={14} />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-canvas block">System Audit Trail</span>
                                                <span className="text-[10px] text-text-muted">Immutable ledger of security and administrative events</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-info text-[10px]">{auditLogs.length} events found</span>
                                            <button onClick={downloadLogsAsCSV} className="p-1.5 hover:bg-white/5 rounded transition-all text-text-muted" title="Export to CSV">
                                                <Download size={12} />
                                            </button>
                                            <button onClick={fetchAuditLogs} className="p-1.5 hover:bg-white/5 rounded transition-all text-text-muted" title="Refresh">
                                                <RefreshCw size={12} className={auditLoading ? 'animate-spin' : ''}/>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative flex-1 w-full max-w-md">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search by action, user, or description..."
                                            value={auditSearchQuery}
                                            onChange={(e) => setAuditSearchQuery(e.target.value)}
                                            className="input-field input-field-with-icon py-1.5 text-xs w-full"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto min-h-[300px]">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-elevated)' }}>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Timestamp</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Event</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Actor</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Target</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Network Data</th>
                                                <th className="text-left py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Outcome</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLoading ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                                        <td colSpan="6" className="py-2 px-4">
                                                            <AdaptiveSkeleton type="table-row" style={{ background: 'transparent' }} />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : auditLogs.map((log, i) => (
                                                <tr key={log.id} className="transition-all hover:bg-white/[0.03] animate-in fade-in"
                                                    style={{ borderBottom: '1px solid var(--color-border-subtle)', animationDelay: `${i * 30}ms` }}>
                                                    <td className="py-3 px-4 text-[10px] font-mono text-text-muted whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs font-bold text-canvas flex items-center gap-1.5">
                                                                {log.severity === 'WARNING' || log.severity === 'CRITICAL' ? <AlertTriangle size={12} className={log.severity === 'CRITICAL' ? 'text-crit-solid' : 'text-warn'} /> : null}
                                                                {log.action}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted opacity-80">{log.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-[10px] text-canvas font-mono font-bold bg-white/5 rounded px-2">{log.actorUsername}</td>
                                                    <td className="py-3 px-4 text-[10px] text-text-muted font-mono">{log.targetUsername || '-'}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col gap-0.5 max-w-[150px]">
                                                            <span className="text-[10px] font-mono text-canvas truncate">{log.ipAddress || 'Unknown IP'}</span>
                                                            <span className="text-[8px] text-text-muted truncate opacity-70" title={log.deviceInfo}>{log.deviceInfo || 'Unknown Device'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded ${
                                                            log.outcome === 'SUCCESS' ? 'text-safe border-safe/30 bg-safe/10' : 
                                                            log.outcome === 'FAILURE' ? 'text-crit-solid border-crit-solid/30 bg-crit-solid/10' : 'text-warn border-warn/30 bg-warn/10'
                                                        }`}>
                                                            {log.outcome === 'SUCCESS' ? <CheckCircle2 size={10} /> : 
                                                             log.outcome === 'FAILURE' ? <XCircle size={10} /> : <AlertTriangle size={10} />}
                                                            {log.outcome}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {!auditLoading && auditLogs.length === 0 && (
                                        <div className="p-12 text-center text-xs text-text-muted opacity-60">
                                            <ClipboardList size={24} className="mx-auto mb-3 opacity-50" />
                                            No audit logs found matching criteria
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminPanel;
