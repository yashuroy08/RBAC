import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userRiskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import RiskEngine from '../components/RiskEngine';
import { FiActivity, FiMonitor, FiShield, FiAlertTriangle, FiSmartphone, FiGlobe, FiClock, FiPlay, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [riskStatus, setRiskStatus] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [riskEvents, setRiskEvents] = useState([]);
    const [loading, setLoading] = useState(true);
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
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    return (

        <div className="dashboard-layout">
            <Navbar />

            <main className="dashboard-content">
                <div className="content-wrapper">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="dashboard-header"
                    >
                        <div>
                            <h1>Dashboard Overview</h1>
                            <p>Real-time security monitoring and risk assessment</p>
                        </div>

                        <div className="header-actions-group">
                            {lastUpdated && (
                                <span className="last-updated">
                                    Updated {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                            <button
                                className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
                                onClick={() => fetchDashboardData(true)}
                                title="Manually refresh dashboard data"
                            >
                                <FiRefreshCw />
                            </button>
                            <button
                                className={`btn-simulate ${simulationMode ? 'active' : ''}`}
                                onClick={toggleSimulation}
                                title="Simulate a new login attempt to see Risk Engine in action"
                            >
                                <FiPlay /> {simulationMode ? 'Stop Simulation' : 'Risk Simulator'}
                            </button>
                            <div className={`status-pill ${displayStatus?.thresholdExceeded ? 'danger' : 'success'}`}>
                                <div className="status-dot"></div>
                                <span>{displayStatus?.thresholdExceeded ? 'Risk Detected' : 'System Secure'}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="stats-grid"
                    >
                        <motion.div variants={itemVariants} className="stat-card glass-card">
                            <div className="stat-icon-wrapper primary">
                                <FiActivity />
                            </div>
                            <div className="stat-info">
                                <h3>Risk Score</h3>
                                <div className="stat-value">{displayStatus?.riskScore?.toFixed(1)}%</div>
                                <span className={`badge badge-${getRiskColor(displayStatus?.riskLevel)}`}>
                                    {displayStatus?.riskLevel || 'UNKNOWN'}
                                </span>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="stat-card glass-card">
                            <div className="stat-icon-wrapper info">
                                <FiMonitor />
                            </div>
                            <div className="stat-info">
                                <h3>Active Sessions</h3>
                                <div className="stat-value">{displayStatus?.activeSessions || 0}</div>
                                <span className="stat-meta">/ {displayStatus?.allowedSessions} Allowed</span>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="stat-card glass-card">
                            <div className="stat-icon-wrapper warning">
                                <FiAlertTriangle />
                            </div>
                            <div className="stat-info">
                                <h3>Risk Events</h3>
                                <div className="stat-value">{riskEvents.length}</div>
                                <span className="stat-meta">Last 24h</span>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="stat-card glass-card">
                            <div className="stat-icon-wrapper success">
                                <FiShield />
                            </div>
                            <div className="stat-info">
                                <h3>Security Status</h3>
                                <div className="stat-value">{displayStatus?.thresholdExceeded ? 'At Risk' : 'Healthy'}</div>
                                <span className="stat-meta">Automated Protection</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Risk Engine Visualization */}
                    <RiskEngine status={displayStatus} />

                    <div className="dashboard-split" style={{ marginTop: '2rem' }}>
                        {/* Active Sessions Table */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="section-card glass-card"
                        >
                            <div className="card-header">
                                <h2><FiSmartphone className="section-icon" /> Active Sessions</h2>
                                <div className="header-actions">
                                    <span className="badge badge-info">{activeSessions.length} Active</span>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Device ID</th>
                                            <th>IP Address</th>
                                            <th>Login Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeSessions.length > 0 ? activeSessions.map((session) => (
                                            <tr key={session.id}>
                                                <td>
                                                    <div className="device-cell">
                                                        <FiMonitor className="device-icon" />
                                                        <span className="device-id" title={session.deviceId}>
                                                            {session.deviceId?.substring(0, 12)}...
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="ip-cell">
                                                        <FiGlobe className="cell-icon" />
                                                        {session.ipAddress}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="time-cell">
                                                        <FiClock className="cell-icon" />
                                                        {new Date(session.loginTime).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="status-cell">
                                                        <span className="status-dot active"></span>
                                                        <span>Active</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="empty-table">
                                                    <FiSmartphone size={32} />
                                                    <p>No active sessions found</p>
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
                            className="section-card glass-card"
                        >
                            <div className="card-header">
                                <h2><FiActivity className="section-icon" /> Recent Activity</h2>
                            </div>

                            <div className="activity-feed">
                                {riskEvents.length > 0 ? (
                                    riskEvents.map((event, index) => (
                                        <div key={event.id || index} className="activity-item">
                                            <div className="activity-icon-wrapper">
                                                <div className={`activity-dot ${event.riskScore > 50 ? 'danger' : 'warning'}`}>
                                                    <FiAlertTriangle size={14} />
                                                </div>
                                                {index !== riskEvents.length - 1 && <div className="activity-line"></div>}
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-header">
                                                    <span className="activity-title">{event.description}</span>
                                                    <span className="activity-time">{new Date(event.eventTime).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="activity-meta">
                                                    <span className="badge badge-warning">Risk: {event.riskScore.toFixed(0)}%</span>
                                                    <span className="action-text">{event.actionTaken}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <FiShield size={48} />
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
