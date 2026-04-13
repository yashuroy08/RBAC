import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, MapPin } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_var(--color-primary-glow)]">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-semibold text-light-text tracking-tight mb-2">Secure Access</h1>
                    <p className="text-text-muted">RBAC Risk Evaluation System</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-4 rounded-xl flex items-start gap-3 text-sm ${locationError ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}
                        >
                            {locationError ? <MapPin size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                            <div className="flex flex-col">
                                <span className="font-medium">{error}</span>
                                {locationError && (
                                    <span className="text-amber-500/80 mt-1">
                                        Your current location is outside the authorized zone. Contact your administrator.
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}

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
                    </div>

                    <div className="flex justify-end pt-1">
                        <Link to="/reset-password" className="text-sm font-medium text-primary hover:text-indigo-400 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </button>

                    <div className="text-center mt-4 text-sm text-text-muted">
                        <span>New user? </span>
                        <Link to="/register" className="font-medium text-white hover:text-primary transition-colors">
                            Create account
                        </Link>
                    </div>
                </form>
            </motion.div>

            <div className="absolute bottom-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400/80 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20 backdrop-blur-sm">
                <MapPin size={14} />
                <span>Location-Verified Access</span>
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
