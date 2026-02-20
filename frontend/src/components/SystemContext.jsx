import React from 'react';
import { FiBookOpen, FiZap, FiTarget, FiBox, FiServer, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './SystemContext.css';

const SystemContext = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="system-context-tab"
        >
            <div className="context-grid">
                {/* project overview */}
                <div className="context-card glass-card main">
                    <div className="card-badge">IDENTITY & RISK MGMT</div>
                    <h2>RBAC Risk Evaluator System</h2>
                    <p>A sophisticated security framework designed to prevent account sharing and unauthorized access through real-time session risk assessment.</p>

                    <div className="feature-list">
                        <div className="feature-item">
                            <FiZap className="icon" />
                            <div>
                                <h4>Risk Score Logic</h4>
                                <p>Evaluates the ratio of active vs. allowed sessions. Hits 100% when limits are breached.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FiTarget className="icon" />
                            <div>
                                <h4>Auto-Termination</h4>
                                <p>System automatically invalidates old sessions when high risk is detected, preserving only the newest login.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* technical stack */}
                <div className="context-card glass-card">
                    <h3><FiServer /> Backend Architecture</h3>
                    <ul className="config-list">
                        <li><strong>Spring Security:</strong> Session-based auth with custom DAO provider.</li>
                        <li><strong>Spring Session JDBC:</strong> Persistent session management across restarts.</li>
                        <li><strong>MS SQL Server:</strong> Enterprise-grade relational data storage.</li>
                        <li><strong>Risk Pattern:</strong> Service-layer evaluation triggered on every login.</li>
                    </ul>
                </div>

                {/* reviewer instructions */}
                <div className="context-card glass-card highlight">
                    <h3><FiBookOpen /> Reviewer Testing Guide</h3>
                    <ol className="step-list">
                        <li>
                            <strong>Test Concurrency:</strong> Open the app in different browsers.
                            The system now allows up to 4 concurrent sessions. Log in 5 times to trigger the auto-logout!
                        </li>
                        <li>
                            <strong>Check Global Config:</strong> Currently set to 4 allowed sessions and 50% threshold in <code>application.properties</code>.
                        </li>
                        <li>
                            <strong>Location Check:</strong> Add a location zone in the Location tab. Non-admin users will be blocked if outside the zone.
                        </li>
                    </ol>
                </div>

                {/* active configuration */}
                <div className="context-card glass-card">
                    <h3><FiSettings /> Current Core Config</h3>
                    <div className="config-pill-grid">
                        <div className="config-pill">
                            <span className="label">Max Sessions</span>
                            <span className="value">4</span>
                        </div>
                        <div className="config-pill">
                            <span className="label">Risk Threshold</span>
                            <span className="value">50%</span>
                        </div>
                        <div className="config-pill">
                            <span className="label">Auth Type</span>
                            <span className="value">Session-Based</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemContext;
