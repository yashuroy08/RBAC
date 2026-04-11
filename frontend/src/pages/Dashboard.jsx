import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userRiskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import RiskEngine from '../components/RiskEngine';
import { Activity, Monitor, Shield, AlertTriangle, Smartphone, Globe, Clock, Play, RefreshCw, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
    const [riskStatus, setRiskStatus] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [riskEvents, setRiskEvents] = useState([]);
    const location = useLocation();
    const [loginMessage, setLoginMessage] = useState(location.state?.loginMessage || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loginMessage) {
            const timer = setTimeout(() => {
                setLoginMessage(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [loginMessage]);
    const [refreshing, setRefreshing] = useState(false);
    const [simulationMode, setSimulationMode] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboardData = useCallback(async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true);
            const [statusRes, sessionsRes, eventsRes] = await Promise.all([
                userRiskAPI.getRiskStatus(),
                userRiskAPI.getActiveSessions(),
                userRiskAPI.getRiskEvents(5),
            ]);

            if (statusRes.data.success) setRiskStatus(statusRes.data.data);
            if (sessionsRes.data.success) setActiveSessions(sessionsRes.data.data);
            if (eventsRes.data.success) setRiskEvents(eventsRes.data.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            // Poll every 10 seconds so the dashboard auto-detects new logins from other browsers/devices
            const interval = setInterval(() => fetchDashboardData(), 10000);
            return () => clearInterval(interval);
        }
    }, [user, fetchDashboardData]);

    // Derived state for simulation
    const displayStatus = simulationMode ? {
        ...riskStatus,
        activeSessions: (riskStatus?.activeSessions || 0) + 1,
        riskScore: (((riskStatus?.activeSessions || 0) + 1) / (riskStatus?.allowedSessions || 1)) * 100,
        riskLevel: 'CRITICAL'
    } : riskStatus;

    const toggleSimulation = () => {
        setSimulationMode(!simulationMode);
    };


    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'LOW': return 'success';
            case 'MEDIUM': return 'warning';
            case 'HIGH': return 'danger';
            case 'CRITICAL': return 'danger';
            default: return 'info';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                    <div className="absolute inset-0 rounded-full border-r-2 border-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-light-text pb-12 font-sans selection:bg-primary/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Security Message Banner */}
                    {loginMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`p-4 rounded-xl flex items-start gap-3 text-sm ${loginMessage.includes('Warning') ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-success/10 border border-success/20 text-success'}`}
                        >
                            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                            <div className="flex flex-col flex-1">
                                <span className="font-semibold text-base mb-1">
                                    {loginMessage.includes('Warning') ? 'Security Notice' : 'Login Status'}
                                </span>
                                <span>{loginMessage}</span>
                            </div>
                            <button
                                onClick={() => setLoginMessage(null)}
                                className="text-current opacity-50 hover:opacity-100 transition-opacity"
                            >
                                &times;
                            </button>
                        </motion.div>
                    )}

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6"
                    >
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-light-text mb-2">Dashboard Overview</h1>
                            <p className="text-dark-text-muted">Real-time security monitoring and risk assessment</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {lastUpdated && (
                                <span className="text-xs font-mono text-dark-text-muted bg-dark-bg/60 px-3 py-1.5 rounded-full border border-dark-border">
                                    SYS_TIME: {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                                <button
                                    className={`p-2 rounded-xl border border-dark-border bg-dark-bg hover:bg-dark-border transition-all text-dark-text-muted hover:text-light-text active:scale-95 cursor-pointer ${refreshing ? 'animate-spin text-primary' : ''}`}
                                    onClick={() => fetchDashboardData(true)}
                                    title="Manually refresh dashboard data"
                                >
                                <RefreshCw size={20} />
                            </button>
                            <button
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all active:scale-95 border cursor-pointer ${simulationMode ? 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}
                                onClick={toggleSimulation}
                                title="Simulate a new login attempt"
                            >
                                {simulationMode ? <StopCircle size={18} /> : <Play size={18} />} 
                                {simulationMode ? 'Stop Simulation' : 'Risk Simulator'}
                            </button>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm tracking-wide ${displayStatus?.thresholdExceeded ? 'bg-danger/20 border-danger/50 text-danger shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-success/20 border-success/50 text-success shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`}>
                                <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${displayStatus?.thresholdExceeded ? 'bg-danger animate-pulse' : 'bg-success'}`}></div>
                                <span>{displayStatus?.thresholdExceeded ? 'RISK DETECTED' : 'SYSTEM SECURE'}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <motion.div variants={itemVariants} className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                    <Activity size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-dark-text-muted mb-1">Risk Score</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold font-mono text-light-text">{displayStatus?.riskScore?.toFixed(1)}%</div>
                                        <span className={`badge badge-${getRiskColor(displayStatus?.riskLevel)}`}>
                                            {displayStatus?.riskLevel || 'UNKNOWN'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-info/20 text-info flex items-center justify-center ring-1 ring-info/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                    <Monitor size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-dark-text-muted mb-1">Active Sessions</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold font-mono text-light-text">{displayStatus?.activeSessions || 0}</div>
                                        <span className="text-xs font-medium text-dark-text-muted bg-dark-bg/50 px-2 py-1 rounded border border-dark-border">
                                            / {displayStatus?.allowedSessions} Max
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-warning/20 text-warning flex items-center justify-center ring-1 ring-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-dark-text-muted mb-1">Risk Events</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold font-mono text-light-text">{riskEvents.length}</div>
                                        <span className="text-xs font-medium text-dark-text-muted">ALL_TIME</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-success/20 text-success flex items-center justify-center ring-1 ring-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                    <Shield size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-dark-text-muted mb-1">Security Status</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xl font-bold text-light-text">{displayStatus?.thresholdExceeded ? 'At Risk' : 'Healthy'}</div>
                                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">AUTO</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Risk Engine Visualization */}
                    <RiskEngine status={displayStatus} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        {/* Active Sessions Table */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card flex flex-col h-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-info/10 text-info rounded-lg">
                                        <Smartphone size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-light-text m-0">Active Sessions</h2>
                                </div>
                                <span className="badge badge-info shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-info/30">{activeSessions.length} Active</span>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className="border-b border-dark-border text-xs uppercase tracking-wider text-dark-text-muted">
                                            <th className="pb-3 font-semibold px-2">Device ID</th>
                                            <th className="pb-3 font-semibold px-2">IP Address</th>
                                            <th className="pb-3 font-semibold px-2">Login Time</th>
                                            <th className="pb-3 font-semibold px-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-medium align-middle">
                                        {activeSessions.length > 0 ? activeSessions.map((session) => (
                                            <tr key={session.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50 transition-colors">
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-2">
                                                        <Monitor size={16} className="text-dark-text-muted" />
                                                        <span className="font-mono text-light-text" title={session.deviceId}>
                                                            {session.deviceId?.substring(0, 12)}...
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-2 text-dark-text-muted">
                                                        <Globe size={16} />
                                                        {session.ipAddress}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-2 text-dark-text-muted">
                                                        <Clock size={16} />
                                                        {new Date(session.loginTime).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                                                        Active
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="py-12 text-center text-dark-text-muted">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Smartphone size={32} className="opacity-50" />
                                                        <p>No active sessions found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        {/* Recent Activity Feed */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-card flex flex-col h-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Activity size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-light-text m-0">Recent Activity</h2>
                                </div>
                            </div>

                            <div className="relative pl-6 py-2 flex-1">
                                {riskEvents.length > 0 ? (
                                    riskEvents.map((event, index) => (
                                        <div key={event.id || index} className="relative pb-8 last:pb-0">
                                            {/* Line */}
                                            {index !== riskEvents.length - 1 && (
                                                <div className="absolute left-[-21px] top-6 bottom-[-8px] w-px bg-dark-border"></div>
                                            )}
                                            
                                            {/* Dot */}
                                            <div className={`absolute left-[-26px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-dark-bg ${event.riskScore > 50 ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`}></div>

                                            <div className="bg-[#111111] border border-border-subtle rounded-xl p-4 hover:bg-[#151515] hover:border-border-glow transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-light-text leading-tight pr-4">{event.description}</span>
                                                    <span className="text-xs text-dark-text-muted whitespace-nowrap font-mono">{new Date(event.eventTime).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${event.riskScore > 50 ? 'bg-danger/10 text-danger border-danger/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                                                        Risk: {event.riskScore.toFixed(0)}%
                                                    </span>
                                                    <span className="text-xs font-medium text-dark-text-muted bg-dark-bg/80 px-2 py-0.5 rounded-md border border-dark-border">
                                                        {event.actionTaken}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-dark-text-muted">
                                        <Shield size={48} className="opacity-20 mb-4" />
                                        <p>No high-risk events detected</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
