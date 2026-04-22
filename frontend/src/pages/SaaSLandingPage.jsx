import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    ShieldCheck, Activity, Users, MapPin, Lock,
    FileText, ArrowRight, LayoutDashboard, Database,
    Terminal, Server
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FadeUp = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const FeatureCard = ({ icon, title, description, delay = 0, index }) => (
    <FadeUp delay={delay} className="flex flex-col p-6 lg:p-8 border-b md:border-b-0 md:border-r border-[var(--color-border-subtle)] relative group bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-elevated)] transition-colors">
        <div className="absolute top-4 right-4 text-[10px] font-mono text-[var(--color-text-muted)] opacity-50 group-hover:opacity-100 transition-opacity">
            0{index + 1}_
        </div>
        <div className="w-10 h-10 mb-6 flex items-center justify-center text-[var(--color-signal)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]">
            {icon}
        </div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--color-canvas)] mb-3">{title}</h3>
        <p className="text-[var(--color-text-muted)] leading-relaxed text-sm">{description}</p>
    </FadeUp>
);

const SaaSLandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen font-sans selection:bg-signal/30 selection:text-white overflow-x-hidden flex flex-col" style={{ background: 'var(--color-bg-deep)', color: 'var(--color-text-main)' }}>
            
            {/* Top Bar - Identity */}
            <nav className="w-full z-50 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-[var(--color-command)] text-white">
                            <Terminal size={14} strokeWidth={2} />
                        </div>
                        <span className="font-mono text-xs font-bold tracking-[0.1em] text-[var(--color-canvas)]">
                            Secure Access Portal
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <button onClick={() => navigate('/dashboard')}
                                className="btn btn-primary text-xs !py-1.5 !px-4">
                                [ Go to Dashboard ]
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/login')}
                                    className="font-mono text-xs font-medium text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer">
                                    Sign In
                                </button>
                                <button onClick={() => navigate('/register')}
                                    className="btn btn-primary text-xs !py-1.5 !px-4">
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section - Split Asymmetrical */}
            <section className="flex-1 border-b border-[var(--color-border-subtle)] grid grid-cols-1 lg:grid-cols-12 relative max-w-[1440px] mx-auto w-full">
                {/* Left Column: Typography & Action */}
                <div className="lg:col-span-7 border-r border-[var(--color-border-subtle)] pt-24 pb-20 px-8 lg:px-16 flex flex-col justify-center bg-[var(--color-bg-deep)]">
                    <FadeUp>
                        <div className="inline-flex items-center gap-3 mb-8">
                            <span className="w-2 h-2 bg-[var(--color-signal)]" />
                            <span className="text-[10px] font-mono text-[var(--color-signal)] tracking-[0.2em] font-bold">Platform Active / v1.0.4</span>
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.1}>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8 text-[var(--color-canvas)] leading-[1.05]">
                            Manage Everything.<br />
                            <span className="font-mono font-light text-[var(--color-signal)] text-3xl sm:text-4xl lg:text-5xl mt-2 block tracking-tight">
                                Securely and easily.
                            </span>
                        </h1>
                    </FadeUp>

                    <FadeUp delay={0.2}>
                        <p className="text-base text-[var(--color-text-muted)] max-w-xl mb-12 flex items-start gap-4">
                            <span className="text-xs font-mono opacity-50 block mt-1 shrink-0">{'>'}</span>
                            Protect your data with simple, reliable access controls. Manage who can see and do what in your organization without the technical headache.
                        </p>
                    </FadeUp>

                    <FadeUp delay={0.3}>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => navigate(user ? '/dashboard' : '/register')}
                                className="w-full sm:w-auto btn btn-primary px-8">
                                {user ? 'Go to Dashboard' : 'Start for free'} <ArrowRight size={14} />
                            </button>
                            <button onClick={() => navigate('/login')}
                                className="w-full sm:w-auto btn btn-secondary px-8 font-mono">
                                Login
                            </button>
                        </div>
                    </FadeUp>
                </div>

                {/* Right Column: Technical Visual / Data stream */}
                <div className="hidden lg:flex lg:col-span-5 bg-[var(--color-bg-base)] relative overflow-hidden flex-col">
                    <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-[var(--color-text-muted)] opacity-30 text-right">
                        LAT: 37.7749 | LNG: -122.4194<br/>
                        SERVER: PRIMARY_NODE<br/>
                        STATUS: ONLINE
                    </div>
                    
                    <div className="flex-1 p-12 flex items-center justify-center relative">
                        {/* Technical grid lines */}
                        <div className="absolute inset-0" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, var(--color-border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border-subtle) 1px, transparent 1px)' }} />
                        
                        <FadeUp delay={0.4} className="w-full max-w-sm relative z-10 glass-card !p-0 overflow-hidden border border-[var(--color-command)] shadow-[8px_8px_0_var(--color-bg-elevated)]">
                            <div className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] px-4 py-2 flex items-center justify-between">
                                <span className="font-mono text-[10px] text-[var(--color-signal)]">RECENT ACTIVITY</span>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-[var(--color-border-subtle)]" />
                                    <div className="w-2 h-2 bg-[var(--color-border-subtle)]" />
                                </div>
                            </div>
                            <div className="p-4 font-mono text-xs flex flex-col gap-2">
                                <div className="flex justify-between items-center bg-[var(--color-bg-deep)] p-2">
                                    <span className="text-[var(--color-safe)]">SUCCESSFUL LOGIN</span>
                                    <span className="text-[var(--color-text-muted)]">j.doe | ADMIN</span>
                                </div>
                                <div className="flex justify-between items-center bg-[var(--color-bg-deep)] p-2 border-l-2 border-[var(--color-warn)]">
                                    <span className="text-[var(--color-warn)]">SECURITY CHECK</span>
                                    <span className="text-[var(--color-text-muted)]">a.smith | USER</span>
                                </div>
                                <div className="flex justify-between items-center bg-[var(--color-bg-deep)] p-2 border-l-2 border-[var(--color-crit-solid)]">
                                    <span className="text-[var(--color-crit-solid)]">ACCESS DENIED</span>
                                    <span className="text-[var(--color-text-muted)]">IP: 198.51.100.14</span>
                                </div>
                                <div className="flex justify-between items-center bg-[var(--color-bg-deep)] p-2 opacity-50">
                                    <span className="text-[var(--color-text-main)]">WAITING...</span>
                                    <span className="animate-pulse">_</span>
                                </div>
                            </div>
                        </FadeUp>
                    </div>
                </div>
            </section>

            {/* Features Matrix Grid */}
            <section id="features" className="max-w-[1440px] mx-auto w-full">
                <div className="border-b border-[var(--color-border-subtle)] px-8 py-6 bg-[var(--color-bg-base)] flex items-center justify-between">
                    <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-main)]">
                        Core Features
                    </h2>
                    <Server size={16} className="text-[var(--color-text-muted)]" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 bg-[var(--color-bg-deep)]">
                    <FeatureCard
                        index={0}
                        icon={<Users size={18} />}
                        title="Role Management"
                        description="Easily assign roles and enforce least-privilege access across your entire organization."
                        delay={0.1}
                    />
                    <FeatureCard
                        index={1}
                        icon={<Lock size={18} />}
                        title="Two-Factor Security"
                        description="Add an extra layer of protection requiring users to verify logins on unknown devices."
                        delay={0.2}
                    />
                    <FeatureCard
                        index={2}
                        icon={<Activity size={18} />}
                        title="Activity Monitoring"
                        description="Track user sessions and monitor for risky activity behind the scenes."
                        delay={0.3}
                    />
                    <FeatureCard
                        index={3}
                        icon={<MapPin size={18} />}
                        title="Location Controls"
                        description="Restrict access based on physical geography to block logins from untrusted regions."
                        delay={0.4}
                    />
                    <FeatureCard
                        index={4}
                        icon={<FileText size={18} />}
                        title="Audit Logging"
                        description="Keep tamper-proof logs of every access attempt and policy change for compliance."
                        delay={0.5}
                    />
                    <FeatureCard
                        index={5}
                        icon={<Database size={18} />}
                        title="Reliable Infrastructure"
                        description="Built on rock-solid enterprise technologies to ensure high availability and data integrity."
                        delay={0.6}
                    />
                </div>
            </section>

            {/* Developer Section */}
            <section id="developers" className="border-t border-[var(--color-border-subtle)] max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row">
                <div className="lg:w-1/3 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                    <FadeUp>
                        <h2 className="font-mono text-sm uppercase tracking-widest text-[var(--color-canvas)] mb-6">
                            Behind the Scenes
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed">
                            Built securely from the ground up. We handle complex authentication loops, modern encryption, and policy checks so you don't have to.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-text-main)]">
                                <ShieldCheck size={14} className="text-[var(--color-signal)]" /> [ Seamless Authentication ]
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-text-main)]">
                                <ShieldCheck size={14} className="text-[var(--color-signal)]" /> [ Strong Password Hashing ]
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-text-main)]">
                                <ShieldCheck size={14} className="text-[var(--color-signal)]" /> [ Safe Browser Policies ]
                            </div>
                        </div>
                    </FadeUp>
                </div>
                <div className="lg:w-2/3 bg-[var(--color-bg-deep)] p-8 lg:p-12 flex items-center justify-center">
                    <FadeUp delay={0.2} className="w-full">
                        <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                            <div className="border-b border-[var(--color-border-subtle)] px-4 py-2 flex items-center justify-between">
                                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">src/config/SecurityConfig.java</span>
                            </div>
                            <div className="p-6 overflow-x-auto text-[12px] font-mono leading-relaxed">
                                <pre className="text-[var(--color-text-main)] m-0 p-0" style={{ whiteSpace: 'pre-wrap' }}>
                                    <span style={{ color: 'var(--color-signal)' }}>@Configuration</span><br/>
                                    <span style={{ color: 'var(--color-secondary)' }}>public class</span> SecurityFilterChainConfig {'{'}<br/><br/>
                                    &nbsp;&nbsp;<span style={{ color: 'var(--color-signal)' }}>@Bean</span><br/>
                                    &nbsp;&nbsp;<span style={{ color: 'var(--color-secondary)' }}>public</span> SecurityFilterChain <span style={{ color: 'var(--color-safe)' }}>filterChain</span>(HttpSecurity http) <span style={{ color: 'var(--color-secondary)' }}>throws</span> Exception {'{'}<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;http<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.and()<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthFilter.<span style={{ color: 'var(--color-secondary)' }}>class</span>)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.addFilterAfter(mfaEnforcementFilter, JwtAuthenticationFilter.<span style={{ color: 'var(--color-secondary)' }}>class</span>)<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.authorizeRequests()<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.antMatchers(<span style={{ color: 'var(--color-safe)' }}>"/api/admin/**"</span>).hasRole(<span style={{ color: 'var(--color-safe)' }}>"ADMIN"</span>)<br/>
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
            <footer className="border-t border-[var(--color-border-subtle)] py-6 px-6 bg-[var(--color-bg-base)]">
                <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                        SYS.RBAC — {new Date().getFullYear()} — ALL RIGHTS RESERVED
                    </span>
                    <div className="flex gap-4 font-mono text-[10px] text-[var(--color-text-muted)]">
                        <span className="hover:text-[var(--color-signal)] cursor-pointer tracking-widest">STATUS: OK</span>
                        <span className="hover:text-[var(--color-signal)] cursor-pointer tracking-widest">VERSION 1.0.4</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SaaSLandingPage;
