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

        // Dark tile layer (CartoDB Dark Matter - 100% free, no API key)
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

        // Cleanup on unmount
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

        // Remove old marker/circle
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
        if (circleRef.current) {
            circleRef.current.remove();
            circleRef.current = null;
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng]).addTo(map);

        // Add radius circle
        const radius = isNaN(radiusKm) || radiusKm <= 0 ? 1000 : radiusKm * 1000;
        circleRef.current = L.circle([lat, lng], {
            radius,
            color: '#6366f1',
            fillColor: '#6366f1',
            fillOpacity: 0.15,
            weight: 2,
        }).addTo(map);

        // Fit map to circle
        map.fitBounds(circleRef.current.getBounds(), { padding: [30, 30] });
    }, [formData.centerLatitude, formData.centerLongitude, formData.radiusKm]);

    // Fetch configs on mount
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
            // Clear map markers
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

        // Check for secure context (HTTPS or localhost)
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            showMessage('⚠️ Location access requires HTTPS or localhost. Please open via http://localhost:3000', 'warning');
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

                // Specific hint for the secure origin issue if it happens despite checks
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
             className="w-full max-w-7xl mx-auto"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-dark-bg/40 border border-dark-border rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 text-primary rounded-lg">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-light-text m-0 mb-0.5">Location Restriction</h2>
                        <p className="text-xs text-dark-text-muted m-0">Configure the allowed login zone for regular users.</p>
                    </div>
                </div>
                <div>
                    {config ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${config.enabled ? 'bg-success/10 text-success border-success/30' : 'bg-dark-bg/80 text-dark-text-muted border-dark-border'}`}>
                            {config.enabled ? <span className="w-2 h-2 rounded-full bg-success"></span> : <span className="w-2 h-2 rounded-full border border-dark-text-muted"></span>}
                            {config.enabled ? 'Active' : 'Inactive'}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-dark-bg/80 text-dark-text-muted border border-dark-border">
                            <span className="w-2 h-2 rounded-full border border-dark-text-muted"></span> Not Configured
                        </span>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-2.5 p-3 mb-6 rounded-lg border text-sm font-medium ${message.type === 'danger' ? 'bg-danger/10 border-danger/30 text-danger shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'bg-success/10 border-success/30 text-success shadow-[0_0_10px_rgba(34,197,94,0.15)]'}`}
                    >
                         {message.type === 'danger' ? <AlertTriangle size={20} /> : <Shield size={20} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Map Section */}
                <div className="glass-card flex flex-col h-[400px] lg:col-span-3 lg:h-[520px] overflow-hidden p-0 relative border border-dark-border rounded-xl">
                    <div className="absolute top-0 inset-x-0 z-[1000] p-3 bg-dark-bg/90 backdrop-blur-md border-b border-dark-border flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-center w-full">
                            <h3 className="flex items-center gap-2 text-sm text-light-text font-bold m-0"><MapPin className="text-primary" size={16} /> Map View</h3>
                            <span className="text-[11px] text-dark-text-muted hidden sm:inline">Click to set point</span>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Search city or address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#111111] border border-dark-border rounded-lg px-3 py-1.5 text-sm text-light-text focus:outline-none focus:border-primary shadow-inner transition-all placeholder:text-dark-text-muted/50"
                            />
                            <button type="submit" className="btn btn-primary px-3 py-1.5 text-xs whitespace-nowrap rounded-lg flex items-center justify-center">
                                <Search size={14} /> <span className="hidden sm:inline ml-1.5">Search</span>
                            </button>
                        </form>
                    </div>
                    <div className="flex-1 w-full z-0 h-full [&>.leaflet-container]:h-full [&>.leaflet-container]:!bg-[#0D0D1A]" ref={mapContainerRef}></div>
                    <div className="absolute bottom-4 inset-x-0 z-[1000] px-4 text-center pointer-events-none">
                        <button onClick={handleUseCurrentLocation} className="btn bg-dark-bg/90 hover:bg-dark-bg/100 text-xs text-light-text border border-dark-border shadow-md backdrop-blur-sm pointer-events-auto inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg">
                            <Navigation size={14} /> Use My Location
                        </button>
                    </div>
                </div>

                {/* Config Form */}
                <div className="glass-card overflow-y-auto custom-scrollbar p-5 lg:col-span-2 lg:h-[520px] rounded-xl flex flex-col">
                    <h3 className="flex items-center gap-2 text-base font-bold text-light-text mb-4 pb-3 border-b border-dark-border"><Save className="text-primary" size={16} /> Configuration</h3>

                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="block text-[13px] font-semibold text-light-text mb-1">Location Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Office, Campus"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-dark-text-muted/50"
                                value={formData.locationName}
                                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[13px] font-semibold text-light-text mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="e.g. 28.6139"
                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-dark-text-muted/50 font-mono"
                                    value={formData.centerLatitude}
                                    onChange={(e) => setFormData({ ...formData, centerLatitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-light-text mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="e.g. 77.2090"
                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-dark-text-muted/50 font-mono"
                                    value={formData.centerLongitude}
                                    onChange={(e) => setFormData({ ...formData, centerLongitude: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-light-text mb-1">Allowed Radius (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                placeholder="e.g. 2.5"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-dark-text-muted/50 font-mono"
                                value={formData.radiusKm}
                                onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value })}
                            />
                            <span className="block text-[11px] text-dark-text-muted mt-1">
                                Users within {formData.radiusKm || '...'} km can login
                            </span>
                        </div>

                        <div className="pt-1">
                            <label className="block text-[13px] font-semibold text-light-text mb-1.5">Restriction Status</label>
                            <button
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-xs font-bold cursor-pointer ${formData.enabled ? 'bg-success/10 border-success/30 text-success shadow-[0_0_8px_rgba(34,197,94,0.1)] hover:bg-success/20' : 'bg-dark-bg border-dark-border text-dark-text-muted hover:text-light-text hover:bg-dark-bg/80'}`}
                                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                type="button"
                            >
                                {formData.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                <span>{formData.enabled ? 'Active Mode' : 'Inactive Mode'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-4 border-t border-dark-border">
                        <button onClick={handleSave} className="flex-1 btn btn-primary flex items-center justify-center py-2 text-sm rounded-lg cursor-pointer transition-transform hover:scale-[1.02]" disabled={saving}>
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={16} className="mr-1.5" /> Save</>}
                        </button>
                        <button onClick={handleNewConfig} className="flex-1 btn bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-light-text flex items-center justify-center py-2 text-sm rounded-lg cursor-pointer transition-transform hover:scale-[1.02]">
                            <RefreshCw size={14} className="mr-1.5 text-dark-text-muted" /> Reset
                        </button>
                    </div>

                    {/* Existing Configs */}
                    {allConfigs.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-dark-border">
                            <h4 className="text-[11px] font-bold text-dark-text-muted uppercase tracking-wider mb-3">Saved Configurations</h4>
                            <div className="space-y-2">
                                {allConfigs.map((c) => (
                                    <div key={c.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${c.enabled ? 'bg-primary/5 border-primary/20 shadow-[0_0_8px_rgba(37,99,235,0.05)]' : 'bg-dark-bg/50 border-dark-border opacity-70'}`}>
                                        <div className="flex-1 pr-3 min-w-0">
                                            <span className="block text-xs font-bold text-light-text truncate">{c.locationName || 'Unnamed Zone'}</span>
                                            <span className="block text-[10px] text-dark-text-muted mt-0.5 font-mono">
                                                ({c.centerLatitude?.toFixed(4)}, {c.centerLongitude?.toFixed(4)}) • {c.radiusKm} km
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => handleToggle(c.id, c.enabled)}
                                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${c.enabled ? 'text-success bg-success/10 hover:bg-success/20' : 'text-dark-text-muted hover:text-light-text border border-dark-border bg-dark-bg'}`}
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
                                                className="p-1.5 text-dark-text-muted hover:text-primary bg-dark-bg border border-dark-border rounded-md hover:border-primary/50 transition-colors cursor-pointer"
                                                title="Edit"
                                            >
                                                <MapPin size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="p-1.5 text-dark-text-muted hover:text-danger bg-dark-bg border border-dark-border rounded-md hover:border-danger/50 hover:bg-danger/10 transition-colors cursor-pointer"
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
