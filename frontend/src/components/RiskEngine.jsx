import { Shield, AlertTriangle, Activity } from 'lucide-react';

const RiskEngine = ({ riskMetrics }) => {
    if (!riskMetrics) return null;

    const score = riskMetrics.riskScore ?? 0;
    const threshold = riskMetrics.riskThreshold ?? 70;

    // Traffic-light risk classification
    const getLevel = (s) => {
        if (s >= 70) return { label: 'CRITICAL', color: '#E24B4A', bg: 'var(--color-crit-bg)', text: 'var(--color-crit-text)', dotClass: 'status-dot-crit' };
        if (s >= 40) return { label: 'ELEVATED', color: '#BA7517', bg: 'var(--color-warn-bg)', text: 'var(--color-warn-text)', dotClass: 'status-dot-warn' };
        return { label: 'SAFE', color: '#639922', bg: 'var(--color-safe-bg)', text: 'var(--color-safe-text)', dotClass: 'status-dot-safe' };
    };

    const level = getLevel(score);

    const factors = riskMetrics.factors || [];
    const mfaRequired = riskMetrics.requiresMfa;

    // SVG gauge
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min((score / 100) * circumference, circumference);

    return (
        <div className="glass-card p-5 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(55, 138, 221, 0.10)' }}>
                        <Activity size={16} style={{ color: 'var(--color-signal)' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-canvas">Risk Assessment</h3>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">Adaptive Engine</p>
                    </div>
                </div>
                <span className="badge text-[10px]" style={{ background: level.bg, color: level.text }}>
                    <span className={`${level.dotClass} mr-1.5`} style={{ width: 5, height: 5, borderRadius: '50%', display: 'inline-block' }} />
                    {level.label}
                </span>
            </div>

            {/* Gauge + Score */}
            <div className="flex items-center justify-center">
                <div className="relative" style={{ width: 130, height: 130 }}>
                    <svg width="130" height="130" className="-rotate-90">
                        {/* Track */}
                        <circle cx="65" cy="65" r={radius}
                            fill="none" stroke="var(--color-midnight)" strokeWidth="8" />
                        {/* Threshold line (dotted) */}
                        <circle cx="65" cy="65" r={radius}
                            fill="none"
                            stroke="var(--color-text-muted)"
                            strokeWidth="1"
                            strokeDasharray={`${(threshold / 100) * circumference} ${circumference}`}
                            strokeLinecap="butt"
                            opacity="0.25"
                        />
                        {/* Progress */}
                        <circle cx="65" cy="65" r={radius}
                            fill="none"
                            stroke={level.color}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - progress}
                            strokeLinecap="round"
                            style={{
                                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s',
                                filter: score >= 70 ? `drop-shadow(0 0 6px ${level.color})` : 'none',
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold font-mono text-canvas">{score}</span>
                        <span className="text-[9px] uppercase tracking-widest text-text-muted font-semibold mt-0.5">/ 100</span>
                    </div>
                </div>
            </div>

            {/* Score Details */}
            <div className="flex items-center justify-between px-1 text-[11px]">
                <span className="text-text-muted">
                    Threshold: <span className="font-bold text-canvas font-mono">{threshold}</span>
                </span>
                <span className="text-text-muted">
                    MFA:{' '}
                    <span className="font-bold" style={{ color: mfaRequired ? 'var(--color-crit-solid)' : 'var(--color-safe)' }}>
                        {mfaRequired ? 'REQUIRED' : 'NOT REQUIRED'}
                    </span>
                </span>
            </div>

            {/* Risk Factors */}
            {factors.length > 0 && (
                <div className="pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <p className="sec-label flex items-center gap-1.5 mb-3">
                        <AlertTriangle size={10} />
                        Risk Factors
                    </p>
                    <div className="space-y-2">
                        {factors.map((factor, i) => {
                            const fLevel = getLevel(factor.score || score);
                            return (
                                <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-md"
                                    style={{ background: 'var(--color-bg-elevated)' }}>
                                    <span className="text-xs text-text-main">{factor.description || factor}</span>
                                    {factor.score !== undefined && (
                                        <span className="text-[10px] font-bold font-mono" style={{ color: fLevel.color }}>
                                            +{factor.score}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskEngine;
