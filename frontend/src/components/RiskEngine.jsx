import React from 'react';
import { Cpu, Hash, Shield, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskEngine = ({ status }) => {
    if (!status) return null;

    const { riskScore, activeSessions, allowedSessions, riskThreshold = 50, riskLevel } = status;

    const getScoreColor = () => {
        if (riskScore >= riskThreshold) return 'var(--color-danger)';
        if (riskScore > 30) return 'var(--color-warning)';
        return 'var(--color-success)';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card mt-8 p-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-dark-border pb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center bg-primary/20 text-primary p-3 rounded-xl ring-1 ring-primary/30">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-light-text m-0">Risk Engine Lab</h3>
                        <p className="text-sm text-dark-text-muted m-0">Real-time calculation & policy enforcement</p>
                    </div>
                </div>
                <div className="bg-dark-bg/60 border border-dark-border px-4 py-2 rounded-lg text-sm text-primary font-medium tracking-wide">
                    Active Policy: Session Concurrency
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Visual Formula */}
                <div className="bg-dark-bg/40 rounded-xl p-5 border border-dark-border/50">
                    <div className="text-xs uppercase tracking-wider text-dark-text-muted font-bold mb-4">Calculation Logic</div>
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-center">
                        <div className="flex flex-col items-center bg-dark-bg/80 px-5 py-3 rounded-lg border border-dark-border shadow-sm min-w-[100px]">
                            <span className="text-2xl font-mono text-light-text font-bold">{activeSessions}</span>
                            <span className="text-xs text-dark-text-muted mt-1 uppercase tracking-wide">Active Sessions</span>
                        </div>
                        <div className="text-xl text-dark-text-muted font-light">/</div>
                        <div className="flex flex-col items-center bg-dark-bg/80 px-5 py-3 rounded-lg border border-dark-border shadow-sm min-w-[100px]">
                            <span className="text-2xl font-mono text-light-text font-bold">{allowedSessions}</span>
                            <span className="text-xs text-dark-text-muted mt-1 uppercase tracking-wide">Allowed Cap</span>
                        </div>
                        <div className="text-xl text-dark-text-muted font-light">×</div>
                        <div className="flex flex-col items-center bg-dark-bg/80 px-5 py-3 rounded-lg border border-dark-border shadow-sm min-w-[100px]">
                            <span className="text-2xl font-mono text-light-text font-bold">100</span>
                            <span className="text-xs text-dark-text-muted mt-1 uppercase tracking-wide">Constant</span>
                        </div>
                        <div className="text-xl text-dark-text-muted font-light">=</div>
                        <div className="flex flex-col items-center bg-dark-bg/80 px-6 py-3 rounded-lg border shadow-[0_0_15px_rgba(0,0,0,0.5)] min-w-[120px]" style={{ borderColor: getScoreColor() }}>
                            <span className="text-3xl font-mono font-bold" style={{ color: getScoreColor(), textShadow: `0 0 10px ${getScoreColor()}` }}>{riskScore.toFixed(0)}%</span>
                            <span className="text-xs mt-1 uppercase tracking-wide" style={{ color: getScoreColor() }}>Total Risk</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar with Threshold Marker */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-dark-text-muted uppercase tracking-wider text-xs">Risk Intensity</span>
                        <span className="text-danger font-bold text-xs uppercase tracking-wider bg-danger/10 px-2 py-0.5 rounded border border-danger/30">Threshold: {riskThreshold}%</span>
                    </div>
                    <div className="relative h-4 bg-dark-bg rounded-full overflow-hidden border border-dark-border/50">
                        <motion.div
                            className="h-full rounded-full relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(riskScore, 100)}%` }}
                            style={{ background: `linear-gradient(90deg, var(--color-success) 0%, ${getScoreColor()} 100%)`, boxShadow: `0 0 10px ${getScoreColor()}` }}
                        />
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-danger z-10"
                            style={{ left: `${riskThreshold}%`, boxShadow: '0 0 8px var(--color-danger)' }}
                            title="Enforcement Point"
                        >
                            <div className="absolute -top-1 -translate-x-1/2 text-danger drop-shadow-[0_0_5px_var(--color-danger)]">
                                <AlertOctagon size={16} fill="var(--color-dark-bg)" />
                            </div>
                        </div>
                    </div>
                    <div className="flex mt-2 text-sm justify-center">
                        <span className={`px-4 py-1.5 rounded-full font-medium text-xs flex items-center gap-2 ${riskScore >= riskThreshold ? 'bg-danger/10 text-danger border border-danger/30' : 'bg-success/10 text-success border border-success/30'}`}>
                            {riskScore >= riskThreshold
                                ? '⚠️ Enforcement Triggered: Other sessions invalidated'
                                : '✅ Below Threshold: Normal operation'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex items-start gap-3 bg-dark-bg/30 p-4 rounded-xl border border-dark-border">
                        <div className="mt-0.5 text-primary"><Hash size={18} /></div>
                        <p className="text-sm text-dark-text-muted m-0 leading-relaxed cursor-default"><strong className="text-light-text">Policy:</strong> If Risk ≥ {riskThreshold}%, system triggers protective logout.</p>
                    </div>
                    <div className="flex items-start gap-3 bg-dark-bg/30 p-4 rounded-xl border border-dark-border">
                        <div className="mt-0.5 text-success"><Shield size={18} /></div>
                        <p className="text-sm text-dark-text-muted m-0 leading-relaxed cursor-default"><strong className="text-light-text">Protection:</strong> Current session remains active, secondary sessions are killed.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RiskEngine;
