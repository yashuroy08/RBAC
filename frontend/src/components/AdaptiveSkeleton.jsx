import React from 'react';
import { motion } from 'framer-motion';

const AdaptiveSkeleton = ({ 
    type = "generic", // 'card', 'list', 'generic', 'avatar', 'table-row'
    width,
    height,
    className = "",
    ...props 
}) => {
    // Base shimmer animation properties
    const shimmerAnimation = {
        backgroundPosition: ['100% 0', '-100% 0'],
        transition: {
            duration: 1.5,
            ease: "linear",
            repeat: Infinity
        }
    };

    const baseShimmerStyle = {
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        backgroundColor: 'var(--color-bg-elevated)',
    };

    // Render different skeleton structures based on type
    switch (type) {
        case 'card':
            return (
                <div 
                    className={`flex flex-col gap-4 p-4 rounded-xl border border-white/5 bg-bg-card w-full mb-4 ${className}`}
                    style={props.style}
                >
                    {/* Header: Avatar + Title */}
                    <div className="flex items-center gap-3">
                        <motion.div 
                            className="w-10 h-10 rounded-full shrink-0" 
                            style={baseShimmerStyle} animate={shimmerAnimation} 
                        />
                        <div className="flex flex-col gap-2 flex-1">
                            <motion.div className="h-3 w-1/3 rounded-sm" style={baseShimmerStyle} animate={shimmerAnimation} />
                            <motion.div className="h-2 w-1/4 rounded-sm" style={baseShimmerStyle} animate={shimmerAnimation} />
                        </div>
                    </div>
                    {/* Body: Lines of text */}
                    <div className="flex flex-col gap-2 mt-2">
                        <motion.div className="h-2 w-full rounded-sm" style={baseShimmerStyle} animate={shimmerAnimation} />
                        <motion.div className="h-2 w-5/6 rounded-sm" style={baseShimmerStyle} animate={shimmerAnimation} />
                        <motion.div className="h-2 w-2/3 rounded-sm" style={baseShimmerStyle} animate={shimmerAnimation} />
                    </div>
                    {/* Footer: Tags/Buttons */}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                        <motion.div className="h-6 w-16 rounded-md" style={baseShimmerStyle} animate={shimmerAnimation} />
                        <motion.div className="h-6 w-16 rounded-md" style={baseShimmerStyle} animate={shimmerAnimation} />
                    </div>
                </div>
            );

        case 'list':
        case 'table-row':
            return (
                <div 
                    className={`flex items-center gap-4 p-3 rounded-md w-full mb-2 ${className}`}
                    style={{ background: 'var(--color-bg-card)', ...props.style }}
                >
                    <motion.div className="w-8 h-8 rounded-full shrink-0" style={baseShimmerStyle} animate={shimmerAnimation} />
                    <div className="flex flex-col gap-2 flex-1">
                        <motion.div className="h-2.5 w-1/4 rounded-sm" style={baseShimmerStyle} animate={shimmerAnimation} />
                        <motion.div className="h-2 w-1/6 rounded-sm opacity-60" style={baseShimmerStyle} animate={shimmerAnimation} />
                    </div>
                    <motion.div className="h-6 w-20 rounded-md shrink-0" style={baseShimmerStyle} animate={shimmerAnimation} />
                </div>
            );

        case 'avatar':
            return (
                <motion.div 
                    className={`rounded-full shrink-0 ${className}`} 
                    style={{ ...baseShimmerStyle, width: width || '40px', height: height || '40px', ...props.style }} 
                    animate={shimmerAnimation} 
                />
            );

        case 'generic':
        default:
            return (
                <motion.div 
                    className={`rounded-md ${className}`} 
                    style={{ 
                        ...baseShimmerStyle, 
                        width: width || '100%', 
                        height: height || '1rem',
                        ...props.style 
                    }} 
                    animate={shimmerAnimation} 
                />
            );
    }
};

export default AdaptiveSkeleton;
