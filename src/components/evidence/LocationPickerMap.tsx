"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Navigation, Info } from "lucide-react";

// Fix for default Leaflet icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Component to handle auto-centering when coords change externally (e.g. from browser GPS)
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to handle clicking on the map to place the marker
function MapEventsHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component for the draggable marker
function DraggableMarker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [onChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  accuracy?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ lat, lng, accuracy, onChange }: LocationPickerMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[250px] w-full bg-dash-sidebar animate-pulse rounded-xl border border-dash-border flex items-center justify-center">
        <span className="text-xs text-dash-muted uppercase tracking-wider">Loading Map Interface...</span>
      </div>
    );
  }

  const position: [number, number] = [lat, lng];

  return (
    <div className="rounded-xl border border-dash-border bg-dash-card overflow-hidden shadow-md mt-3 relative z-10">
      <div className="p-3 border-b border-dash-border bg-dash-bg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-dash-accent/10 border border-dash-accent/20 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-dash-accent" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-dash-text uppercase tracking-wider">Refine Geotag Location</h4>
            <p className="text-[9px] text-dash-muted font-medium mt-0.5">
              Drag the marker or click on the map to pinpoint your location.
            </p>
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full relative group">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeMapView center={position} />
          <MapEventsHandler onChange={onChange} />
          {accuracy && (
            <Circle
              center={position}
              pathOptions={{ fillColor: '#10b981', color: '#10b981', weight: 1, opacity: 0.4, fillOpacity: 0.1 }}
              radius={accuracy}
            />
          )}
          <DraggableMarker position={position} onChange={onChange} />
        </MapContainer>
        
        {/* Overlay subtle shadow to blend borders */}
        <div className="absolute inset-0 border-t border-dash-border/30 pointer-events-none shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] z-10" />
      </div>
      
      <div className="p-2.5 bg-dash-input/30 border-t border-dash-border flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-dash-accent flex-shrink-0" />
        <span className="text-[10px] text-dash-muted font-medium">
          Current Geotag: <span className="font-mono text-dash-text">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
        </span>
      </div>
    </div>
  );
}
