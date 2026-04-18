import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Shield, ArrowRight, AlertCircle, MapPin } from 'lucide-react';
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
            const message = err.response?.data?.message || '';

            if (status === 403 && message.includes('outside the allowed login zone')) {
                setLocationError(true);
                setError(message);
            } else if (!err.response) {
                setError('Network error: Unable to connect to the server. This may be a CORS or connection issue.');
            } else {
                setError(err.response?.data?.message || 'Invalid credentials');
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
                <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
                    style={{ background: 'rgba(24, 95, 165, 0.08)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]"
                    style={{ background: 'rgba(83, 74, 183, 0.06)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Card */}
                <div className="glass-card p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-5"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-command) 0%, var(--color-signal) 100%)',
                                boxShadow: '0 0 24px var(--color-signal-glow)',
                            }}>
                            <Shield size={22} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-canvas tracking-tight mb-1">Secure Access</h1>
                        <p className="text-xs text-text-muted font-medium uppercase tracking-widest">RBAC Risk Evaluation System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 rounded-lg flex items-start gap-2.5 text-xs"
                                style={{
                                    background: locationError ? 'var(--color-warn-bg)' : 'var(--color-crit-bg)',
                                    color: locationError ? 'var(--color-warn-text)' : 'var(--color-crit-text)',
                                }}
                            >
                                {locationError ? <MapPin size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold">{error}</span>
                                    {locationError && (
                                        <span className="opacity-80">
                                            Your current location is outside the authorized zone. Contact your administrator.
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="username" className="input-label">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <User size={16} />
                                </span>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Enter your ID"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="input-field input-field-with-icon"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="input-label">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="input-field input-field-with-icon pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-canvas transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/reset-password" className="text-xs font-medium transition-colors"
                                style={{ color: 'var(--color-signal)' }}>
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-1" disabled={loading}>
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight size={14} /></>
                            )}
                        </button>

                        <div className="text-center mt-2 text-xs text-text-muted">
                            <span>New user? </span>
                            <Link to="/register" className="font-semibold text-canvas hover:text-signal transition-colors">
                                Create account
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer badge */}
                <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-md"
                        style={{
                            background: 'var(--color-safe-bg)',
                            color: 'var(--color-safe-text)',
                        }}>
                        <MapPin size={10} />
                        <span>Location-Verified Access</span>
                    </div>
                </div>
            </motion.div>

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
