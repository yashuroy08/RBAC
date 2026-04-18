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
                        className="absolute inset-0"
                        style={{ background: 'rgba(8, 14, 24, 0.85)', backdropFilter: 'blur(8px)' }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        className="glass-card w-full max-w-md p-8 relative z-10"
                        style={{ borderColor: 'rgba(83, 74, 183, 0.20)' }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-5 top-5 text-text-muted hover:text-canvas transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-5"
                                style={{
                                    background: success
                                        ? 'linear-gradient(135deg, var(--color-safe) 0%, var(--color-safe-text) 100%)'
                                        : 'linear-gradient(135deg, var(--color-verified) 0%, var(--color-trusted) 100%)',
                                    boxShadow: success
                                        ? '0 0 24px rgba(99, 153, 34, 0.2)'
                                        : '0 0 24px rgba(83, 74, 183, 0.2)',
                                }}>
                                {success ? <CheckCircle2 size={24} className="text-white" /> : <Smartphone size={24} className="text-white" />}
                            </div>
                            <h2 className="text-xl font-bold text-canvas mb-1.5">
                                {success ? 'Verified Successfully' : 'Verify Your Identity'}
                            </h2>
                            <p className="text-xs text-text-muted px-4 leading-relaxed">
                                {success 
                                    ? 'Your device is now trusted. Redirecting to dashboard...' 
                                    : 'A 6-digit verification code was sent to your email. Check backend logs for mock OTP.'}
                            </p>
                        </div>

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-5">
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
                                            className="w-10 h-12 rounded-lg text-center text-lg font-bold font-mono text-canvas transition-all"
                                            style={{
                                                background: 'var(--color-bg-elevated)',
                                                border: digit ? '1.5px solid var(--color-verified)' : '1px solid var(--color-border-subtle)',
                                                boxShadow: digit ? '0 0 8px rgba(83, 74, 183, 0.15)' : 'none',
                                            }}
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg text-xs flex items-center gap-2"
                                        style={{ background: 'var(--color-crit-bg)', color: 'var(--color-crit-text)' }}
                                    >
                                        <AlertCircle size={14} />
                                        <span className="font-semibold">{error}</span>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn w-full h-11 flex items-center justify-center gap-2 text-white group"
                                    style={{ background: 'linear-gradient(135deg, var(--color-verified) 0%, var(--color-trusted) 100%)' }}
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Verify & Trust Device
                                            <ArrowRight size={14} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="text-center text-xs text-text-muted">
                                    Didn't receive the code?{' '}
                                    <button
                                        type="button"
                                        className="font-semibold transition-colors"
                                        style={{ color: 'var(--color-verified)' }}
                                        onClick={() => {
                                            setError('Mock OTP reset. Check backend logs again.');
                                        }}
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 pt-4 flex items-center justify-center gap-1.5 text-[10px] text-text-muted uppercase tracking-widest"
                            style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                            <ShieldCheck size={10} style={{ color: 'var(--color-safe)' }} />
                            <span>Encrypted Security Verification</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MfaModal;
