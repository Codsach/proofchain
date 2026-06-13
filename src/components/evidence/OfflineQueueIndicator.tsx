"use client";

import { QueuedSubmission } from "@/hooks/useOfflineQueue";

interface OfflineQueueIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  queue: QueuedSubmission[];
  onSync: () => void;
  onRemove: (id: string) => void;
  expanded?: boolean;
}

export function OfflineQueueIndicator({
  isOnline,
  pendingCount,
  isSyncing,
  queue,
  onSync,
  onRemove,
  expanded = false,
}: OfflineQueueIndicatorProps) {
  const failedCount = queue.filter((q) => q.status === "failed").length;
  const totalQueued = queue.length;

  if (totalQueued === 0 && isOnline) return null;

  return (
    <div className={`offline-indicator ${isOnline ? "online" : "offline"}`}>
      <div className="indicator-header">
        <div className="status-dot-row">
          <span className={`status-dot ${isOnline ? "green" : "red"}`} />
          <span className="status-text">
            {isOnline ? "Online" : "Offline — submissions queued locally"}
          </span>
        </div>

        <div className="indicator-meta">
          {pendingCount > 0 && (
            <span className="badge pending">{pendingCount} pending</span>
          )}
          {failedCount > 0 && (
            <span className="badge failed">{failedCount} failed</span>
          )}
          {isSyncing && <span className="syncing-text">Syncing…</span>}
          {isOnline && pendingCount > 0 && !isSyncing && (
            <button className="sync-btn" onClick={onSync}>
              Sync Now
            </button>
          )}
        </div>
      </div>

      {expanded && queue.length > 0 && (
        <div className="queue-list">
          {queue.map((item) => (
            <div key={item.id} className={`queue-item ${item.status}`}>
              <div className="queue-item-info">
                <span className="queue-title">{item.title}</span>
                <span className="queue-meta">
                  {item.fileType.split("/")[0]} •{" "}
                  {(item.fileSize / 1024 / 1024).toFixed(1)}MB •{" "}
                  {item.status === "failed"
                    ? `Failed (${item.error})`
                    : item.status === "uploading"
                    ? "Uploading…"
                    : `Queued (retry ${item.retryCount}/3)`}
                </span>
              </div>
              <button
                className="remove-btn"
                onClick={() => onRemove(item.id)}
                title="Remove from queue"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .offline-indicator {
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
        }
        .offline-indicator.offline {
          border-color: rgba(251,191,36,0.3);
          background: rgba(251,191,36,0.05);
        }
        .indicator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .status-dot-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.green { background: #4ade80; }
        .status-dot.red { background: #fbbf24; animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .status-text {
          font-size: 13px;
          color: #d1d5db;
          font-weight: 500;
        }
        .indicator-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 10px;
        }
        .badge.pending { background: rgba(59,130,246,0.2); color: #60a5fa; }
        .badge.failed { background: rgba(239,68,68,0.2); color: #f87171; }
        .syncing-text {
          font-size: 12px;
          color: #9ca3af;
        }
        .sync-btn {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid rgba(59,130,246,0.4);
          background: rgba(59,130,246,0.1);
          color: #60a5fa;
          cursor: pointer;
        }
        .queue-list {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .queue-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .queue-item.failed { border-color: rgba(239,68,68,0.2); }
        .queue-item.uploading { border-color: rgba(59,130,246,0.2); }
        .queue-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .queue-title {
          font-size: 13px;
          color: #e5e7eb;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .queue-meta {
          font-size: 11px;
          color: #6b7280;
        }
        .remove-btn {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          flex-shrink: 0;
        }
        .remove-btn:hover { color: #f87171; }
      `}</style>
    </div>
  );
}