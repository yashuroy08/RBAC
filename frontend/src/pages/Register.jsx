import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Eye, EyeOff, UserPlus, AlertCircle, TerminalSquare } from 'lucide-react';

/* ── Validation Constants (mirroring backend) ── */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]{2,49}$/;

/* ── Password Strength Logic ── */
const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '', checks: [] };

    const checks = [
        { label: 'Length >= 8', met: password.length >= 8 },
        { label: 'Uppercase', met: /[A-Z]/.test(password) },
        { label: 'Lowercase', met: /[a-z]/.test(password) },
        { label: 'Number', met: /[0-9]/.test(password) },
        { label: 'Special char', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const score = checks.filter(c => c.met).length;

    const levels = [
        { label: 'POOR', color: 'var(--color-text-muted)' },
        { label: 'WEAK', color: 'var(--color-crit-solid)' },
        { label: 'FAIR', color: 'var(--color-warn)' },
        { label: 'GOOD', color: 'var(--color-command)' },
        { label: 'STRONG', color: 'var(--color-safe)' },
        { label: 'VERY STRONG', color: 'var(--color-safe)' },
    ];

    return { score, ...levels[score], checks };
};

/* ── Username Validation ── */
const getUsernameError = (username) => {
    if (!username) return '';
    if (username.length < 3) return 'Must be 3+ characters';
    if (!/^[a-zA-Z]/.test(username)) return 'Must start with a letter';
    if (!USERNAME_REGEX.test(username)) return 'Invalid characters used';
    return '';
};

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');

        const newFieldErrors = { ...fieldErrors };
        if (name === 'username') {
            const usernameErr = getUsernameError(value);
            if (usernameErr) newFieldErrors.username = usernameErr;
            else delete newFieldErrors.username;
        }
        if (name === 'email') {
            if (value && !EMAIL_REGEX.test(value)) newFieldErrors.email = 'Invalid email format';
            else delete newFieldErrors.email;
        }
        setFieldErrors(newFieldErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        const usernameErr = getUsernameError(formData.username);
        if (usernameErr) errors.username = usernameErr;
        if (!EMAIL_REGEX.test(formData.email)) errors.email = 'Invalid email address';
        if (passwordStrength.score < 4) errors.password = 'Password is not strong enough';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please fix the highlighted errors before submitting.');
            return;
        }

        setFieldErrors({});
        setLoading(true);
        try {
            const response = await register(formData);
            if (response && response.success) {
                navigate('/login');
            } else {
                setError(response?.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Registration failed.';
            if (errorMsg.includes('Username already exists')) {
                setError('Username is already taken.');
            } else if (errorMsg.includes('Email already exists')) {
                setError('Email is already registered.');
            } else {
                setError(errorMsg);
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
                            <span className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-[var(--color-canvas)]">
                                Register
                            </span>
                        </div>
                        
                        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-canvas)] leading-[1.1] mb-6">
                            Create an Account.<br />
                            <span className="font-mono font-light text-[var(--color-signal)] text-2xl tracking-[0.1em] block mt-4">
                                Get Started Today
                            </span>
                        </h1>
                        <p className="font-mono text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">
                            Join our platform to create and manage your account easily.
                        </p>
                    </div>

                    <div className="font-mono text-[10px] text-[var(--color-text-muted)] p-4 border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] mt-12 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-command)]"></div>
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
                    <span className="font-mono text-xs font-bold tracking-[0.1em] text-[var(--color-canvas)]">Register</span>
                </div>

                <div className="w-full max-w-md relative">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]"
                    >
                        {/* Form Header */}
                        <div className="border-b border-[var(--color-border-subtle)] px-6 py-4 flex items-center justify-between bg-[var(--color-bg-elevated)]">
                            <h2 className="font-mono text-xs font-bold tracking-[0.1em] text-[var(--color-canvas)] flex items-center gap-2">
                                <UserPlus size={14} className="text-[var(--color-command)]" />
                                CREATE ACCOUNT
                            </h2>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-[var(--color-border-subtle)]" />
                                <div className="w-2 h-2 bg-[var(--color-border-subtle)]" />
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 sm:p-8">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-6"
                                    >
                                        <div className="p-3 flex items-start gap-2.5 text-xs font-mono"
                                            style={{
                                                background: 'var(--color-crit-bg)',
                                                color: 'var(--color-crit-text)',
                                                border: '1px solid var(--color-crit-solid)'
                                            }}>
                                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                            <span className="font-bold">{error}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* Email */}
                                <div>
                                    <label className="input-label" htmlFor="email">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`input-field pl-10 bg-[var(--color-bg-deep)] ${fieldErrors.email ? 'border-[var(--color-crit-solid)]' : ''}`}
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                    {fieldErrors.email && (
                                        <p className="text-[10px] mt-1.5 font-mono text-[var(--color-crit-solid)] uppercase tracking-wider">
                                            {fieldErrors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Username */}
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
                                            className={`input-field pl-10 bg-[var(--color-bg-deep)] ${fieldErrors.username ? 'border-[var(--color-crit-solid)]' : ''}`}
                                            placeholder="Username"
                                            required
                                        />
                                    </div>
                                    {fieldErrors.username ? (
                                        <p className="text-[10px] mt-1.5 font-mono text-[var(--color-crit-solid)] uppercase tracking-wider">
                                            {fieldErrors.username}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] mt-1.5 font-mono text-[var(--color-text-muted)]">
                                            Letters, numbers, and underscores. Starts with a letter.
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="input-label" htmlFor="password">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`input-field pl-10 pr-10 bg-[var(--color-bg-deep)] ${fieldErrors.password ? 'border-[var(--color-crit-solid)]' : ''}`}
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

                                    {/* Password Strength UI */}
                                    <AnimatePresence>
                                        {formData.password && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 overflow-hidden"
                                            >
                                                <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex-1 flex gap-[2px] h-1.5 bg-[var(--color-bg-deep)]">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <div key={i}
                                                                    className="flex-1 transition-all duration-200"
                                                                    style={{
                                                                        backgroundColor: i <= passwordStrength.score
                                                                            ? passwordStrength.color
                                                                            : 'transparent',
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-mono tracking-widest w-16 text-right" style={{ color: passwordStrength.color }}>
                                                            {passwordStrength.label}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                                                        {passwordStrength.checks.map((check, i) => (
                                                            <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono whitespace-nowrap"
                                                                style={{ color: check.met ? 'var(--color-safe)' : 'var(--color-text-muted)' }}>
                                                                <span>{check.met ? '[x]' : '[ ]'}</span>
                                                                {check.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                            Registering...
                                        </span>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Form Footer */}
                        <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] flex justify-between items-center text-xs font-mono">
                            <span className="text-[var(--color-text-muted)]">Already have an account?</span>
                            <Link to="/login" className="text-[var(--color-signal)] hover:text-white font-bold tracking-[0.1em]">
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Register;
