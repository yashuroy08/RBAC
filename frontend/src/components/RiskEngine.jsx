import React from 'react';
import { FiCpu, FiHash, FiActivity, FiShield, FiAlertOctagon } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './RiskEngine.css';

const RiskEngine = ({ status }) => {
    if (!status) return null;

    const { riskScore, activeSessions, allowedSessions, riskThreshold = 50, riskLevel } = status;

    const getScoreColor = () => {
        if (riskScore >= riskThreshold) return 'var(--danger)';
        if (riskScore > 30) return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="risk-engine-card glass-card"
        >
            <div className="engine-header">
                <div className="engine-title">
                    <FiCpu className="engine-icon" />
                    <div>
                        <h3>Risk Engine Lab</h3>
                        <p>Real-time calculation & policy enforcement</p>
                    </div>
                </div>
                <div className="policy-badge">
                    Active Policy: Session Concurrency
                </div>
            </div>

            <div className="engine-body">
                {/* Visual Formula */}
                <div className="formula-section">
                    <div className="formula-label">Calculation Logic</div>
                    <div className="formula-grid">
                        <div className="formula-item">
                            <span className="val">{activeSessions}</span>
                            <span className="lbl">Active Sessions</span>
                        </div>
                        <div className="formula-operator">/</div>
                        <div className="formula-item">
                            <span className="val">{allowedSessions}</span>
                            <span className="lbl">Allowed Cap</span>
                        </div>
                        <div className="formula-operator">×</div>
                        <div className="formula-item">
                            <span className="val">100</span>
                            <span className="lbl">Constant</span>
                        </div>
                        <div className="formula-operator">=</div>
                        <div className="formula-result" style={{ color: getScoreColor() }}>
                            <span className="val">{riskScore.toFixed(0)}%</span>
                            <span className="lbl">Total Risk</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar with Threshold Marker */}
                <div className="threshold-viz">
                    <div className="viz-labels">
                        <span>Risk Intensity</span>
                        <span>Threshold: {riskThreshold}%</span>
                    </div>
                    <div className="viz-bar-container">
                        <div className="viz-bar-bg">
                            <motion.div
                                className="viz-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(riskScore, 100)}%` }}
                                style={{ background: getScoreColor() }}
                            />
                            <div
                                className="threshold-marker"
                                style={{ left: `${riskThreshold}%` }}
                                title="Enforcement Point"
                            >
                                <FiAlertOctagon />
                            </div>
                        </div>
                    </div>
                    <div className="viz-footer">
                        <span className={riskScore >= riskThreshold ? 'danger-text' : 'safe-text'}>
                            {riskScore >= riskThreshold
                                ? '⚠️ Enforcement Triggered: Other sessions invalidated'
                                : '✅ Below Threshold: Normal operation'}
                        </span>
                    </div>
                </div>

                <div className="engine-logic-desc">
                    <div className="logic-item">
                        <FiHash className="logic-icon" />
                        <span><strong>Policy:</strong> If Risk ≥ {riskThreshold}%, system triggers protective logout.</span>
                    </div>
                    <div className="logic-item">
                        <FiShield className="logic-icon" />
                        <span><strong>Protection:</strong> Current session remains active, secondary sessions are killed.</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RiskEngine;
