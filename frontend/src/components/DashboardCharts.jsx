import { useMemo, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell,
    RadialBarChart, RadialBar, PieChart, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3, Shield, Target, Calendar } from 'lucide-react';

/* ──────────────────────────────────────────────
   Custom Tooltip (shared across charts)
   ────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="px-3 py-2 rounded-lg text-xs shadow-xl border"
            style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-main)',
            }}>
            <p className="font-mono text-text-muted text-[10px] mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="font-bold" style={{ color: entry.color }}>
                    {entry.name}: {typeof entry.value === 'number' ? Math.round(entry.value) : entry.value}{suffix}
                </p>
            ))}
        </div>
    );
};

const RangeSelector = ({ value, onChange, options }) => (
    <div className="flex bg-midnight/30 p-0.5 rounded-lg border border-border-subtle">
        {options.map((opt) => (
            <button
                key={opt.val}
                onClick={() => onChange(opt.val)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                    value === opt.val 
                        ? 'bg-signal text-white shadow-sm' 
                        : 'text-text-muted hover:text-canvas hover:bg-white/[0.04]'
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

/* ──────────────────────────────────────────────
   1. Risk Score Timeline (Area Chart)
   ────────────────────────────────────────────── */
export const RiskTimeline = ({ riskEvents = [], riskHistory = [], currentScore = 0, timeRange: propRange }) => {
    const [localRange, setLocalRange] = useState('hours');
    const range = propRange || localRange;

    const chartData = useMemo(() => {
        // Use real backend data when available
        if (riskHistory && riskHistory.length > 0) {
            return riskHistory;
        }

        // If riskEvents are available, map them
        if (riskEvents && riskEvents.length > 0) {
            const sorted = [...riskEvents].sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
            return sorted.map(event => ({
                time: new Date(event.eventTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
                score: Math.round(event.riskScore || 0),
                threshold: 70,
            }));
        }

        // No data available — return empty array (shows empty state)
        return [];
    }, [riskEvents, riskHistory, range]);

    const trend = useMemo(() => {
        if (chartData.length < 2) return { direction: 'flat', delta: 0 };
        const first = chartData[0].score;
        const last = chartData[chartData.length - 1].score;
        const delta = last - first;
        return { direction: delta > 3 ? 'up' : delta < -3 ? 'down' : 'flat', delta: Math.abs(delta) };
    }, [chartData]);

    const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
    const trendColor = trend.direction === 'up' ? 'var(--color-crit-solid)' : trend.direction === 'down' ? 'var(--color-safe)' : 'var(--color-text-muted)';

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 size={14} style={{ color: 'var(--color-signal)' }} />
                    <span className="text-sm font-bold text-canvas">Risk Timeline</span>
                </div>
                {!propRange && (
                    <RangeSelector 
                        value={localRange} 
                        onChange={setLocalRange} 
                        options={[
                            { label: 'H', val: 'hours' },
                            { label: 'D', val: 'days' },
                            { label: 'W', val: 'weeks' },
                            { label: 'M', val: 'months' }
                        ]}
                    />
                )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: trendColor }}>
                <TrendIcon size={12} />
                {trend.direction === 'flat' ? 'System Stable' : `${trend.delta}pts ${trend.direction}`}
            </div>

            {chartData.length > 0 ? (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={1}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#378ADD" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="thresholdGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#E24B4A" stopOpacity={0.08} />
                                <stop offset="95%" stopColor="#E24B4A" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                        />
                        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip suffix="%" />} />
                        <Area type="monotone" dataKey="threshold" stroke="#E24B4A" strokeWidth={1} strokeDasharray="4 4" fill="url(#thresholdGradient)" name="Threshold" dot={false} />
                        <Area type="monotone" dataKey="score" stroke="#378ADD" strokeWidth={2} fill="url(#riskGradient)" name="Risk Score" dot={{ r: 3, fill: '#378ADD', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#378ADD', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                    <Shield size={28} className="opacity-20 mb-2" />
                    <p className="text-xs">No risk events recorded yet</p>
                    <p className="text-[10px] opacity-60">Data will appear as the system evaluates login activity</p>
                </div>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────────
   2. Session Activity Bar Chart
   ────────────────────────────────────────────── */
export const SessionActivityChart = ({ sessions = [], timeRange: propRange }) => {
    const [localRange, setLocalRange] = useState('hours');
    const range = propRange || localRange;

    const chartData = useMemo(() => {
        // Use real backend data when available
        if (sessions && sessions.length > 0) {
            return sessions;
        }

        // No data — return empty array (shows empty state)
        return [];
    }, [sessions, range]);

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: 'var(--color-signal)' }} />
                    <span className="text-sm font-bold text-canvas">Session Activity</span>
                </div>
                {!propRange && (
                    <RangeSelector 
                        value={localRange} 
                        onChange={setLocalRange} 
                        options={[
                            { label: 'H', val: 'hours' },
                            { label: 'D', val: 'days' },
                            { label: 'W', val: 'weeks' },
                            { label: 'M', val: 'months' }
                        ]}
                    />
                )}
            </div>
            {chartData.length > 0 ? (
            <>
            <div style={{ width: '100%', height: 160, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={1}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="active" name="Active" fill="#378ADD" radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="closed" name="Closed" fill="rgba(136,135,128,0.4)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted uppercase tracking-widest font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#378ADD' }} /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(136,135,128,0.4)' }} /> Closed</span>
            </div>
            </>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                    <Target size={28} className="opacity-20 mb-2" />
                    <p className="text-xs">No session activity recorded yet</p>
                    <p className="text-[10px] opacity-60">Data will populate as users log in</p>
                </div>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────────
   3. Risk Factors Breakdown (Horizontal Bar)
   ────────────────────────────────────────────── */
export const RiskFactorsBreakdown = ({ factors = [] }) => {
    const getBarColor = (score) => {
        if (score >= 30) return '#E24B4A';
        if (score >= 15) return '#BA7517';
        return '#639922';
    };

    if (!factors || factors.length === 0) {
        return (
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={14} style={{ color: 'var(--color-signal)' }} />
                    <span className="text-sm font-bold text-canvas">Risk Factors</span>
                </div>
                <div className="py-6 flex flex-col items-center text-xs text-text-muted">
                    <Shield size={24} className="opacity-30 mb-2" />
                    No active risk factors — all clear
                </div>
            </div>
        );
    }

    const maxScore = Math.max(...factors.map(f => f.score || 0), 50);

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <Shield size={14} style={{ color: 'var(--color-signal)' }} />
                <span className="text-sm font-bold text-canvas">Risk Factors</span>
            </div>
            <div className="space-y-3">
                {factors.map((factor, i) => {
                    const score = factor.score || 0;
                    const pct = Math.max((score / maxScore) * 100, 4);
                    return (
                        <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-text-main truncate pr-3">
                                    {factor.description || 'Unknown factor'}
                                </span>
                                <span className="text-xs font-bold font-mono shrink-0"
                                    style={{ color: getBarColor(score) }}>
                                    +{score}
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'var(--color-midnight)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${pct}%`,
                                        background: getBarColor(score),
                                        boxShadow: score >= 30 ? `0 0 8px ${getBarColor(score)}40` : 'none',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   4. Security Posture Ring
   ────────────────────────────────────────────── */
export const SecurityPosture = ({ riskScore = 0, activeSessions = 0, trustedDevices = 0, mfaRequired = false }) => {
    // Calculate an overall "health" score (inverse of risk)
    const healthScore = 100 - riskScore;
    const deviceTrust = trustedDevices > 0 ? 100 : 0;
    const mfaStatus = mfaRequired ? 40 : 100; // Low if MFA is needed (meaning risk is high)

    const data = [
        { name: 'Health', value: healthScore, fill: '#639922' },
        { name: 'Device Trust', value: deviceTrust, fill: '#378ADD' },
        { name: 'MFA Status', value: mfaStatus, fill: '#534AB7' },
    ];

    const overallHealth = Math.round((healthScore + deviceTrust + mfaStatus) / 3);
    const getHealthLabel = (v) => v >= 75 ? 'STRONG' : v >= 45 ? 'MODERATE' : 'WEAK';
    const getHealthColor = (v) => v >= 75 ? 'var(--color-safe)' : v >= 45 ? 'var(--color-warn)' : 'var(--color-crit-solid)';

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
                <Shield size={14} style={{ color: 'var(--color-signal)' }} />
                <span className="text-sm font-bold text-canvas">Security Posture</span>
            </div>
            <div className="flex items-center gap-4">
                <div style={{ width: 110, height: 110, minWidth: 110 }} className="shrink-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                        <RadialBarChart
                            innerRadius="35%"
                            outerRadius="100%"
                            data={data}
                            startAngle={180}
                            endAngle={0}
                            barSize={8}
                        >
                            <RadialBar
                                background={{ fill: 'rgba(255,255,255,0.04)' }}
                                dataKey="value"
                                cornerRadius={4}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5">
                    <div>
                        <span className="text-2xl font-extrabold font-mono" style={{ color: getHealthColor(overallHealth) }}>
                            {overallHealth}%
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-bold ml-2"
                            style={{ color: getHealthColor(overallHealth) }}>
                            {getHealthLabel(overallHealth)}
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {data.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                                <span className="text-text-muted">{d.name}</span>
                                <span className="font-bold font-mono text-canvas ml-auto">{d.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
