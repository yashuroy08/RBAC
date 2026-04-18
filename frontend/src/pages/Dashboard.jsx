import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, userRiskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import RiskEngine from '../components/RiskEngine';
import AdaptiveSkeleton from '../components/AdaptiveSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
    Shield, Activity, Laptop, Clock, MapPin, Globe,
    CheckCircle, XCircle, Monitor, Smartphone,
    Trash2, ChevronDown, ChevronUp, Lock, Unlock,
    AlertTriangle, Info, Play, StopCircle, ShieldAlert
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [riskMetrics, setRiskMetrics] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [trustedDevices, setTrustedDevices] = useState([]);
    const [riskEvents, setRiskEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(location.state?.loginMessage || '');
    const [simulationMode, setSimulationMode] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        events: true, sessions: true, devices: true
    });

    useEffect(() => {
        fetchDashboardData();
        // Periodic refresh
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchDashboardData = async () => {
        try {
            const [riskRes, sessionsRes, eventsRes, devicesRes] = await Promise.all([
                userRiskAPI.getRiskStatus(),
                userRiskAPI.getActiveSessions(),
                userRiskAPI.getRiskEvents(5),
                authAPI.getTrustedDevices(),
            ]);

            setRiskMetrics(riskRes.data?.data || null);
            setSessions(sessionsRes.data?.data || []);
            setRiskEvents(eventsRes.data?.data || []);
            setTrustedDevices(devicesRes.data?.data || []);
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeDevice = async (deviceId) => {
        if (!window.confirm('Revoke trusted status for this device? They will need to re-verify via MFA.')) return;
        try {
            await authAPI.revokeTrustedDevice(deviceId);
            setNotification('Device revoked successfully');
            fetchDashboardData();
        } catch (error) {
            setNotification('Failed to revoke device');
        }
    };

    const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleSimulation = () => setSimulationMode(!simulationMode);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getDeviceIcon = (deviceName) => {
        const name = (deviceName || '').toLowerCase();
        if (name.includes('mobile') || name.includes('phone') || name.includes('android') || name.includes('iphone'))
            return <Smartphone size={14} />;
        return <Monitor size={14} />;
    };

    // Summary calculations
    const activeSessions = sessions.filter(s => s.active).length;
    const trustedCount = trustedDevices.length;
    
    // Simulation Logic
    const displayRiskMetrics = simulationMode ? {
        ...riskMetrics,
        riskScore: Math.min(100, (riskMetrics?.riskScore || 0) + 40),
        requiresMfa: true,
        factors: [
            ...(riskMetrics?.factors || []),
            { description: 'Simulated Threat Detected', score: 40 }
        ]
    } : riskMetrics;

    const riskScore = displayRiskMetrics?.riskScore ?? 0;
    const getScoreColor = (s) => s >= 70 ? 'var(--color-crit-solid)' : s >= 40 ? 'var(--color-warn)' : 'var(--color-safe)';

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
                            className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold"
                            style={{ background: 'var(--color-safe-bg)', color: 'var(--color-safe-text)' }}
                        >
                            <CheckCircle size={14} />
                            {notification}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Header Bar ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-canvas flex items-center gap-2">
                            <Shield size={18} style={{ color: 'var(--color-signal)' }} />
                            Security Dashboard
                        </h1>
                        <p className="text-xs text-text-muted mt-1">
                            Welcome, <span className="text-canvas font-semibold">{user?.username}</span> ·
                            Role: <span className="badge badge-info ml-1">{user?.role}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <button 
                            onClick={toggleSimulation}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors tracking-widest ${simulationMode ? 'bg-crit-solid text-white shadow-[0_0_10px_rgba(226,75,74,0.4)]' : 'bg-bg-elevated text-text-muted hover:text-white'}`}
                        >
                            {simulationMode ? <StopCircle size={12} /> : <Play size={12} />}
                            {simulationMode ? 'Stop Simulation' : 'Simulate Threat'}
                        </button>
                        <div className="flex gap-1.5 text-[10px] text-text-muted items-center">
                            <span className="status-dot status-dot-safe" />
                            Refreshes every 30s
                        </div>
                    </div>
                </div>

                {/* Simulation Mode Banner */}
                <AnimatePresence>
                    {simulationMode && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold border shadow-md"
                                style={{ background: 'var(--color-crit-bg)', color: 'var(--color-crit-text)', borderColor: 'var(--color-crit-solid)' }}>
                                <ShieldAlert size={14} />
                                Simulation Mode Active: Risk score has been artificially elevated to trigger adaptive MFA policies.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {loading ? (
                        <>
                            <AdaptiveSkeleton type="card" className="h-28" />
                            <AdaptiveSkeleton type="card" className="h-28" />
                            <AdaptiveSkeleton type="card" className="h-28" />
                        </>
                    ) : (
                        <>
                            <StatCard
                                icon={<Activity size={16} />}
                                label="Risk Score"
                                value={riskScore}
                                valueSuffix="/100"
                                valueColor={getScoreColor(riskScore)}
                                footnote={displayRiskMetrics?.requiresMfa ? 'MFA Required' : 'MFA Not Required'}
                                footnoteColor={displayRiskMetrics?.requiresMfa ? 'var(--color-crit-solid)' : 'var(--color-safe)'}
                            />
                            <StatCard
                                icon={<Laptop size={16} />}
                                label="Active Sessions"
                                value={activeSessions}
                                valueColor="var(--color-signal)"
                                footnote={`across ${activeSessions} device(s)`}
                            />
                            <StatCard
                                icon={<Lock size={16} />}
                                label="Trusted Devices"
                                value={trustedCount}
                                valueColor="var(--color-verified)"
                                footnote={trustedCount > 0 ? 'bypass MFA on login' : 'no devices trusted'}
                            />
                        </>
                    )}
                </div>

                {/* ── Main Content Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 border-transparent">
                    {/* Left: Risk Engine & Recent Events */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <RiskEngine riskMetrics={displayRiskMetrics} />
                        
                        {/* Recent Risk Events */}
                        <CollapsibleSection
                            title="Recent Events"
                            icon={<Activity size={14} />}
                            count={riskEvents?.length || 0}
                            expanded={expandedSections.events}
                            onToggle={() => toggleSection('events')}
                        >
                            {loading ? (
                                <div className="space-y-2">
                                    <AdaptiveSkeleton type="list" />
                                    <AdaptiveSkeleton type="list" />
                                    <AdaptiveSkeleton type="list" />
                                </div>
                            ) : !riskEvents || riskEvents.length === 0 ? (
                                <EmptyState text="No high-risk events detected" />
                            ) : (
                                <div className="space-y-2">
                                    {riskEvents.map((event, i) => (
                                        <div key={event.id || i}
                                            className="flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors border-l-2"
                                            style={{ 
                                                background: 'var(--color-bg-elevated)',
                                                borderColor: event.riskScore >= 70 ? 'var(--color-crit-solid)' : (event.riskScore >= 40 ? 'var(--color-warn)' : 'var(--color-safe)')
                                            }}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-canvas truncate" title={event.description}>
                                                        {event.description || 'Unknown Event'}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted font-mono whitespace-nowrap ml-2">
                                                        {new Date(event.eventTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[10px] text-text-muted uppercase tracking-widest font-semibold mt-1.5">
                                                    <span style={{ color: getScoreColor(event.riskScore) }}>Risk: {Math.round(event.riskScore)}%</span>
                                                    <span style={{ background: 'var(--color-midnight)', padding: '2px 5px', borderRadius: '4px', letterSpacing: '0.05em' }}>{event.actionTaken}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CollapsibleSection>
                    </div>

                    {/* Right: Sessions & Devices */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        {/* Active Sessions */}
                        <CollapsibleSection
                            title="Active Sessions"
                            icon={<Monitor size={14} />}
                            count={activeSessions}
                            expanded={expandedSections.sessions}
                            onToggle={() => toggleSection('sessions')}
                        >
                            {loading ? (
                                <div className="space-y-2">
                                    <AdaptiveSkeleton type="list" />
                                    <AdaptiveSkeleton type="list" />
                                </div>
                            ) : !sessions || sessions.length === 0 ? (
                                <EmptyState text="No active sessions found (including this one)" />
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session, i) => (
                                        <div key={session.sessionId || i}
                                            className="flex items-start gap-3 py-3 px-3.5 rounded-lg transition-colors"
                                            style={{ background: 'var(--color-bg-elevated)' }}>
                                            <div className="mt-1 p-1.5 rounded-md shrink-0"
                                                style={{ background: 'rgba(55, 138, 221, 0.10)', color: 'var(--color-signal)' }}>
                                                {getDeviceIcon(session.deviceName)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-canvas truncate">
                                                        {session.deviceName || session.userAgent || 'Unknown Device'}
                                                    </span>
                                                    {session.currentSession && (
                                                        <span className="badge badge-success text-[9px]">CURRENT</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
                                                    <span className="flex items-center gap-1"><Globe size={10} /> {session.ipAddress || '—'}</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(session.loginTime)}</span>
                                                </div>
                                            </div>
                                            <SessionStatusBadge active={session.active} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CollapsibleSection>

                        {/* Trusted Devices */}
                        <CollapsibleSection
                            title="Trusted Devices"
                            icon={<Lock size={14} />}
                            count={trustedCount}
                            expanded={expandedSections.devices}
                            onToggle={() => toggleSection('devices')}
                        >
                            {loading ? (
                                <div className="space-y-2">
                                    <AdaptiveSkeleton type="list" />
                                    <AdaptiveSkeleton type="list" />
                                </div>
                            ) : !trustedDevices || trustedDevices.length === 0 ? (
                                <div className="p-8 text-center text-xs text-text-muted border border-border-subtle rounded-lg">
                                    <ShieldAlert size={24} className="mx-auto mb-2 opacity-50" />
                                    No trusted devices configured
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {trustedDevices.map((device, i) => (
                                        <div key={device.id || i}
                                            className="flex items-start gap-3 py-3 px-3.5 rounded-lg transition-colors"
                                            style={{ background: 'var(--color-bg-elevated)' }}>
                                            <div className="mt-1 p-1.5 rounded-md shrink-0"
                                                style={{ background: 'rgba(83, 74, 183, 0.12)', color: 'var(--color-verified)' }}>
                                                {getDeviceIcon(device.deviceName)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-canvas truncate">
                                                        {device.deviceName || 'Unknown Device'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <Info size={10} /> {device.deviceFingerprint?.substring(0, 12)}...
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        Trusted: {formatDate(device.createdAt)}
                                                    </span>
                                                    {device.expiresAt && (
                                                        <span className="flex items-center gap-1">
                                                            <AlertTriangle size={10} />
                                                            Exp: {formatDate(device.expiresAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeDevice(device.id)}
                                                className="p-1.5 rounded-md text-text-muted hover:text-crit-solid transition-all shrink-0"
                                                style={{ background: 'transparent' }}
                                                title="Revoke Trust"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CollapsibleSection>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Sub-components ── */

const StatCard = ({ icon, label, value, valueSuffix, valueColor, footnote, footnoteColor }) => (
    <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ background: 'rgba(55, 138, 221, 0.10)', color: 'var(--color-signal)' }}>
                {icon}
            </div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-mono" style={{ color: valueColor }}>{value}</span>
            {valueSuffix && <span className="text-xs text-text-muted font-medium">{valueSuffix}</span>}
        </div>
        {footnote && (
            <span className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: footnoteColor || 'var(--color-text-muted)' }}>
                {footnote}
            </span>
        )}
    </div>
);

const CollapsibleSection = ({ title, icon, count, expanded, onToggle, children }) => (
    <div className="glass-card overflow-hidden">
        <button onClick={onToggle}
            className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
                <span style={{ color: 'var(--color-signal)' }}>{icon}</span>
                <span className="text-sm font-bold text-canvas">{title}</span>
                <span className="badge badge-info text-[9px] ml-1">{count}</span>
            </div>
            {expanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
        </button>
        <AnimatePresence>
            {expanded && (
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                        <div className="pt-3">{children}</div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const SessionStatusBadge = ({ active }) => (
    <span className="badge text-[9px]" style={{
        background: active ? 'var(--color-safe-bg)' : 'rgba(136, 135, 128, 0.12)',
        color: active ? 'var(--color-safe-text)' : 'var(--color-text-muted)',
    }}>
        {active ? <><span className="status-dot status-dot-safe mr-1" /> ACTIVE</> : 'CLOSED'}
    </span>
);

const EmptyState = ({ text }) => (
    <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-text-muted">
        <Info size={20} className="opacity-40" />
        <span>{text}</span>
    </div>
);

export default Dashboard;
