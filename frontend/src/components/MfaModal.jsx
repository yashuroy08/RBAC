import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ArrowRight, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../services/api';

const MfaModal = ({ isOpen, onClose, sessionId, onVerified }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Auto-focus the first input on open
    useEffect(() => {
        if (isOpen) {
            const firstInput = document.getElementById('otp-0');
            if (firstInput) firstInput.focus();
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');

        // Move focus to next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];
        pastedData.forEach((char, index) => {
            if (!isNaN(char)) {
                newOtp[index] = char;
            }
        });
        setOtp(newOtp);
        
        // Focus the last filled input or the first empty one
        const lastIndex = Math.min(pastedData.length, 5);
        const nextInput = document.getElementById(`otp-${lastIndex}`);
        if (nextInput) nextInput.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        
        if (otpString.length < 6) {
            setError('Please enter the full 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authAPI.verifyMfa({
                otp: otpString,
                sessionId: sessionId
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onVerified();
                    onClose();
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code. Please check your console/logs for the mock OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-card w-full max-w-md p-8 relative z-10 border-primary/20"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_var(--color-primary-glow)]">
                                {success ? <CheckCircle2 size={32} /> : <Smartphone size={32} />}
                            </div>
                            <h2 className="text-2xl font-semibold text-light-text mb-2">
                                {success ? 'Verified Successfully' : 'Verify Your Identity'}
                            </h2>
                            <p className="text-text-muted text-sm px-4">
                                {success 
                                    ? 'Your device is now trusted. Redirecting to dashboard...' 
                                    : 'A 6-digit verification code was sent to your email. Check backend logs for mock OTP.'}
                            </p>
                        </div>

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className="w-10 h-12 bg-slate-900/50 border border-slate-700/50 rounded-lg text-center text-xl font-bold text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2"
                                    >
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full h-12 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Verify & Trust Device
                                            <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="text-center text-sm text-text-muted">
                                    Didn't receive the code?{' '}
                                    <button
                                        type="button"
                                        className="text-primary hover:text-indigo-400 font-medium"
                                        onClick={() => {
                                            setError('Mock OTP reset. Check backend logs again.');
                                            // Optional: Trigger resend API
                                        }}
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-center gap-2 text-[10px] text-text-muted uppercase tracking-[0.2em]">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <span>Encrypted Security Verification</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MfaModal;
