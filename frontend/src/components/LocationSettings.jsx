import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { adminAPI } from '../services/api';
import { FiMapPin, FiSave, FiToggleLeft, FiToggleRight, FiTrash2, FiRefreshCw, FiNavigation } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationSettings.css';

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

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <div className="location-settings">
            <div className="location-header">
                <div className="location-title">
                    <FiMapPin className="title-icon" />
                    <div>
                        <h2>Location Restriction</h2>
                        <p>Configure the allowed login zone for regular users. Admins can login from anywhere.</p>
                    </div>
                </div>
                <div className="location-status">
                    {config ? (
                        <span className={`status-badge ${config.enabled ? 'active' : 'inactive'}`}>
                            {config.enabled ? '● Active' : '○ Inactive'}
                        </span>
                    ) : (
                        <span className="status-badge inactive">○ Not Configured</span>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`location-alert ${message.type}`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="location-body">
                {/* Map Section */}
                <div className="map-section glass-card">
                    <div className="map-header">
                        <h3><FiMapPin /> Map View</h3>
                        <span className="map-hint">Click on the map to set the center point</span>
                    </div>
                    <div className="map-container" ref={mapContainerRef}></div>
                    <div className="map-actions">
                        <button onClick={handleUseCurrentLocation} className="btn btn-secondary btn-sm">
                            <FiNavigation /> Use My Location
                        </button>
                    </div>
                </div>

                {/* Config Form */}
                <div className="config-form glass-card">
                    <h3><FiSave /> Configuration</h3>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Location Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Office, Campus, HQ"
                                value={formData.locationName}
                                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label>Center Latitude</label>
                            <input
                                type="number"
                                step="0.000001"
                                placeholder="e.g. 28.6139"
                                value={formData.centerLatitude}
                                onChange={(e) => setFormData({ ...formData, centerLatitude: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label>Center Longitude</label>
                            <input
                                type="number"
                                step="0.000001"
                                placeholder="e.g. 77.2090"
                                value={formData.centerLongitude}
                                onChange={(e) => setFormData({ ...formData, centerLongitude: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label>Allowed Radius (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                placeholder="e.g. 2.5"
                                value={formData.radiusKm}
                                onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value })}
                            />
                            <span className="field-hint">
                                Users within {formData.radiusKm || '...'} km can login
                            </span>
                        </div>

                        <div className="form-field toggle-field">
                            <label>Restriction Active</label>
                            <button
                                className={`toggle-btn ${formData.enabled ? 'on' : 'off'}`}
                                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                type="button"
                            >
                                {formData.enabled ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
                                <span>{formData.enabled ? 'Enabled' : 'Disabled'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-actions-row">
                        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                            {saving ? <span className="loader sm"></span> : <><FiSave /> Save Configuration</>}
                        </button>
                        <button onClick={handleNewConfig} className="btn btn-secondary">
                            <FiRefreshCw /> New Config
                        </button>
                    </div>

                    {/* Existing Configs */}
                    {allConfigs.length > 0 && (
                        <div className="existing-configs">
                            <h4>Saved Configurations</h4>
                            {allConfigs.map((c) => (
                                <div key={c.id} className={`config-item ${c.enabled ? 'enabled' : 'disabled'}`}>
                                    <div className="config-info">
                                        <span className="config-name">{c.locationName || 'Unnamed Zone'}</span>
                                        <span className="config-details">
                                            ({c.centerLatitude?.toFixed(4)}, {c.centerLongitude?.toFixed(4)}) • {c.radiusKm} km
                                        </span>
                                    </div>
                                    <div className="config-actions">
                                        <button
                                            onClick={() => handleToggle(c.id, c.enabled)}
                                            className={`btn-icon ${c.enabled ? 'active' : ''}`}
                                            title={c.enabled ? 'Disable' : 'Enable'}
                                        >
                                            {c.enabled ? <FiToggleRight /> : <FiToggleLeft />}
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
                                            className="btn-icon"
                                            title="Edit"
                                        >
                                            <FiMapPin />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="btn-icon danger"
                                            title="Delete"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationSettings;
