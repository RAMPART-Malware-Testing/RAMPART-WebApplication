import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, ZoomControl } from "react-leaflet";

type DomainInfo = {
    bad: string;
    geolocation: {
        ip: string;
        country_short: string;
        country_long: string;
        region: string;
        city: string;
        latitude: string;
        longitude: string;
    };
    ofac: boolean;
};

type ServerMapProps = {
    domains: Record<string, DomainInfo>;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (idx: number, isBad: boolean, ofac: boolean) => {
    let markerColor = "#3b82f6";
    if (isBad) markerColor = "#ef4444";
    else if (ofac) markerColor = "#f59e0b";

    return L.divIcon({
        html: `
            <div class="custom-marker" style="position: relative; cursor: pointer;">
                <div style="
                    width: 24px;
                    height: 24px;
                    background: ${markerColor};
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    transition: all 0.2s ease;
                "></div>
                ${isBad ? `<div style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 12px;
                    height: 12px;
                    background: #ef4444;
                    border: 1px solid white;
                    border-radius: 50%;
                    animation: pulse-red 1.5s infinite;
                "></div>` : ''}
            </div>
        `,
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

const markerStyles = `
    @keyframes pulse-red {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
        }
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        }
    }

    .custom-marker:hover > div:first-child {
        transform: scale(1.2);
        filter: brightness(1.1);
    }

    .leaflet-popup-content-wrapper {
        background: #0f172a;
        color: #e2e8f0;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .leaflet-popup-tip {
        background: #0f172a;
    }

    .leaflet-popup-content {
        margin: 12px 16px;
        font-family: var(--font-inter, system-ui), -apple-system, sans-serif;
    }

    .leaflet-popup-close-button {
        color: #94a3b8 !important;
    }

    .leaflet-popup-close-button:hover {
        color: #ffffff !important;
    }

    .leaflet-container {
        z-index: 0 !important;
        background: #0a0a14 !important;
    }

    .leaflet-bar a {
        background-color: #0f172a !important;
        color: #e2e8f0 !important;
        border-bottom-color: rgba(255,255,255,0.1) !important;
    }

    .leaflet-bar a:hover {
        background-color: #1e293b !important;
    }
`;

export default function ServerMap({ domains }: ServerMapProps) {
    const positions = Object.values(domains)
        .filter(d => d.geolocation.latitude && d.geolocation.longitude)
        .map(d => ({
            lat: parseFloat(d.geolocation.latitude),
            lng: parseFloat(d.geolocation.longitude)
        }));

    const center = positions.length > 0
        ? {
            lat: positions.reduce((sum, p) => sum + p.lat, 0) / positions.length,
            lng: positions.reduce((sum, p) => sum + p.lng, 0) / positions.length
        }
        : { lat: 20, lng: 0 };

    return (
        <>
            <style>{markerStyles}</style>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6" style={{ position: 'relative', zIndex: 0 }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">
                        🗺️ SERVER LOCATIONS
                    </h2>
                    <div className="flex gap-3 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-400">Bad Server</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-slate-400">OFAC</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-400">Normal</span>
                        </div>
                    </div>
                </div>

                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={2}
                    style={{ height: "500px", width: "100%", borderRadius: "12px" }}
                    scrollWheelZoom={true}
                    zoomControl={true}
                    className="shadow-inner"
                >
                    <ZoomControl position="bottomright" />

                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={19}
                    />

                    {Object.entries(domains).map(([domain, info], idx) => {
                        const lat = parseFloat(info.geolocation.latitude);
                        const lng = parseFloat(info.geolocation.longitude);
                        const isBad = info.bad === "yes";

                        if (isNaN(lat) || isNaN(lng)) return null;

                        return (
                            <Marker
                                key={idx}
                                position={[lat, lng]}
                                icon={createCustomIcon(idx, isBad, info.ofac)}
                                eventHandlers={{
                                    mouseover: (e) => e.target.openPopup(),
                                    mouseout: (e) => e.target.closePopup(),
                                }}
                            >
                                <Popup>
                                    <div className="min-w-[200px]">
                                        <div className="font-bold text-lg mb-2 border-b border-white/10 pb-1 text-white">
                                            {domain}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">IP:</span>
                                                <span className="font-mono text-slate-200">{info.geolocation.ip}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Location:</span>
                                                <span className="text-slate-200">{info.geolocation.city}, {info.geolocation.region}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Country:</span>
                                                <span className="flex items-center gap-1 text-slate-200">
                                                    {info.geolocation.country_long}
                                                    <img
                                                        src={`https://flagcdn.com/16x12/${info.geolocation.country_short.toLowerCase()}.png`}
                                                        alt={info.geolocation.country_short}
                                                        className="inline"
                                                    />
                                                </span>
                                            </div>
                                            <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    isBad ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                    Bad: {info.bad}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    info.ofac ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                    OFAC: {info.ofac ? "⚠️ Yes" : "✓ No"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                                <Tooltip permanent={false} direction="top" offset={[0, -20]}>
                                    <span className="text-xs font-medium">{domain}</span>
                                </Tooltip>
                            </Marker>
                        );
                    })}
                </MapContainer>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-500/10 rounded-lg p-2">
                        <div className="text-2xl font-bold text-blue-400">
                            {Object.keys(domains).length}
                        </div>
                        <div className="text-xs text-slate-400">Total Servers</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2">
                        <div className="text-2xl font-bold text-red-400">
                            {Object.values(domains).filter(d => d.bad !== "no").length}
                        </div>
                        <div className="text-xs text-slate-400">Bad Servers</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2">
                        <div className="text-2xl font-bold text-green-400">
                            {Object.values(domains).filter(d => d.bad === "no" && !d.ofac).length}
                        </div>
                        <div className="text-xs text-slate-400">Healthy</div>
                    </div>
                </div>
            </div>
        </>
    );
}
