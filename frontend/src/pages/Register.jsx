import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Eye, EyeOff, UserPlus, ArrowRight, AlertCircle, Check, X } from 'lucide-react';

/* ── Validation Constants (mirroring backend) ── */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]{2,49}$/;

/* ── Password Strength Logic ── */
const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '', checks: [] };

    const checks = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
        { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
        { label: 'Number (0-9)', met: /[0-9]/.test(password) },
        { label: 'Special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const score = checks.filter(c => c.met).length;

    const levels = [
        { label: '', color: '' },
        { label: 'Very Weak', color: '#E24B4A' },
        { label: 'Weak', color: '#BA7517' },
        { label: 'Fair', color: '#BA7517' },
        { label: 'Strong', color: '#639922' },
        { label: 'Very Strong', color: '#3B6D11' },
    ];

    return { score, ...levels[score], checks };
};

/* ── Username Validation ── */
const getUsernameError = (username) => {
    if (!username) return '';
    if (username.length < 3) return 'Must be at least 3 characters';
    if (!/^[a-zA-Z]/.test(username)) return 'Must start with a letter';
    if (!USERNAME_REGEX.test(username)) return 'Only letters, numbers, dots, underscores, and hyphens are allowed';
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

        // Real-time field validation
        const newFieldErrors = { ...fieldErrors };
        if (name === 'username') {
            const usernameErr = getUsernameError(value);
            if (usernameErr) newFieldErrors.username = usernameErr;
            else delete newFieldErrors.username;
        }
        if (name === 'email') {
            if (value && !EMAIL_REGEX.test(value)) newFieldErrors.email = 'Please enter a valid email address';
            else delete newFieldErrors.email;
        }
        setFieldErrors(newFieldErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation gate
        const errors = {};
        const usernameErr = getUsernameError(formData.username);
        if (usernameErr) errors.username = usernameErr;
        if (!EMAIL_REGEX.test(formData.email)) errors.email = 'Please enter a valid email address';
        if (passwordStrength.score < 4) errors.password = 'Password must meet all strength requirements below';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please fix the highlighted fields before submitting.');
            return;
        }

        setFieldErrors({});
        setLoading(true);
        try {
            const response = await register(formData);
            if (response && response.success) {
                navigate('/login');
            } else {
                setError(response?.message || 'Registration failed');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Registration failed';
            if (errorMsg.includes('Username already exists')) {
                setError('This username is already taken. Please choose another.');
            } else if (errorMsg.includes('Email already exists')) {
                setError('This email is already registered. Try logging in.');
            } else {
                setError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative"
            style={{ background: 'var(--color-bg-deep)' }}>
            {/* Subtle ambient */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full blur-[140px]"
                    style={{ background: 'rgba(83, 74, 183, 0.08)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-sm relative z-10 my-8"
            >
                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-5"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-verified) 0%, var(--color-pending-text) 100%)',
                                boxShadow: '0 0 24px rgba(83, 74, 183, 0.15)',
                            }}>
                            <UserPlus size={22} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-canvas tracking-tight mb-1">Create Account</h1>
                        <p className="text-xs text-text-muted font-medium uppercase tracking-widest">Join the Secure RBAC System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs my-1"
                                        style={{ background: 'var(--color-crit-bg)', color: 'var(--color-crit-text)' }}>
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span className="font-semibold">{error}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="input-label">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Mail size={16} />
                                </span>
                                <input
                                    type="email" id="email" name="email"
                                    placeholder="john@example.com"
                                    value={formData.email} onChange={handleChange} required
                                    className={`input-field input-field-with-icon ${fieldErrors.email ? 'ring-1 ring-crit-solid' : ''}`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-[10px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: 'var(--color-crit-solid)' }}>
                                    <AlertCircle size={10} /> {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="input-label">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <User size={16} />
                                </span>
                                <input
                                    type="text" id="username" name="username"
                                    placeholder="your_username"
                                    value={formData.username} onChange={handleChange} required
                                    className={`input-field input-field-with-icon ${fieldErrors.username ? 'ring-1 ring-crit-solid' : ''}`}
                                />
                            </div>
                            {fieldErrors.username && (
                                <p className="text-[10px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: 'var(--color-crit-solid)' }}>
                                    <AlertCircle size={10} /> {fieldErrors.username}
                                </p>
                            )}
                            {!fieldErrors.username && formData.username && (
                                <p className="text-[10px] mt-1.5 font-medium text-text-muted">
                                    Letters, numbers, dots, underscores, hyphens. Must start with a letter.
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="input-label">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password" name="password"
                                    placeholder="••••••••"
                                    value={formData.password} onChange={handleChange} required
                                    className="input-field input-field-with-icon pr-10"
                                />
                                <button type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-canvas transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            <AnimatePresence>
                                {formData.password && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mt-3"
                                    >
                                        <div className="rounded-lg p-3 border"
                                            style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
                                            {/* Strength Bar */}
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <div className="flex-1 flex gap-0.5 h-1 rounded-full overflow-hidden">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <div key={i}
                                                            className="flex-1 transition-all duration-300"
                                                            style={{
                                                                backgroundColor: i <= passwordStrength.score
                                                                    ? passwordStrength.color
                                                                    : 'var(--color-midnight)',
                                                                borderRadius: '2px',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider w-20 text-right"
                                                    style={{ color: passwordStrength.color }}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>

                                            {/* Requirement Checks */}
                                            <div className="space-y-1.5">
                                                {passwordStrength.checks.map((check, i) => (
                                                    <div key={i}
                                                        className="flex items-center gap-1.5 text-[11px] transition-colors duration-300"
                                                        style={{ color: check.met ? 'var(--color-safe)' : 'var(--color-text-muted)' }}>
                                                        {check.met ? <Check size={12} /> : <X size={12} />}
                                                        <span>{check.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Register <ArrowRight size={14} /></>
                            )}
                        </button>

                        <div className="text-center mt-2 text-xs text-text-muted">
                            <span>Already have an account? </span>
                            <Link to="/login" className="font-semibold text-canvas hover:text-signal transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
