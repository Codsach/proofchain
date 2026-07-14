"use client";

import { useCallback } from "react";
import { useCamera, CaptureMode } from "@/hooks/useCamera";

interface CameraCaptureProps {
  mode?: CaptureMode;
  onCapture: (file: File, capturedAt: Date, mode: CaptureMode) => void;
  onCancel: () => void;
}

export function CameraCapture({ mode = "photo", onCapture, onCancel }: CameraCaptureProps) {
  const {
    videoRef,
    status,
    error,
    capturedFile,
    startCamera,
    stopCamera,
    takePhoto,
    startRecording,
    stopRecording,
    switchFacing,
    clearCapture,
    isRecording,
    recordingDuration,
    facing,
  } = useCamera({ mode });

  const handleConfirm = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile.file, capturedFile.capturedAt, capturedFile.mode);
      stopCamera();
    }
  }, [capturedFile, onCapture, stopCamera]);

  const handleRetake = useCallback(() => {
    clearCapture();
  }, [clearCapture]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="camera-capture">
      {/* Preview area */}
      <div className="camera-preview-container">
        {capturedFile ? (
          capturedFile.mode === "photo" ? (
            <img
              src={capturedFile.previewUrl}
              alt="Captured"
              className="camera-preview captured"
            />
          ) : (
            <video
              src={capturedFile.previewUrl}
              controls
              className="camera-preview captured"
            />
          )
        ) : (
          <video
            ref={videoRef}
            className="camera-preview live"
            autoPlay
            muted
            playsInline
          />
        )}

        {/* Status overlays */}
        {status === "idle" && !capturedFile && (
          <div className="camera-overlay">
            <div className="camera-icon-wrapper">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p>Tap to open camera</p>
            </div>
            <button className="btn-primary" onClick={startCamera}>
              Open Camera
            </button>
          </div>
        )}

        {status === "initializing" && (
          <div className="camera-overlay">
            <div className="spinner" />
            <p>Starting camera…</p>
          </div>
        )}

        {status === "error" && (
          <div className="camera-overlay error">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="error-text">{error}</p>
            <button className="btn-secondary" onClick={onCancel}>
              Go Back
            </button>
          </div>
        )}

        {isRecording && (
          <div className="recording-badge">
            <span className="rec-dot" />
            REC {formatDuration(recordingDuration)}
          </div>
        )}
      </div>

      {/* Controls */}
      {!capturedFile ? (
        <div className="camera-controls">
          {(status === "active" || status === "recording") && (
            <>
              <button
                className="btn-icon"
                onClick={switchFacing}
                title={`Switch to ${facing === "environment" ? "front" : "rear"} camera`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6" />
                  <path d="M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
              </button>

              {mode === "photo" ? (
                <button className="btn-shutter" onClick={takePhoto} title="Take photo">
                  <span className="shutter-inner" />
                </button>
              ) : isRecording ? (
                <button className="btn-shutter recording" onClick={stopRecording} title="Stop recording">
                  <span className="stop-inner" />
                </button>
              ) : (
                <button className="btn-shutter video" onClick={startRecording} title="Start recording">
                  <span className="video-inner" />
                </button>
              )}

              <button className="btn-icon" onClick={() => { stopCamera(); onCancel(); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="camera-controls confirm">
          <button className="btn-secondary" onClick={handleRetake}>
            Retake
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            Use This {capturedFile.mode === "photo" ? "Photo" : "Video"}
          </button>
        </div>
      )}

      <style jsx>{`
        .camera-capture {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .camera-preview-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: #0a0a0a;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .camera-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .camera-preview.live {
          transform: scaleX(-1);
        }
        .camera-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: rgba(0,0,0,0.7);
          color: white;
        }
        .camera-overlay.error { background: rgba(20,0,0,0.85); }
        .camera-icon-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0.7;
        }
        .error-text {
          font-size: 14px;
          text-align: center;
          padding: 0 24px;
          color: #fca5a5;
        }
        .recording-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(220,38,38,0.9);
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.05em;
        }
        .rec-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }
        .camera-controls {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 8px 0;
        }
        .camera-controls.confirm {
          justify-content: center;
          gap: 16px;
        }
        .btn-shutter {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 3px solid white;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: transform 0.1s;
        }
        .btn-shutter:active { transform: scale(0.93); }
        .shutter-inner {
          width: 52px;
          height: 52px;
          background: white;
          border-radius: 50%;
        }
        .btn-shutter.video .video-inner {
          width: 26px;
          height: 26px;
          background: #ef4444;
          border-radius: 50%;
        }
        .btn-shutter.recording .stop-inner {
          width: 22px;
          height: 22px;
          background: #ef4444;
          border-radius: 3px;
        }
        .btn-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .btn-icon:hover { background: rgba(255,255,255,0.15); }
        .btn-primary {
          background: var(--dash-accent, #10b981);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s, opacity 0.15s;
        }
        .btn-primary:hover {
          opacity: 0.95;
        }
        .btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border-color: rgba(255, 255, 255, 0.35);
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}