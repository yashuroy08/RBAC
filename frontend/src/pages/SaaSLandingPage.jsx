import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    ShieldCheck, Activity, Users, MapPin, Lock, 
    FileText, ArrowRight, LayoutDashboard, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FadeUp = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const FeatureCard = ({ icon, title, description, delay = 0 }) => (
    <FadeUp delay={delay} className="flex flex-col p-6 lg:p-8 glass-card hover:bg-white/[0.02] cursor-pointer">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-inner" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-signal)', border: '1px solid var(--color-border-subtle)' }}>
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-canvas mb-3">{title}</h3>
        <p className="text-text-muted leading-relaxed text-sm">{description}</p>
    </FadeUp>
);

const SaaSLandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen font-sans selection:bg-signal/30 selection:text-white overflow-x-hidden" style={{ background: 'var(--color-bg-deep)', color: 'var(--color-text-main)' }}>
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all" style={{ background: 'rgba(8, 14, 24, 0.8)', borderColor: 'var(--color-border-subtle)' }}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--color-signal)' }}>
                            <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-lg text-canvas tracking-tight">
                            Identity Platform
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
                        <a href="#features" className="hover:text-canvas transition-colors">Features</a>
                        <a href="#developers" className="hover:text-canvas transition-colors">Developers</a>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <button onClick={() => navigate('/dashboard')}
                                className="btn btn-primary text-xs px-4 py-2">
                                <LayoutDashboard size={16} className="mr-1" /> Dashboard
                            </button>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')}
                                    className="hidden md:block text-sm font-medium text-text-muted hover:text-canvas transition-colors cursor-pointer">
                                    Sign In
                                </button>
                                <button onClick={() => navigate('/register')}
                                    className="btn btn-primary text-xs px-4 py-2">
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'var(--color-primary-glow)' }} />
                
                <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
                    <FadeUp>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider mb-8"
                             style={{ background: 'rgba(55, 138, 221, 0.1)', borderColor: 'rgba(55, 138, 221, 0.2)', color: 'var(--color-signal)' }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-signal)' }} />
                            Enterprise Grade Security
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.1}>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 text-canvas leading-[1.1]">
                            Manage access context <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--color-signal), var(--color-secondary))' }}>
                                with precision.
                            </span>
                        </h1>
                    </FadeUp>

                    <FadeUp delay={0.2}>
                        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                            A complete identity management solution featuring role-based control, 
                            adaptive multi-factor authentication, risk monitoring, and granular location policies.
                        </p>
                    </FadeUp>

                    <FadeUp delay={0.3}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => navigate(user ? '/dashboard' : '/register')}
                                className="w-full sm:w-auto btn btn-primary px-8 py-3.5 text-base">
                                {user ? 'Open Dashboard' : 'Start for free'} <ArrowRight size={18} />
                            </button>
                            <button onClick={() => navigate('/login')}
                                className="w-full sm:w-auto btn btn-secondary px-8 py-3.5 text-base">
                                View Live Demo
                            </button>
                        </div>
                    </FadeUp>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 border-t px-6" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}>
                <div className="max-w-7xl mx-auto">
                    <FadeUp>
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-canvas mb-4">
                                Everything you need for secure access
                            </h2>
                            <p className="text-text-muted text-lg">
                                Not just identity—a contextual access engine that evaluates every request.
                            </p>
                        </div>
                    </FadeUp>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users size={24} />}
                            title="Role-Based Access"
                            description="Enforce least privilege with robust hierarchical roles. Control permissions, manage administrators, and easily lock or unlock users."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Lock size={24} />}
                            title="Adaptive MFA"
                            description="Context-aware Multi-Factor Authentication. Requires TOTP verification automatically when anomalous behavior or untrusted devices are detected."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<Activity size={24} />}
                            title="Live Risk Engine"
                            description="Continuous surveillance of active sessions. Scores risk based on location anomalies, request volume, and device trust in real-time."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={<MapPin size={24} />}
                            title="Location Policies"
                            description="Define geographical boundaries. Bind users to strict physical perimeters with our geo-fencing configuration capabilities."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon={<FileText size={24} />}
                            title="Immutable Audit"
                            description="Maintain compliance with a comprehensive, tamper-evident ledger. Record all authentication attempts, policy changes, and security events."
                            delay={0.5}
                        />
                        <FeatureCard
                            icon={<Database size={24} />}
                            title="Robust Infrastructure"
                            description="Powered by a secure Spring Boot backend and PostgreSQL. Built to scale and seamlessly plug into your existing application stacks."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

            {/* Developer Experience / Code Snippet */}
            <section id="developers" className="py-24 border-t px-6" style={{ background: 'var(--color-bg-deep)', borderColor: 'var(--color-border-subtle)' }}>
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeUp>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider mb-6"
                                 style={{ background: 'rgba(83, 74, 183, 0.1)', borderColor: 'rgba(83, 74, 183, 0.2)', color: 'var(--color-secondary)' }}>
                                Developer First
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-canvas mb-6">
                                Built on enterprise standards
                            </h2>
                            <p className="text-text-muted text-lg mb-8 leading-relaxed">
                                Our backend leverages Spring Security's filter chain architecture. 
                                We inject custom JWT handling and MFA verification layers seamlessly, 
                                securing your endpoints by default.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Secure password hashing & validation',
                                    'Configurable JWT expiration & rotation',
                                    'Stateless, scalable authentication architecture'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-text-main font-medium">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-inner" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-signal)' }}>
                                            <ShieldCheck size={14} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeUp>
                    </div>

                    <FadeUp delay={0.2}>
                        <div className="glass-card overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)' }}>
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="ml-2 text-xs font-mono text-text-muted">SecurityConfig.java</span>
                            </div>
                            <div className="p-6 overflow-x-auto text-[13px] font-mono leading-relaxed" style={{ background: 'var(--color-bg-deep)' }}>
                                <pre className="text-text-main m-0 p-0" style={{ whiteSpace: 'pre-wrap' }}>
                                    <span style={{ color: 'var(--color-signal)' }}>@Configuration</span><br/>
                                    <span style={{ color: 'var(--color-signal)' }}>@EnableWebSecurity</span><br/>
                                    <span style={{ color: 'var(--color-secondary)' }}>public class</span> SecurityConfig {'{'}<br/><br/>
                                    &nbsp;&nbsp;<span style={{ color: 'var(--color-signal)' }}>@Bean</span><br/>
                                    &nbsp;&nbsp;<span style={{ color: 'var(--color-secondary)' }}>public</span> SecurityFilterChain <span style={{ color: 'var(--color-safe)' }}>filterChain</span>(HttpSecurity http)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--color-secondary)' }}>throws</span> Exception {'{'}<br/><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;http<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthFilter.<span style={{ color: 'var(--color-secondary)' }}>class</span>)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.addFilterAfter(mfaEnforcementFilter, JwtAuthenticationFilter.<span style={{ color: 'var(--color-secondary)' }}>class</span>)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.authorizeRequests()<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.antMatchers(<span style={{ color: 'var(--color-safe)' }}>"/api/admin/**"</span>).hasRole(<span style={{ color: 'var(--color-safe)' }}>"ADMIN"</span>)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.antMatchers(<span style={{ color: 'var(--color-safe)' }}>"/api/user/**"</span>).hasAnyRole(<span style={{ color: 'var(--color-safe)' }}>"USER"</span>, <span style={{ color: 'var(--color-safe)' }}>"ADMIN"</span>)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.anyRequest().authenticated();<br/><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--color-secondary)' }}>return</span> http.build();<br/>
                                    &nbsp;&nbsp;{'}'}<br/>
                                    {'}'}
                                </pre>
                            </div>
                        </div>
                    </FadeUp>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 px-6" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ background: 'var(--color-signal)' }}>
                            <ShieldCheck size={14} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-canvas tracking-tight text-sm">
                            Identity Platform
                        </span>
                    </div>
                    
                    <p className="text-text-muted text-sm">
                        &copy; {new Date().getFullYear()} Enterprise Access System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default SaaSLandingPage;
