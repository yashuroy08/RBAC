import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_PHRASES = [
    "Computing State...",
    "Securing Connection...",
    "Establishing Identity Matrix...",
    "Verifying Encrypted Tokens...",
    "Loading Protocol Access Policies..."
];

const MathematicalLoader = ({ text = "Computing State...", fullScreen = true }) => {
    const [phraseIndex, setPhraseIndex] = useState(0);

    // Cycle through loading phrases if default text is used
    useEffect(() => {
        if (text !== "Computing State...") return;
        
        const interval = setInterval(() => {
            setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [text]);

    const displayText = text !== "Computing State..." ? text : LOADING_PHRASES[phraseIndex];

    return (
        <div className={`flex flex-col items-center justify-center w-full ${fullScreen ? 'min-h-screen fixed top-0 left-0 z-50' : 'h-full min-h-[300px]'} p-8`} style={{ background: 'var(--color-bg-deep)' }}>
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Math Symbol Center */}
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="absolute z-10 font-bold text-2xl italic tracking-wider"
                    style={{ 
                        color: 'var(--color-signal)',
                        fontFamily: 'serif',
                        textShadow: '0 0 15px var(--color-signal-glow)'
                    }}
                >
                    &int;
                </motion.div>

                {/* Orbital Paths (Lissajous curves) */}
                <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0 overflow-visible">
                    <motion.path
                        d="M 50,10 C 90,10 90,90 50,90 C 10,90 10,10 50,10 Z"
                        fill="none"
                        stroke="var(--color-command)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, rotate: 0 }}
                        animate={{ pathLength: 1, rotate: 360 }}
                        transition={{ 
                            pathLength: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
                            rotate: { duration: 8, ease: "linear", repeat: Infinity }
                        }}
                        style={{ transformOrigin: '50% 50%' }}
                    />
                    <motion.path
                        d="M 10,50 C 10,90 90,90 90,50 C 90,10 10,10 10,50 Z"
                        fill="none"
                        stroke="var(--color-signal)"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeDasharray="4 4"
                        initial={{ pathLength: 0, rotate: 0 }}
                        animate={{ pathLength: 1, rotate: -360 }}
                        transition={{ 
                            pathLength: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
                            rotate: { duration: 10, ease: "linear", repeat: Infinity }
                        }}
                        style={{ transformOrigin: '50% 50%' }}
                    />
                    
                    {/* Orbiting Particle 1 */}
                    <motion.circle
                        r="3"
                        fill="var(--color-signal)"
                        style={{ filter: 'drop-shadow(0 0 4px var(--color-signal))' }}
                        animate={{
                            cx: [50, 85, 50, 15, 50],
                            cy: [15, 50, 85, 50, 15]
                        }}
                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    />
                    {/* Orbiting Particle 2 */}
                    <motion.circle
                        r="2.5"
                        fill="var(--color-command)"
                        style={{ filter: 'drop-shadow(0 0 4px var(--color-command))' }}
                        animate={{
                            cx: [85, 50, 15, 50, 85],
                            cy: [50, 85, 50, 15, 50]
                        }}
                        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                    />
                </svg>

                {/* Sub-orbital rings */}
                <motion.div 
                    className="absolute w-24 h-24 rounded-full border border-white/5"
                    animate={{ rotateX: 360, rotateY: 180 }}
                    transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                />
                 <motion.div 
                    className="absolute w-20 h-20 rounded-full border border-white/10"
                    animate={{ rotateX: -180, rotateY: 360 }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                />
            </div>

            {/* Typography */}
            <motion.div 
                className="mt-8 flex flex-col items-center h-16"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={displayText}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 h-6"
                    >
                        <span className="text-[11px] font-mono tracking-[0.2em] text-signal uppercase flex items-center">
                            {displayText}
                            <motion.span 
                                animate={{ opacity: [0, 1, 0] }} 
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="ml-1"
                            >
                               _
                            </motion.span>
                        </span>
                    </motion.div>
                </AnimatePresence>
                <div className="text-[9px] font-mono text-text-muted/50 mt-3 flex gap-3">
                    <span>f(x) = lim(n→∞)</span>
                    <span>Σ(i=1)ⁿ</span>
                </div>
            </motion.div>
        </div>
    );
};

export default MathematicalLoader;
