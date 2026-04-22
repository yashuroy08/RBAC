import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, KeyRound, User, TerminalSquare, Lock, MapPin, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import MfaModal from '../components/MfaModal';

const Login = () => {
    const navigate = useNavigate();
    const { login, checkAuth } = useAuth();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [locationError, setLocationError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mfaData, setMfaData] = useState({ required: false, sessionId: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setLocationError(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocationError(false);
        try {
            const response = await login(formData);
            if (response && response.success) {
                if (response.data?.mfaRequired) {
                    setMfaData({
                        required: true,
                        sessionId: response.data.sessionId,
                        message: response.data.mfaMessage
                    });
                } else {
                    navigate('/dashboard', { state: { loginMessage: response.message } });
                }
            } else {
                if (response?.message) setError(response.message);
                else navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error full details:', err);
            const status = err.response?.status;
            const message = err.response?.data?.message || err.message || '';

            if (status === 403 && message.includes('outside the allowed login zone')) {
                setLocationError(true);
                setError(message);
            } else if (!err.response && !err.message) {
                setError('Network error: Unable to connect to the server.');
            } else {
                setError(err.response?.data?.message || err.message || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-main)] flex">
            {/* Left Side - Brand & Branding/Log display */}
            <div className="hidden lg:flex lg:w-1/2 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] flex-col relative overflow-hidden">
                <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(to right, var(--color-border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border-subtle) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                <div className="flex-1 p-12 flex flex-col justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-[var(--color-command)] text-white">
                                <TerminalSquare size={18} strokeWidth={2} />
                            </div>
                            <span className="font-mono text-sm font-bold uppercase text-[var(--color-canvas)] tracking-[0.1em]">
                                Account Portal
                            </span>
                        </div>
                        
                        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-canvas)] leading-[1.1] mb-6">
                            Welcome Back.<br />
                            <span className="font-mono font-light text-[var(--color-signal)] text-2xl tracking-[0.1em] block mt-4">
                                Please Sign In
                            </span>
                        </h1>
                        <p className="font-mono text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">
                            Sign in to access your dashboard and manage your account.
                        </p>
                    </div>

                    <div className="font-mono text-[10px] text-[var(--color-text-muted)] p-4 border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] mt-12 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-signal)]"></div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between"><span>Status:</span><span className="text-[var(--color-safe)]">Online</span></div>
                            <div className="flex justify-between"><span>Connection:</span><span className="text-[var(--color-safe)]">Secured</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--color-bg-deep)] relative">
                <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
                    <TerminalSquare size={16} className="text-[var(--color-command)]" />
                    <span className="font-mono text-xs font-bold tracking-[0.1em] text-[var(--color-canvas)]">Account Portal</span>
                </div>

                <div className="w-full max-w-md relative">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]"
                    >
                        {/* Form Header */}
                        <div className="border-b border-[var(--color-border-subtle)] px-6 py-4 flex items-center justify-between bg-[var(--color-bg-elevated)]">
                            <h2 className="font-mono text-xs font-bold tracking-[0.1em] text-[var(--color-canvas)] flex items-center gap-2">
                                <KeyRound size={14} className="text-[var(--color-signal)]" />
                                SIGN IN
                            </h2>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-[var(--color-border-subtle)]" />
                                <div className="w-2 h-2 bg-[var(--color-border-subtle)]" />
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 sm:p-8">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 mb-6 flex items-start gap-2.5 text-xs font-mono"
                                    style={{
                                        background: locationError ? 'var(--color-warn-bg)' : 'var(--color-crit-bg)',
                                        color: locationError ? 'var(--color-warn-text)' : 'var(--color-crit-text)',
                                        border: `1px solid ${locationError ? 'var(--color-warn)' : 'var(--color-crit)'}`
                                    }}
                                >
                                    {locationError ? <MapPin size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold">{error}</span>
                                        {locationError && (
                                            <span className="opacity-80">
                                                Your current location is outside the authorized zone. Contact your administrator.
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="input-label" htmlFor="username">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                                            <User size={16} />
                                        </div>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="input-field pl-10 bg-[var(--color-bg-deep)]"
                                            placeholder="Enter your username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center">
                                        <label className="input-label mb-0" htmlFor="password">
                                            Password
                                        </label>
                                        <Link to="/reset-password" className="text-[10px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-signal)] tracking-widest uppercase transition-colors">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <div className="relative mt-2">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="input-field pl-10 pr-10 bg-[var(--color-bg-deep)]"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-signal)] transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full mt-4"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>
                        </div>
                        
                        {/* Form Footer */}
                        <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] flex justify-between items-center text-xs font-mono">
                            <span className="text-[var(--color-text-muted)]">Don't have an account?</span>
                            <Link to="/register" className="text-[var(--color-command)] hover:text-[var(--color-signal)] font-bold tracking-[0.1em]">
                                Create Account
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            <MfaModal
                isOpen={mfaData.required}
                onClose={() => setMfaData({ ...mfaData, required: false })}
                sessionId={mfaData.sessionId}
                onVerified={async () => {
                    await checkAuth();
                    navigate('/dashboard', { state: { loginMessage: 'Verification successful. Welcome back!' } });
                }}
            />
        </div>
    );
};

export default Login;
