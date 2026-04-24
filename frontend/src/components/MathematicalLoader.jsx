import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_PHRASES = [
    "Preparing your workspace...",
    "Loading resources...",
    "Optimizing experience...",
    "Almost ready...",
    "Finalizing setup...",
    "Syncing data..."
];

const MathematicalLoader = ({ text = "Loading, please wait", fullScreen = true, phrases = DEFAULT_PHRASES }) => {
    const [phraseIndex, setPhraseIndex] = useState(0);

    // Cycle through status phrases
    useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [phrases.length]);

    const displayMetadata = phrases[phraseIndex];

    return (
        <div className={`flex flex-col items-center justify-center w-full ${fullScreen ? 'min-h-screen fixed top-0 left-0 z-50' : 'h-full min-h-[300px]'} p-8`} style={{ background: 'var(--color-bg-deep, #0f172a)' }}>
            
            <div className="relative flex flex-col items-center">
                {/* Modern Spinning Rings */}
                <div className="relative w-28 h-28 mb-10 flex items-center justify-center">
                    {/* Outer Ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500/80"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}
                    />
                    {/* Middle Ring */}
                    <motion.div
                        className="absolute inset-3 rounded-full border-b-2 border-l-2 border-indigo-400/80"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }}
                    />
                    {/* Inner Ring */}
                    <motion.div
                        className="absolute inset-6 rounded-full border-t-2 border-l-2 border-purple-500/80"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))' }}
                    />
                    
                    {/* Center Core */}
                    <motion.div 
                        className="w-4 h-4 rounded-full bg-blue-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ boxShadow: '0 0 15px rgba(96, 165, 250, 0.8)' }}
                    />
                </div>

                {/* Glassmorphic Text Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col items-center bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl py-6 px-10 shadow-2xl"
                >
                    <h2 className="text-xl font-semibold text-slate-100 tracking-wide mb-1 flex items-center">
                        {text}
                        <motion.span 
                            animate={{ opacity: [0, 1, 0] }} 
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-4 inline-block text-left"
                        >
                           ...
                        </motion.span>
                    </h2>
                    
                    <div className="h-6 mt-2 relative w-full flex justify-center items-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={displayMetadata}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="text-sm font-medium text-blue-300/80 text-center tracking-wide"
                            >
                                {displayMetadata}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Indeterminate Progress Indicator */}
                    <div className="w-56 h-1.5 bg-slate-700/50 rounded-full mt-6 overflow-hidden">
                        <motion.div 
                            className="h-full w-1/3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                            animate={{ x: ["-100%", "300%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MathematicalLoader;
