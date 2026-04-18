import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Lock, Mail, Eye, EyeOff, RefreshCcw, AlertCircle, CheckCircle, Check, X } from 'lucide-react';

const API_BASE_URL = '/api/auth';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

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

const ResetPassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(formData.newPassword), [formData.newPassword]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
        setSuccess('');

        // Real-time field validation
        const newFieldErrors = { ...fieldErrors };
        if (name === 'email') {
            if (value && !EMAIL_REGEX.test(value)) newFieldErrors.email = 'Please enter a valid email address';
            else delete newFieldErrors.email;
        }
        setFieldErrors(newFieldErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation gate
        const errors = {};
        if (!EMAIL_REGEX.test(formData.email)) errors.email = 'Please enter a valid email address';
        if (passwordStrength.score < 4) errors.password = 'Password must meet complexity requirements';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please fix the highlighted fields before submitting.');
            return;
        }

        setLoading(true);
        setError('');
        setFieldErrors({});

        try {
            const response = await axios.post(`${API_BASE_URL}/reset-password`, formData);
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative"
            style={{ background: 'var(--color-bg-deep)' }}>
            {/* Subtle ambient */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] rounded-full blur-[130px]"
                    style={{ background: 'rgba(55, 138, 221, 0.06)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-5"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-command) 0%, var(--color-signal) 100%)',
                                boxShadow: '0 0 24px var(--color-signal-glow)',
                            }}>
                            <RefreshCcw size={22} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-canvas tracking-tight mb-1">Reset Password</h1>
                        <p className="text-xs text-text-muted font-medium">Enter your email and a new password</p>
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

                            {success && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs my-1"
                                        style={{ background: 'var(--color-safe-bg)', color: 'var(--color-safe-text)' }}>
                                        <CheckCircle size={14} className="mt-0.5 shrink-0" />
                                        <span className="font-semibold">{success}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label htmlFor="email" className="input-label">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Mail size={16} />
                                </span>
                                <input
                                    type="email" id="email" name="email"
                                    placeholder="Your registered email"
                                    value={formData.email} onChange={handleChange} required
                                    className={`input-field input-field-with-icon ${fieldErrors.email ? 'border-crit-solid/50 bg-crit-bg/5' : ''}`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-[10px] text-crit-text mt-1 ml-1 flex items-center gap-1 font-medium">
                                    <AlertCircle size={10} /> {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="input-label font-bold flex justify-between items-center">
                                <span>New Password</span>
                                {passwordStrength.label && (
                                    <span style={{ color: passwordStrength.color }} className="text-[10px] uppercase font-bold tracking-wider">
                                        {passwordStrength.label}
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword" name="newPassword"
                                    placeholder="Enter new password"
                                    value={formData.newPassword} onChange={handleChange} required
                                    className={`input-field input-field-with-icon pr-10 ${fieldErrors.password ? 'border-crit-solid/50 bg-crit-bg/5' : ''}`}
                                />
                                <button type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-canvas transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                            
                            {/* Password Strength Indicators */}
                            <div className="mt-3 flex gap-1">
                                {[1, 2, 3, 4, 5].map((idx) => (
                                    <div
                                        key={idx}
                                        className="h-1 flex-1 rounded-full transition-all duration-500"
                                        style={{
                                            backgroundColor: idx <= passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,0.05)'
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-1.5">
                                {passwordStrength.checks.map((check, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${check.met ? 'bg-safe-bg text-safe-text' : 'bg-white/5 text-text-muted'}`}>
                                            {check.met ? <Check size={8} /> : <X size={8} />}
                                        </div>
                                        <span className={`text-[10px] ${check.met ? 'text-canvas' : 'text-text-muted'}`}>
                                            {check.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Update Password'}
                        </button>

                        <div className="text-center mt-2 text-xs text-text-muted">
                            <span>Remembered your password? </span>
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

export default ResetPassword;
