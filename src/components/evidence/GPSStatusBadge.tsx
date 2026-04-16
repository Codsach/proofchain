"use client";

import { GPSCoordinates, GPSStatus } from "@/hooks/useGPS";

interface GPSStatusBadgeProps {
  status: GPSStatus;
  coords: GPSCoordinates | null;
  error: string | null;
  onRequest: () => void;
  onClear: () => void;
  compact?: boolean;
}

export function GPSStatusBadge({
  status,
  coords,
  error,
  onRequest,
  onClear,
  compact = false,
}: GPSStatusBadgeProps) {
  if (compact) {
    return (
      <div className={`gps-badge compact ${status}`}>
        <GPSIcon status={status} />
        {status === "acquired" && coords
          ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
          : status === "requesting"
          ? "Locating…"
          : status === "denied"
          ? "Denied"
          : "No GPS"}
        <style jsx>{`
          .gps-badge.compact {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            font-weight: 500;
            padding: 3px 8px;
            border-radius: 12px;
            background: rgba(255,255,255,0.07);
            color: #9ca3af;
          }
          .gps-badge.acquired { background: rgba(34,197,94,0.12); color: #4ade80; }
          .gps-badge.denied, .gps-badge.unavailable { background: rgba(239,68,68,0.12); color: #f87171; }
          .gps-badge.requesting { background: rgba(251,191,36,0.12); color: #fbbf24; }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`gps-panel ${status}`}>
      <div className="gps-header">
        <div className="gps-title">
          <GPSIcon status={status} />
          <span>GPS Location</span>
          {status === "acquired" && coords && (
            <span className="accuracy-badge">±{Math.round(coords.accuracy)}m</span>
          )}
        </div>
        <div className="gps-actions">
          {status !== "requesting" && (
            <button className="gps-btn" onClick={onRequest} title="Refresh location">
              {status === "acquired" ? "Refresh" : "Get Location"}
            </button>
          )}
          {status === "acquired" && (
            <button className="gps-btn danger" onClick={onClear} title="Remove GPS">
              Remove
            </button>
          )}
        </div>
      </div>

      {status === "acquired" && coords && (
        <div className="gps-coords">
          <div className="coord-row">
            <span className="coord-label">Latitude</span>
            <span className="coord-value">{coords.latitude.toFixed(6)}°</span>
          </div>
          <div className="coord-row">
            <span className="coord-label">Longitude</span>
            <span className="coord-value">{coords.longitude.toFixed(6)}°</span>
          </div>
          {coords.altitude !== null && (
            <div className="coord-row">
              <span className="coord-label">Altitude</span>
              <span className="coord-value">{Math.round(coords.altitude)}m</span>
            </div>
          )}
          <div className="coord-row">
            <span className="coord-label">Captured</span>
            <span className="coord-value">
              {coords.capturedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {status === "requesting" && (
        <div className="gps-status-row">
          <div className="spinner-sm" />
          <span>Acquiring GPS signal…</span>
        </div>
      )}

      {error && status !== "acquired" && (
        <div className="gps-error">{error}</div>
      )}

      {status === "idle" && (
        <p className="gps-hint">
          GPS coordinates will be embedded in the evidence record as tamper-proof geotags.
        </p>
      )}

      <style jsx>{`
        .gps-panel {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          transition: border-color 0.2s;
        }
        .gps-panel.acquired { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.05); }
        .gps-panel.denied, .gps-panel.unavailable { border-color: rgba(239,68,68,0.3); }
        .gps-panel.requesting { border-color: rgba(251,191,36,0.3); }
        .gps-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .gps-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
        }
        .accuracy-badge {
          font-size: 11px;
          font-weight: 400;
          background: rgba(34,197,94,0.2);
          color: #4ade80;
          padding: 1px 6px;
          border-radius: 10px;
        }
        .gps-actions { display: flex; gap: 6px; }
        .gps-btn {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: #d1d5db;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gps-btn:hover { background: rgba(255,255,255,0.1); }
        .gps-btn.danger { border-color: rgba(239,68,68,0.4); color: #f87171; }
        .gps-coords { display: flex; flex-direction: column; gap: 4px; }
        .coord-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .coord-label { color: #6b7280; }
        .coord-value { color: #d1d5db; font-family: monospace; }
        .gps-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #fbbf24;
        }
        .gps-error {
          font-size: 12px;
          color: #f87171;
          margin-top: 4px;
        }
        .gps-hint {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }
        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(251,191,36,0.3);
          border-top-color: #fbbf24;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function GPSIcon({ status }: { status: GPSStatus }) {
  const color =
    status === "acquired"
      ? "#4ade80"
      : status === "requesting"
      ? "#fbbf24"
      : status === "denied" || status === "unavailable"
      ? "#f87171"
      : "#6b7280";

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}