import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import { MapPin, Save, ToggleLeft, ToggleRight, Trash2, RefreshCw, Navigation, AlertTriangle, Shield, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationSettings = () => {
    const [config, setConfig] = useState(null);
    const [allConfigs, setAllConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        centerLatitude: '',
        centerLongitude: '',
        radiusKm: '1',
        locationName: '',
        enabled: true,
    });

    // Leaflet refs
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const circleRef = useRef(null);

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: true,
        });

        // Dark tile layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Click handler
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setFormData(prev => ({
                ...prev,
                centerLatitude: lat.toFixed(6),
                centerLongitude: lng.toFixed(6),
            }));
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update marker + circle when form coordinates change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const lat = parseFloat(formData.centerLatitude);
        const lng = parseFloat(formData.centerLongitude);
        const radiusKm = parseFloat(formData.radiusKm);

        if (isNaN(lat) || isNaN(lng)) return;

        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
        if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }

        markerRef.current = L.marker([lat, lng]).addTo(map);

        const radius = isNaN(radiusKm) || radiusKm <= 0 ? 1000 : radiusKm * 1000;
        circleRef.current = L.circle([lat, lng], {
            radius,
            color: '#378ADD',
            fillColor: '#378ADD',
            fillOpacity: 0.12,
            weight: 2,
        }).addTo(map);

        map.fitBounds(circleRef.current.getBounds(), { padding: [30, 30] });
    }, [formData.centerLatitude, formData.centerLongitude, formData.radiusKm]);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const [activeRes, allRes] = await Promise.all([
                adminAPI.getActiveLocationConfig(),
                adminAPI.getAllLocationConfigs(),
            ]);

            const activeConfig = activeRes.data.data;
            const configs = allRes.data.data || [];

            setConfig(activeConfig);
            setAllConfigs(configs);

            if (activeConfig) {
                setFormData({
                    id: activeConfig.id,
                    centerLatitude: activeConfig.centerLatitude?.toString() || '',
                    centerLongitude: activeConfig.centerLongitude?.toString() || '',
                    radiusKm: activeConfig.radiusKm?.toString() || '1',
                    locationName: activeConfig.locationName || '',
                    enabled: activeConfig.enabled,
                });
            }
        } catch (error) {
            console.error('Error fetching location configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.centerLatitude || !formData.centerLongitude || !formData.radiusKm) {
            showMessage('Please fill all required fields or click on the map to set location', 'danger');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                id: formData.id || null,
                centerLatitude: parseFloat(formData.centerLatitude),
                centerLongitude: parseFloat(formData.centerLongitude),
                radiusKm: parseFloat(formData.radiusKm),
                locationName: formData.locationName,
                enabled: formData.enabled,
            };

            const response = await adminAPI.saveLocationConfig(payload);
            if (response.data.success) {
                showMessage('Location configuration saved successfully!', 'success');
                fetchConfigs();
            }
        } catch (error) {
            showMessage('Error saving configuration', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (configId, currentEnabled) => {
        try {
            await adminAPI.toggleLocationRestriction(configId, !currentEnabled);
            showMessage(`Location restriction ${!currentEnabled ? 'enabled' : 'disabled'}`, 'success');
            fetchConfigs();
        } catch (error) {
            showMessage('Error toggling restriction', 'danger');
        }
    };

    const handleDelete = async (configId) => {
        if (!window.confirm('Delete this location configuration?')) return;
        try {
            await adminAPI.deleteLocationConfig(configId);
            showMessage('Configuration deleted', 'success');
            setFormData({
                centerLatitude: '',
                centerLongitude: '',
                radiusKm: '1',
                locationName: '',
                enabled: true,
            });
            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
            if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }
            fetchConfigs();
        } catch (error) {
            showMessage('Error deleting configuration', 'danger');
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            showMessage('Geolocation not supported by this browser', 'danger');
            return;
        }

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            showMessage('⚠️ Location access requires HTTPS or localhost.', 'warning');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setFormData(prev => ({
                    ...prev,
                    centerLatitude: lat.toFixed(6),
                    centerLongitude: lng.toFixed(6),
                }));
                showMessage('Current location set as center', 'success');
            },
            (error) => {
                let msg = 'Could not get location';
                if (error.code === 1) msg = 'Location permission denied';
                if (error.code === 2) msg = 'Location unavailable';
                if (error.code === 3) msg = 'Location request timed out';
                if (error.message.includes('secure origin')) {
                    msg = 'Browser blocked location (requires HTTPS/localhost)';
                }
                showMessage(msg, 'danger');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleNewConfig = () => {
        setFormData({
            centerLatitude: '',
            centerLongitude: '',
            radiusKm: '1',
            locationName: '',
            enabled: true,
        });
        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
        if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat).toFixed(6);
                const lon = parseFloat(data[0].lon).toFixed(6);
                setFormData(prev => ({ ...prev, centerLatitude: lat, centerLongitude: lon }));
                showMessage('Location found', 'success');
                if (mapRef.current) {
                    mapRef.current.setView([lat, lon], 12);
                }
            } else {
                showMessage('Location not found', 'danger');
            }
        } catch (error) {
            showMessage('Error searching location', 'danger');
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl mx-auto flex flex-col gap-5"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg" style={{ background: 'rgba(55, 138, 221, 0.12)', color: 'var(--color-signal)' }}>
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-canvas m-0 mb-0.5">Location Restriction</h2>
                        <p className="text-[11px] text-text-muted m-0">Configure the allowed login zone for regular users.</p>
                    </div>
                </div>
                <div>
                    {config ? (
                        <span className={`badge text-[10px] ${config.enabled ? 'badge-success' : ''}`}
                            style={!config.enabled ? { background: 'rgba(136, 135, 128, 0.12)', color: 'var(--color-text-muted)' } : {}}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${config.enabled ? 'bg-safe' : ''}`}
                                style={!config.enabled ? { border: '1px solid var(--color-text-muted)' } : {}} />
                            {config.enabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    ) : (
                        <span className="badge" style={{ background: 'rgba(136, 135, 128, 0.12)', color: 'var(--color-text-muted)' }}>
                            NOT CONFIGURED
                        </span>
                    )}
                </div>
            </div>

            {/* Alert */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold"
                        style={{
                            background: message.type === 'danger' ? 'var(--color-crit-bg)' : 'var(--color-safe-bg)',
                            color: message.type === 'danger' ? 'var(--color-crit-text)' : 'var(--color-safe-text)',
                        }}
                    >
                        {message.type === 'danger' ? <AlertTriangle size={14} /> : <Shield size={14} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Map Section */}
                <div className="glass-card flex flex-col h-[400px] lg:col-span-3 lg:h-[520px] overflow-hidden p-0 relative">
                    <div className="absolute top-0 inset-x-0 z-[1000] p-3 border-b flex flex-col gap-2"
                        style={{
                            background: 'rgba(12, 20, 32, 0.92)',
                            backdropFilter: 'blur(12px)',
                            borderColor: 'var(--color-border-subtle)',
                        }}>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="flex items-center gap-2 text-xs text-canvas font-bold m-0">
                                <MapPin size={14} style={{ color: 'var(--color-signal)' }} /> Map View
                            </h3>
                            <span className="text-[10px] text-text-muted hidden sm:inline">Click to set point</span>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search city or address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field py-1.5 text-xs"
                            />
                            <button type="submit" className="btn btn-primary px-3 py-1.5 text-[11px] whitespace-nowrap">
                                <Search size={12} /> <span className="hidden sm:inline">Search</span>
                            </button>
                        </form>
                    </div>
                    <div className="flex-1 w-full z-0 h-full [&>.leaflet-container]:h-full [&>.leaflet-container]:!bg-bg-deep" ref={mapContainerRef}></div>
                    <div className="absolute bottom-4 inset-x-0 z-[1000] px-4 text-center pointer-events-none">
                        <button onClick={handleUseCurrentLocation}
                            className="btn btn-secondary text-[11px] py-1.5 px-3 pointer-events-auto shadow-md">
                            <Navigation size={12} /> Use My Location
                        </button>
                    </div>
                </div>

                {/* Config Form */}
                <div className="glass-card overflow-y-auto p-5 lg:col-span-2 lg:h-[520px] flex flex-col"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-midnight) transparent' }}>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-canvas mb-4 pb-3"
                        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <Save size={14} style={{ color: 'var(--color-signal)' }} /> Configuration
                    </h3>

                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="input-label">Location Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Office, Campus"
                                className="input-field"
                                value={formData.locationName}
                                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="input-label">Latitude</label>
                                <input
                                    type="number" step="0.000001"
                                    placeholder="e.g. 28.6139"
                                    className="input-field font-mono text-xs"
                                    value={formData.centerLatitude}
                                    onChange={(e) => setFormData({ ...formData, centerLatitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="input-label">Longitude</label>
                                <input
                                    type="number" step="0.000001"
                                    placeholder="e.g. 77.2090"
                                    className="input-field font-mono text-xs"
                                    value={formData.centerLongitude}
                                    onChange={(e) => setFormData({ ...formData, centerLongitude: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Allowed Radius (km)</label>
                            <input
                                type="number" step="0.1" min="0.1"
                                placeholder="e.g. 2.5"
                                className="input-field font-mono text-xs"
                                value={formData.radiusKm}
                                onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value })}
                            />
                            <span className="block text-[10px] text-text-muted mt-1.5">
                                Users within {formData.radiusKm || '...'} km can login
                            </span>
                        </div>

                        <div className="pt-1">
                            <label className="input-label">Restriction Status</label>
                            <button
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: formData.enabled ? 'var(--color-safe-bg)' : 'var(--color-bg-elevated)',
                                    color: formData.enabled ? 'var(--color-safe-text)' : 'var(--color-text-muted)',
                                    border: `1px solid ${formData.enabled ? 'rgba(99, 153, 34, 0.25)' : 'var(--color-border-subtle)'}`,
                                }}
                                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                type="button"
                            >
                                {formData.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                <span>{formData.enabled ? 'Active Mode' : 'Inactive Mode'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                        <button onClick={handleSave} className="flex-1 btn btn-primary py-2" disabled={saving}>
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
                        </button>
                        <button onClick={handleNewConfig} className="flex-1 btn btn-secondary py-2">
                            <RefreshCw size={12} /> Reset
                        </button>
                    </div>

                    {/* Existing Configs */}
                    {allConfigs.length > 0 && (
                        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                            <p className="sec-label mb-3">Saved Configurations</p>
                            <div className="space-y-2">
                                {allConfigs.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg transition-all"
                                        style={{
                                            background: c.enabled ? 'rgba(55, 138, 221, 0.06)' : 'var(--color-bg-elevated)',
                                            border: `1px solid ${c.enabled ? 'rgba(55, 138, 221, 0.15)' : 'var(--color-border-subtle)'}`,
                                            opacity: c.enabled ? 1 : 0.7,
                                        }}>
                                        <div className="flex-1 pr-3 min-w-0">
                                            <span className="block text-xs font-bold text-canvas truncate">{c.locationName || 'Unnamed Zone'}</span>
                                            <span className="block text-[10px] text-text-muted mt-0.5 font-mono">
                                                ({c.centerLatitude?.toFixed(4)}, {c.centerLongitude?.toFixed(4)}) · {c.radiusKm} km
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => handleToggle(c.id, c.enabled)}
                                                className="p-1.5 rounded-md transition-colors"
                                                style={{
                                                    background: c.enabled ? 'var(--color-safe-bg)' : 'var(--color-bg-elevated)',
                                                    color: c.enabled ? 'var(--color-safe-text)' : 'var(--color-text-muted)',
                                                    border: `1px solid ${c.enabled ? 'rgba(99, 153, 34, 0.2)' : 'var(--color-border-subtle)'}`,
                                                }}
                                                title={c.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {c.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        id: c.id,
                                                        centerLatitude: c.centerLatitude?.toString(),
                                                        centerLongitude: c.centerLongitude?.toString(),
                                                        radiusKm: c.radiusKm?.toString(),
                                                        locationName: c.locationName || '',
                                                        enabled: c.enabled,
                                                    });
                                                }}
                                                className="p-1.5 rounded-md text-text-muted hover:text-signal transition-colors"
                                                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
                                                title="Edit"
                                            >
                                                <MapPin size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="p-1.5 rounded-md text-text-muted hover:text-crit-solid transition-colors"
                                                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default LocationSettings;
