import "leaflet/dist/leaflet.css";
import L from "leaflet";
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

// แก้ไขปัญหา default icon ของ Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// สร้าง custom marker แบบ modern
const createCustomIcon = (idx: number, isBad: boolean, ofac: boolean) => {
    let markerColor = "#3b82f6"; // default blue
    if (isBad) markerColor = "#ef4444"; // red
    else if (ofac) markerColor = "#f59e0b"; // orange
    
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

// เพิ่ม CSS animation
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
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .leaflet-popup-content {
        margin: 12px 16px;
        font-family: system-ui, -apple-system, sans-serif;
    }
    
    .leaflet-container {
        z-index: 0 !important;
    }
`;

export default function ServerMap({ domains }: ServerMapProps) {
    // คำนวณ center แบบ dynamic
    const positions = Object.values(domains)
        .filter(d => d.geolocation && d.geolocation.latitude && d.geolocation.longitude)
        .map(d => ({
            lat: parseFloat(d.geolocation!.latitude!),
            lng: parseFloat(d.geolocation!.longitude!)
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
            <div className="bg-white from-gray-50 to-white rounded-2xl  p-6 mb-6 border border-gray-100" style={{ position: 'relative', zIndex: 0 }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        🗺️ SERVER LOCATIONS
                    </h2>
                    <div className="flex gap-3 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-gray-600">Bad Server</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-600">OFAC</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600">Normal</span>
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
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={19}
                    />

                    {Object.entries(domains).map(([domain, info], idx) => {
                        if (!info.geolocation) return null;
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
                                        <div className="font-bold text-lg mb-2 border-b pb-1">
                                            {domain}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">IP:</span>
                                                <span className="font-mono">{info.geolocation.ip}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Location:</span>
                                                <span>{info.geolocation.city}, {info.geolocation.region}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Country:</span>
                                                <span className="flex items-center gap-1">
                                                    {info.geolocation.country_long}
                                                    <img 
                                                        src={`https://flagcdn.com/16x12/${info.geolocation.country_short.toLowerCase()}.png`}
                                                        alt={info.geolocation.country_short}
                                                        className="inline"
                                                    />
                                                </span>
                                            </div>
                                            <div className="flex justify-between mt-2 pt-2 border-t">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    isBad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    Bad: {info.bad}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    info.ofac ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
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
                
                {/* สถิติ summary */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-2xl font-bold text-blue-600">
                            {Object.keys(domains).length}
                        </div>
                        <div className="text-xs text-gray-500">Total Servers</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                        <div className="text-2xl font-bold text-red-600">
                            {Object.values(domains).filter(d => d.bad !== "no").length}
                        </div>
                        <div className="text-xs text-gray-500">Bad Servers</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-2xl font-bold text-green-600">
                            {Object.values(domains).filter(d => d.bad === "no" && !d.ofac).length}
                        </div>
                        <div className="text-xs text-gray-500">Healthy</div>
                    </div>
                </div>
            </div>
        </>
    );
}