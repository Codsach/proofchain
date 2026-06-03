"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Navigation, ExternalLink } from "lucide-react";

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface EvidenceMapProps {
  lat: number;
  lng: number;
  accuracy?: number; // in meters
}

export default function EvidenceMap({ lat, lng, accuracy = 8 }: EvidenceMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px] w-full bg-dash-sidebar animate-pulse rounded-2xl border border-dash-border" />;

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}`;

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl overflow-hidden shadow-xl mt-4 relative z-10">
      <div className="p-4 border-b border-dash-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-dash-accent" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-dash-text uppercase tracking-widest">Geospatial Origin</h3>
            <p className="text-[10px] text-dash-muted font-mono mt-0.5">
              LAT: {lat.toFixed(5)} &middot; LNG: {lng.toFixed(5)} {accuracy && `\u00B7 ACC: \u00B1${accuracy}m`}
            </p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-dash-sidebar hover:bg-dash-hover border border-dash-border rounded-lg text-[10px] font-bold text-dash-text uppercase tracking-wider transition-all group"
        >
          <Navigation className="w-3 h-3 text-dash-muted group-hover:text-dash-accent transition-colors" />
          Open in Google Maps
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      </div>

      <div className="h-[300px] w-full relative group">
        {/* CSS Filter to make OSM dark and match theme */}
        <div className="absolute inset-0 [&_.leaflet-layer]:brightness-[0.4] [&_.leaflet-layer]:contrast-[1.2] [&_.leaflet-layer]:hue-rotate-[180deg] [&_.leaflet-layer]:invert">
          <MapContainer 
            center={[lat, lng]} 
            zoom={16} 
            scrollWheelZoom={false}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {accuracy && (
              <Circle
                center={[lat, lng]}
                pathOptions={{ fillColor: '#10b981', color: '#10b981', weight: 1, opacity: 0.5, fillOpacity: 0.15 }}
                radius={accuracy}
              />
            )}
            <Marker position={[lat, lng]}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-[#050505]">Evidence Location</p>
                  <p className="text-[9px] font-mono text-gray-600 mt-1">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        
        {/* Overlay gradient to blend borders */}
        <div className="absolute inset-0 border-t border-dash-border/50 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-10" />
      </div>
    </div>
  );
}
