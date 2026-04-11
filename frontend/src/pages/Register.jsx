import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Eye, EyeOff, UserPlus, ArrowRight, AlertCircle, Check, X } from 'lucide-react';

/* ── Password Strength Logic ── */
const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '', checks: [] };

    const checks = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Number', met: /[0-9]/.test(password) },
        { label: 'Special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const score = checks.filter(c => c.met).length;

    const levels = [
        { label: '', color: '' },
        { label: 'Very Weak', color: '#ef4444' }, // red-500
        { label: 'Weak', color: '#f97316' }, // orange-500
        { label: 'Fair', color: '#eab308' }, // yellow-500
        { label: 'Strong', color: '#22c55e' }, // green-500
        { label: 'Very Strong', color: '#10b981' }, // emerald-500
    ];

    return { score, ...levels[score], checks };
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
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (passwordStrength.score < 3) {
            setError('Password is too weak. Please make it stronger.');
            return;
        }

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
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="glass-card w-full max-w-md p-8 relative z-10 my-8"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_var(--color-primary-glow)]">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account</h1>
                    <p className="text-text-muted">Join the Secure RBAC System</p>
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
                                <div className="p-4 rounded-xl flex items-start gap-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 my-2">
                                    <AlertCircle size={18} className="mt-0.5 shrink-0" /> 
                                    <span className="font-medium">{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div>
                        <label htmlFor="email" className="input-label">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-primary">
                                <Mail size={20} />
                            </span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="input-field input-field-with-icon peer"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="input-label">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-primary">
                                <User size={20} />
                            </span>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Enter your ID"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="input-field input-field-with-icon peer"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="input-label">Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-primary">
                                <Lock size={20} />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="input-field input-field-with-icon pr-12 peer"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>

                        {/* Password Strength Checker */}
                        <AnimatePresence>
                            {formData.password && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mt-3"
                                >
                                    <div className="bg-slate-900/50 rounded-xl p-4 border border-border-subtle">
                                        {/* Strength Bar */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 transition-all duration-300 bg-slate-800"
                                                        style={{
                                                            backgroundColor: i <= passwordStrength.score ? passwordStrength.color : undefined,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider w-20 text-right" style={{ color: passwordStrength.color }}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>

                                        {/* Requirement Checks */}
                                        <div className="space-y-2">
                                            {passwordStrength.checks.map((check, i) => (
                                                <div key={i} className={`flex items-center gap-2 text-xs transition-colors duration-300 ${check.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                    {check.met ? <Check size={14} /> : <X size={14} />}
                                                    <span>{check.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Register <ArrowRight size={18} /></>
                        )}
                    </button>

                    <div className="text-center mt-4 text-sm text-text-muted">
                        <span>Already have an account? </span>
                        <Link to="/login" className="font-medium text-white hover:text-primary transition-colors">
                            Sign In
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
