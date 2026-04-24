import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI, userRiskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import RiskEngine from '../components/RiskEngine';
import { RiskTimeline, SessionActivityChart, RiskFactorsBreakdown, SecurityPosture } from '../components/DashboardCharts';
import AdaptiveSkeleton from '../components/AdaptiveSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Shield, Activity, Laptop, Clock, MapPin, Globe,
    CheckCircle, XCircle, Monitor, Smartphone,
    Trash2, ChevronDown, ChevronUp, Lock, Unlock,
    AlertTriangle, Info, Play, StopCircle, ShieldAlert,
    Bell, Radio, RefreshCw, Zap, TrendingUp, Eye
} from 'lucide-react';

/* ──────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────── */
const POLL_INTERVAL = 15000; // 15s for more real-time feel
const EVENT_LIMIT = 20;      // Fetch more events for charting

const Dashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    /* ── State ── */
    const [riskMetrics, setRiskMetrics] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [trustedDevices, setTrustedDevices] = useState([]);
    const [riskEvents, setRiskEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [simulationMode, setSimulationMode] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        events: true, sessions: true, devices: true
    });

    // Real-time state
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [riskHistory, setRiskHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [timeRange, setTimeRange] = useState('hours');
    const prevRiskScore = useRef(null);

    /* ── Boot ── */
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, POLL_INTERVAL);

        if (location.state?.loginMessage) {
            toast.success(location.state.loginMessage);
            navigate(location.pathname, { replace: true, state: {} });
        }

        return () => clearInterval(interval);
    }, []);

    /* ── Data Fetching ── */
    const fetchDashboardData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [riskRes, sessionsRes, eventsRes, devicesRes] = await Promise.all([
                userRiskAPI.getRiskStatus(),
                userRiskAPI.getActiveSessions(),
                userRiskAPI.getRiskEvents(EVENT_LIMIT),
                authAPI.getTrustedDevices(),
            ]);

            const newRisk = riskRes.data?.data || null;
            const newSessions = sessionsRes.data?.data || [];
            const newEvents = eventsRes.data?.data || [];
            const newDevices = devicesRes.data?.data || [];

            // Detect risk score changes and generate notifications
            if (newRisk && prevRiskScore.current !== null) {
                const oldScore = prevRiskScore.current;
                const newScore = newRisk.riskScore ?? 0;

                if (newScore > oldScore + 5) {
                    const notif = {
                        id: Date.now(),
                        type: 'warning',
                        message: `Risk score increased from ${oldScore} to ${newScore}`,
                        time: new Date(),
                    };
                    setNotifications(prev => [notif, ...prev].slice(0, 20));
                    toast(`⚠️ Risk score elevated to ${newScore}`, { icon: '🔺' });
                } else if (newScore < oldScore - 5) {
                    const notif = {
                        id: Date.now(),
                        type: 'safe',
                        message: `Risk score decreased from ${oldScore} to ${newScore}`,
                        time: new Date(),
                    };
                    setNotifications(prev => [notif, ...prev].slice(0, 20));
                }

                // Detect new sessions
                if (newSessions.length > sessions.length && sessions.length > 0) {
                    const notif = {
                        id: Date.now() + 1,
                        type: 'info',
                        message: `New session detected from ${newSessions[0]?.deviceName || 'unknown device'}`,
                        time: new Date(),
                    };
                    setNotifications(prev => [notif, ...prev].slice(0, 20));
                    toast.success('New session detected');
                }
            }

            if (newRisk) prevRiskScore.current = newRisk.riskScore ?? 0;

            // Update risk history for timeline chart
            setRiskHistory(prev => {
                const point = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    score: newRisk?.riskScore ?? 0,
                    threshold: 70,
                };
                const updated = [...prev, point].slice(-24); // Keep last 24 data points
                return updated;
            });

            setRiskMetrics(newRisk);
            setSessions(newSessions);
            setRiskEvents(newEvents);
            setTrustedDevices(newDevices);
            setLastRefresh(Date.now());
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [sessions.length]);

    /* ── Actions ── */
    const handleRevokeDevice = async (deviceId) => {
        if (!window.confirm('Revoke trusted status for this device? They will need to re-verify via MFA.')) return;
        try {
            await authAPI.revokeTrustedDevice(deviceId);
            toast.success('Device revoked successfully');
            fetchDashboardData();
        } catch (error) {
            toast.error('Failed to revoke device');
        }
    };

    const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleSimulation = () => {
        const nextMode = !simulationMode;
        setSimulationMode(nextMode);
        if (nextMode) {
            toast('🔴 Threat simulation activated', { duration: 3000 });
            setNotifications(prev => [{
                id: Date.now(),
                type: 'critical',
                message: 'Threat simulation mode activated — risk score artificially elevated',
                time: new Date(),
            }, ...prev].slice(0, 20));
        } else {
            toast.success('Simulation deactivated');
        }
    };

    /* ── Helpers ── */
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    };

    const getDeviceIcon = (deviceName) => {
        const name = (deviceName || '').toLowerCase();
        if (name.includes('mobile') || name.includes('phone') || name.includes('android') || name.includes('iphone'))
            return <Smartphone size={14} />;
        return <Monitor size={14} />;
    };

    const timeSince = (ms) => {
        const secs = Math.floor((Date.now() - ms) / 1000);
        if (secs < 5) return 'just now';
        if (secs < 60) return `${secs}s ago`;
        return `${Math.floor(secs / 60)}m ago`;
    };

    /* ── Derived ── */
    const activeSessions = sessions.filter(s => s.active).length;
    const trustedCount = trustedDevices.length;
    const recentEventCount = riskEvents.length;
    const unreadNotifs = notifications.filter(n => !n.read).length;

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

    /* ════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════ */
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-deep)' }}>
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
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
                        {/* Notification bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifPanel(!showNotifPanel)}
                                className="p-2 rounded-md transition-colors hover:bg-white/[0.06] relative"
                                style={{ color: unreadNotifs > 0 ? 'var(--color-signal)' : 'var(--color-text-muted)' }}
                            >
                                <Bell size={16} />
                                {unreadNotifs > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                                        style={{ background: 'var(--color-crit-solid)' }}>
                                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                                    </span>
                                )}
                            </button>

                            {/* Notification dropdown */}
                            <AnimatePresence>
                                {showNotifPanel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        className="absolute right-0 top-10 w-80 z-50 glass-card overflow-hidden shadow-2xl"
                                    >
                                        <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                            <span className="text-xs font-bold text-canvas uppercase tracking-wider">Notifications</span>
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                                    }}
                                                    className="text-[10px] text-signal font-semibold hover:underline"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-xs text-text-muted">
                                                    <Bell size={20} className="mx-auto mb-2 opacity-30" />
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div key={notif.id}
                                                        className="px-3 py-2.5 transition-colors hover:bg-white/[0.03] flex items-start gap-2.5"
                                                        style={{ borderBottom: '1px solid var(--color-border-subtle)', opacity: notif.read ? 0.6 : 1 }}
                                                    >
                                                        <div className="mt-0.5 shrink-0">
                                                            {notif.type === 'critical' && <ShieldAlert size={12} style={{ color: 'var(--color-crit-solid)' }} />}
                                                            {notif.type === 'warning' && <AlertTriangle size={12} style={{ color: 'var(--color-warn)' }} />}
                                                            {notif.type === 'safe' && <CheckCircle size={12} style={{ color: 'var(--color-safe)' }} />}
                                                            {notif.type === 'info' && <Info size={12} style={{ color: 'var(--color-signal)' }} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] text-canvas leading-snug">{notif.message}</p>
                                                            <p className="text-[9px] text-text-muted mt-0.5 font-mono">
                                                                {notif.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Simulate button */}
                        <button
                            onClick={toggleSimulation}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors tracking-widest ${simulationMode ? 'bg-crit-solid text-white shadow-[0_0_10px_rgba(226,75,74,0.4)]' : 'bg-bg-elevated text-text-muted hover:text-white'}`}
                        >
                            {simulationMode ? <StopCircle size={12} /> : <Play size={12} />}
                            {simulationMode ? 'Stop Simulation' : 'Simulate Threat'}
                        </button>

                        {/* Time Range Selector */}
                        <div className="flex bg-bg-elevated p-1 rounded-lg border border-border-subtle">
                            {[
                                { label: 'Hours', val: 'hours' },
                                { label: 'Days', val: 'days' },
                                { label: 'Weeks', val: 'weeks' },
                                { label: 'Months', val: 'months' }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => setTimeRange(opt.val)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${
                                        timeRange === opt.val 
                                            ? 'bg-signal text-white shadow-lg' 
                                            : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Live indicator */}
                        <div className="flex gap-1.5 text-[10px] text-text-muted items-center ml-2 border-l border-border-subtle pl-4">
                            <motion.div
                                animate={{ opacity: isRefreshing ? [1, 0.3, 1] : 1 }}
                                transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0 }}
                            >
                                <Radio size={10} style={{ color: 'var(--color-safe)' }} />
                            </motion.div>
                            <span>Live · {timeSince(lastRefresh)}</span>
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

                {/* ── Stat Cards (4 columns) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <>
                            <AdaptiveSkeleton type="card" className="h-28" />
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
                                trend={riskHistory.length >= 2 ? (riskHistory[riskHistory.length - 1].score - riskHistory[riskHistory.length - 2].score) : 0}
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
                            <StatCard
                                icon={<Zap size={16} />}
                                label="Security Events"
                                value={recentEventCount}
                                valueColor="var(--color-warn)"
                                footnote={`last ${EVENT_LIMIT} captured`}
                            />
                        </>
                    )}
                </div>

                {/* ── Charts Row ── */}
                {!loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RiskTimeline
                            riskEvents={riskEvents}
                            riskHistory={riskHistory}
                            currentScore={riskScore}
                            timeRange={timeRange}
                        />
                        <SessionActivityChart 
                            sessions={sessions} 
                            timeRange={timeRange}
                        />
                    </div>
                )}

                {/* ── Main Content Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Risk Engine + Security Posture + Risk Factors */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <RiskEngine riskMetrics={displayRiskMetrics} />
                        <SecurityPosture
                            riskScore={riskScore}
                            activeSessions={activeSessions}
                            trustedDevices={trustedCount}
                            mfaRequired={displayRiskMetrics?.requiresMfa}
                        />
                        <RiskFactorsBreakdown factors={displayRiskMetrics?.factors} />
                    </div>

                    {/* Center Column: Live Activity Feed */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <LiveActivityFeed
                            events={riskEvents}
                            getScoreColor={getScoreColor}
                            formatDate={formatDate}
                        />
                    </div>

                    {/* Right Column: Sessions + Devices */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
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
                                <EmptyState text="No active sessions found" />
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map((session, i) => (
                                        <div key={session.sessionId || i}
                                            className="flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors"
                                            style={{ background: 'var(--color-bg-elevated)' }}>
                                            <div className="mt-0.5 p-1.5 rounded-md shrink-0"
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
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
                                                    <span className="flex items-center gap-1"><Globe size={9} /> {session.ipAddress || '—'}</span>
                                                    <span className="flex items-center gap-1"><MapPin size={9} /> {session.location || 'Unknown'}</span>
                                                    <span className="flex items-center gap-1"><Clock size={9} /> {formatDate(session.loginTime)}</span>
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
                                <div className="p-6 text-center text-xs text-text-muted border border-border-subtle rounded-lg">
                                    <ShieldAlert size={24} className="mx-auto mb-2 opacity-50" />
                                    No trusted devices configured
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {trustedDevices.map((device, i) => (
                                        <div key={device.id || i}
                                            className="flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors"
                                            style={{ background: 'var(--color-bg-elevated)' }}>
                                            <div className="mt-0.5 p-1.5 rounded-md shrink-0"
                                                style={{ background: 'rgba(83, 74, 183, 0.12)', color: 'var(--color-verified)' }}>
                                                {getDeviceIcon(device.deviceName)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold text-canvas truncate block">
                                                    {device.deviceName || 'Unknown Device'}
                                                </span>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Globe size={9} /> {device.ipAddress || '—'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={9} /> {device.location || 'Unknown'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={9} /> {formatDate(device.lastLoginTime)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeDevice(device.id)}
                                                className="p-1.5 rounded-md text-text-muted hover:text-crit-solid transition-all shrink-0"
                                                title="Revoke Trust"
                                            >
                                                <Trash2 size={13} />
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

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════ */

const StatCard = ({ icon, label, value, valueSuffix, valueColor, footnote, footnoteColor, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-signal/20"
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md" style={{ background: 'rgba(55, 138, 221, 0.10)', color: 'var(--color-signal)' }}>
                    {icon}
                </div>
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            {trend !== undefined && trend !== 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: trend > 0 ? 'var(--color-crit-solid)' : 'var(--color-safe)' }}>
                    <TrendingUp size={10} style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} />
                    {Math.abs(trend)}
                </span>
            )}
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
    </motion.div>
);

/* ── Live Activity Feed ── */
const LiveActivityFeed = ({ events = [], getScoreColor, formatDate }) => {
    const getEventIcon = (event) => {
        const score = event.riskScore || 0;
        if (score >= 70) return <ShieldAlert size={12} style={{ color: 'var(--color-crit-solid)' }} />;
        if (score >= 40) return <AlertTriangle size={12} style={{ color: 'var(--color-warn)' }} />;
        return <Activity size={12} style={{ color: 'var(--color-safe)' }} />;
    };

    return (
        <div className="glass-card overflow-hidden h-full flex flex-col">
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                    <span style={{ color: 'var(--color-signal)' }}><Eye size={14} /></span>
                    <span className="text-sm font-bold text-canvas uppercase tracking-wide">Live Activity</span>
                    <span className="badge badge-info text-[9px]">{events.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--color-safe)' }}
                    />
                    <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2" style={{ maxHeight: 500 }}>
                {!events || events.length === 0 ? (
                    <div className="py-10 flex flex-col items-center text-xs text-text-muted">
                        <Activity size={24} className="opacity-30 mb-2" />
                        No security events recorded
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-3 bottom-3 w-px" style={{ background: 'var(--color-border-subtle)' }} />

                        <div className="space-y-1">
                            {events.map((event, i) => (
                                <motion.div
                                    key={event.id || i}
                                    initial={i === 0 ? { opacity: 0, x: -10 } : false}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-start gap-3 py-2 pl-0 relative group"
                                >
                                    {/* Timeline dot */}
                                    <div className="relative z-10 mt-1 shrink-0">
                                        <div className="w-[15px] h-[15px] rounded-full flex items-center justify-center"
                                            style={{
                                                background: 'var(--color-bg-card)',
                                                border: `2px solid ${getScoreColor(event.riskScore)}`,
                                            }}>
                                            <div className="w-[5px] h-[5px] rounded-full"
                                                style={{ background: getScoreColor(event.riskScore) }} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 py-1 px-2.5 rounded-md transition-colors group-hover:bg-white/[0.02]">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-bold text-canvas truncate pr-2" title={event.description}>
                                                {event.description || 'Unknown Event'}
                                            </span>
                                            <span className="text-[9px] text-text-muted font-mono whitespace-nowrap">
                                                {event.eventTime
                                                    ? new Date(event.eventTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-[9px] text-text-muted uppercase tracking-widest font-semibold">
                                            <span className="font-mono" style={{ color: getScoreColor(event.riskScore) }}>
                                                {Math.round(event.riskScore)}%
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded"
                                                style={{ background: 'var(--color-midnight)' }}>
                                                {event.actionTaken || 'LOGGED'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CollapsibleSection = ({ title, icon, count, expanded, onToggle, children }) => (
    <div className="glass-card overflow-hidden">
        <button onClick={onToggle}
            className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-2.5">
                <span style={{ color: 'var(--color-signal)' }}>{icon}</span>
                <span className="text-sm font-bold text-canvas uppercase tracking-wide">{title}</span>
                <span className="badge badge-info text-[9px] ml-1">{count}</span>
            </div>
            {expanded ? <ChevronUp size={14} className="text-signal" /> : <ChevronDown size={14} className="text-text-muted" />}
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
