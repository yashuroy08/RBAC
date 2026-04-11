import React from 'react';
import { BookOpen, Zap, Target, Server, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const SystemContext = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* project overview */}
                <div className="glass-card flex flex-col items-center text-center p-8 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                    <div className="text-xs font-bold tracking-wider text-primary mb-3 uppercase px-3 py-1 bg-primary/10 rounded-full">IDENTITY & RISK MGMT</div>
                    <h2 className="text-2xl font-bold text-light-text mb-4">RBAC Risk Evaluator System</h2>
                    <p className="text-dark-text-muted mb-8 leading-relaxed max-w-sm mx-auto">A sophisticated security framework designed to prevent account sharing and unauthorized access through real-time session risk assessment.</p>

                    <div className="flex flex-col gap-4 w-full text-left">
                        <div className="flex bg-dark-bg/50 p-4 rounded-xl border border-dark-border hover:bg-dark-bg hover:border-primary/30 transition-all">
                            <Zap className="text-warning mr-4 mt-1 shrink-0" size={24} />
                            <div>
                                <h4 className="text-light-text font-bold mb-1">Risk Score Logic</h4>
                                <p className="text-dark-text-muted text-sm m-0">Evaluates the ratio of active vs. allowed sessions. Hits 100% when limits are breached.</p>
                            </div>
                        </div>
                        <div className="flex bg-dark-bg/50 p-4 rounded-xl border border-dark-border hover:bg-dark-bg hover:border-danger/30 transition-all">
                            <Target className="text-danger mr-4 mt-1 shrink-0" size={24} />
                            <div>
                                <h4 className="text-light-text font-bold mb-1">Auto-Termination</h4>
                                <p className="text-dark-text-muted text-sm m-0">System automatically invalidates old sessions when high risk is detected, preserving only the newest login.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* technical stack */}
                    <div className="glass-card p-6">
                        <h3 className="flex items-center gap-2 text-primary font-bold mb-4 border-b border-dark-border pb-2 text-lg"><Server size={20} /> Backend Architecture</h3>
                        <ul className="space-y-3 m-0 p-0 list-none">
                            <li className="flex gap-2 text-sm text-dark-text-muted"><span className="text-primary mt-0.5">•</span> <span><strong className="text-light-text font-semibold">Spring Security:</strong> Session-based auth with custom DAO provider.</span></li>
                            <li className="flex gap-2 text-sm text-dark-text-muted"><span className="text-primary mt-0.5">•</span> <span><strong className="text-light-text font-semibold">Spring Session JDBC:</strong> Persistent session management across restarts.</span></li>
                            <li className="flex gap-2 text-sm text-dark-text-muted"><span className="text-primary mt-0.5">•</span> <span><strong className="text-light-text font-semibold">MS SQL Server:</strong> Enterprise-grade relational data storage.</span></li>
                            <li className="flex gap-2 text-sm text-dark-text-muted"><span className="text-primary mt-0.5">•</span> <span><strong className="text-light-text font-semibold">Risk Pattern:</strong> Service-layer evaluation triggered on every login.</span></li>
                        </ul>
                    </div>

                    {/* reviewer instructions */}
                    <div className="glass-card p-6">
                        <h3 className="flex items-center gap-2 text-info font-bold mb-4 border-b border-info/20 pb-2 text-lg"><BookOpen size={20} /> Reviewer Testing Guide</h3>
                        <ol className="m-0 p-0 pl-4 space-y-3 text-sm text-dark-text-muted list-decimal ml-2">
                            <li className="pl-1"><strong className="text-light-text font-semibold">Test Concurrency:</strong> Open the app in different browsers. The system now allows up to 4 concurrent sessions. Log in 5 times to trigger the auto-logout!</li>
                            <li className="pl-1"><strong className="text-light-text font-semibold">Check Global Config:</strong> Currently set to 4 allowed sessions and 50% threshold in <code className="bg-dark-bg px-1.5 py-0.5 rounded border border-dark-border text-primary text-xs font-mono font-medium">application.properties</code>.</li>
                            <li className="pl-1"><strong className="text-light-text font-semibold">Location Check:</strong> Add a location zone in the Location tab. Non-admin users will be blocked if outside the zone.</li>
                        </ol>
                    </div>

                    {/* active configuration */}
                    <div className="glass-card p-6">
                        <h3 className="flex items-center gap-2 font-bold mb-4 border-b border-dark-border pb-2 text-lg text-light-text"><Settings className="text-dark-text-muted" size={20} /> Current Core Config</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col flex-1 bg-dark-bg/80 border border-dark-border rounded-xl p-3 text-center transition-all hover:border-primary/30 py-4">
                                <span className="text-[10px] font-bold text-dark-text-muted uppercase tracking-wider mb-1">Max Sessions</span>
                                <span className="text-xl font-bold text-primary font-mono m-0">4</span>
                            </div>
                            <div className="flex flex-col flex-1 bg-dark-bg/80 border border-dark-border rounded-xl p-3 text-center transition-all hover:border-primary/30 py-4">
                                <span className="text-[10px] font-bold text-dark-text-muted uppercase tracking-wider mb-1">Risk Threshold</span>
                                <span className="text-xl font-bold text-warning font-mono m-0">50%</span>
                            </div>
                            <div className="flex flex-col flex-1 bg-dark-bg/80 border border-dark-border rounded-xl p-3 text-center transition-all hover:border-primary/30 py-4">
                                <span className="text-[10px] font-bold text-dark-text-muted uppercase tracking-wider mb-1">Auth Type</span>
                                <span className="text-[13px] font-bold text-success m-0 truncate mt-1" title="Session-Based">Session-Based</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemContext;
