import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Activity, ClipboardList, Globe, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SaaSLandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
                <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-lg">A</div>
                        <span className="font-bold tracking-tight text-xl">Antigravity Identity</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {user ? (
                            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold transition-all border border-white/10">
                                <LayoutDashboard size={14} /> Dashboard
                            </button>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} className="text-sm font-medium text-text-muted hover:text-white transition-colors">Sign In</button>
                                <button onClick={() => navigate('/register')} className="px-4 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">Start Free Trial</button>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 overflow-hidden relative">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium mb-8"
                    >
                        <Zap size={12} />
                        <span>Adaptive MFA & Risk Scoring Now in Beta</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
                    >
                        The Trust Layer for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">High-Security Enterprise.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-text-muted text-lg max-w-2xl mb-12"
                    >
                        Don’t just verify usernames. Verify intent. Antigravity Identity provides risk-aware access control and immutable forensic logs for teams that can’t afford a breach.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-4"
                    >
                        <button onClick={() => navigate(user ? '/dashboard' : '/register')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                            {user ? 'Go to Dashboard' : 'Get Started Free'} <ChevronRight size={18} />
                        </button>
                        <button className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all">
                            View API Specs
                        </button>
                    </motion.div>

                    {/* Image Preview */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-20 w-full max-w-5xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
                        style={{ background: 'var(--color-bg-elevated)' }}
                    >
                        <img 
                            src="file:///C:/Users/hp/.gemini/antigravity/brain/6233067e-4613-415d-9640-74299f8e42b9/saas_identity_hero_1776497360339.png" 
                            alt="Antigravity Interface" 
                            className="w-full h-auto opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                    </motion.div>
                </div>

                {/* Background Blobs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            </section>

            {/* Features Grid */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<Zap className="text-cyan-400" />}
                            title="Adaptive MFA"
                            description="AI-driven step-up auth targets risky sessions while keeping trusted users fast."
                        />
                        <FeatureCard 
                            icon={<Shield className="text-violet-400" />}
                            title="Forensic Audit Ledger"
                            description="Immutable, cryptographically backed logs for SOC2, HIPAA, and ISO compliance."
                        />
                        <FeatureCard 
                            icon={<Activity className="text-fuchsia-400" />}
                            title="Risk Intelligence"
                            description="Continuous monitoring of velocity, geolocation, and device signatures."
                        />
                    </div>
                </div>
            </section>

            {/* Stats / Proof */}
            <section className="py-20 border-y border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    <div>
                        <div className="text-4xl font-bold mb-2">99.9%</div>
                        <div className="text-xs text-text-muted uppercase tracking-widest font-bold">Uptime Service Level</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">&lt; 40ms</div>
                        <div className="text-xs text-text-muted uppercase tracking-widest font-bold">Auth Latency</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">Zero</div>
                        <div className="text-xs text-text-muted uppercase tracking-widest font-bold">Audit Failures</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">Immutable</div>
                        <div className="text-xs text-text-muted uppercase tracking-widest font-bold">Event Storage</div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto rounded-[40px] p-12 text-center bg-gradient-to-br from-cyan-600/20 to-violet-600/20 border border-white/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold mb-6">Ready to secure your stack?</h2>
                        <p className="text-text-muted mb-10 text-lg">Join 1,000+ security teams building on Antigravity Identity.</p>
                        <button onClick={() => navigate('/register')} className="px-8 py-4 rounded-xl bg-white text-black font-bold hover:scale-105 transition-all">
                            Create Free Account
                        </button>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/5 blur-[100px] pointer-events-none"></div>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 text-center text-text-muted text-xs">
                &copy; 2026 Antigravity Identity Technologies. All rights reserved.
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-text-muted text-sm leading-relaxed">{description}</p>
    </div>
);

export default SaaSLandingPage;
