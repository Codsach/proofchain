"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FolderSearch, FileText, AlignLeft } from "lucide-react";
import { CameraCapture } from "@/components/evidence/CameraCapture";
import { GPSStatusBadge } from "@/components/evidence/GPSStatusBadge";
import { OfflineQueueIndicator } from "@/components/evidence/OfflineQueueIndicator";
import { useGPS } from "@/hooks/useGPS";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useAuth } from "@/components/providers/AuthContext";
import type { CaptureMode } from "@/hooks/useCamera";

type SubmitMode = "camera" | "upload";

export default function SubmitEvidencePage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [submitMode, setSubmitMode] = useState<SubmitMode | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photo");
  const [showCamera, setShowCamera] = useState(false);

  // Form fields
  const [caseId, setCaseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // GPS
  const { coords, status: gpsStatus, error: gpsError, requestGPS, clearGPS } = useGPS({
    autoStart: false,
    highAccuracy: true,
  });

  // Offline queue
  const { queue, isOnline, addToQueue, syncQueue, removeFromQueue, isSyncing, pendingCount } =
    useOfflineQueue(getToken);

  const handleCameraCapture = useCallback(
    (file: File, capturedAt: Date, mode: CaptureMode) => {
      setSelectedFile(file);
      setCapturedAt(capturedAt);
      setFilePreviewUrl(URL.createObjectURL(file));
      setShowCamera(false);
      // Auto-fill title if empty
      setTitle((t) => t || `Field ${mode === "photo" ? "Photo" : "Video"} - ${capturedAt.toLocaleDateString()}`);
    },
    []
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setCapturedAt(new Date());
    setFilePreviewUrl(URL.createObjectURL(file));
  }, []);

  const buildFormData = useCallback(() => {
    if (!selectedFile || !caseId || !title) return null;
    const fd = new FormData();
    fd.append("file", selectedFile, selectedFile.name);
    fd.append("caseId", caseId);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("captureMethod", submitMode === "camera" ? "camera" : "upload");
    if (coords) {
      fd.append("latitude", String(coords.latitude));
      fd.append("longitude", String(coords.longitude));
      if (coords.altitude !== null) fd.append("altitude", String(coords.altitude));
      fd.append("gpsAccuracy", String(coords.accuracy));
      fd.append("capturedAt", coords.capturedAt.toISOString());
    }
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    };
    fd.append("deviceInfo", JSON.stringify(deviceInfo));
    return fd;
  }, [selectedFile, caseId, title, description, submitMode, coords]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !caseId.trim() || !title.trim()) {
      setSubmitError("Case ID, title, and file are required.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const token = await getToken();

    // If offline, queue it
    if (!isOnline || !token) {
      try {
        await addToQueue({
          caseId,
          title,
          description,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          fileBlob: selectedFile,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          altitude: coords?.altitude ?? null,
          gpsAccuracy: coords?.accuracy ?? null,
          capturedAt: coords?.capturedAt.toISOString() ?? new Date().toISOString(),
          captureMethod: submitMode === "camera" ? "camera" : "upload",
          deviceInfo: JSON.stringify({ userAgent: navigator.userAgent }),
        });
        setSubmitSuccess(true);
        setIsSubmitting(false);
        // Reset form
        resetForm();
      } catch {
        setSubmitError("Failed to queue submission. Please try again.");
        setIsSubmitting(false);
      }
      return;
    }

    // Online: submit directly
    const fd = buildFormData();
    if (!fd) {
      setSubmitError("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/evidence/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Submission failed. Please try again.");
      } else {
        setSubmitSuccess(true);
        resetForm();
        setTimeout(() => router.push("/investigator/dashboard"), 2000);
      }
    } catch {
      // Network failure — queue it
      try {
        await addToQueue({
          caseId,
          title,
          description,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          fileBlob: selectedFile,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          altitude: coords?.altitude ?? null,
          gpsAccuracy: coords?.accuracy ?? null,
          capturedAt: coords?.capturedAt.toISOString() ?? new Date().toISOString(),
          captureMethod: submitMode === "camera" ? "camera" : "upload",
          deviceInfo: JSON.stringify({ userAgent: navigator.userAgent }),
        });
        setSubmitSuccess(true);
        resetForm();
      } catch {
        setSubmitError("Submission failed and offline queue is unavailable.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedFile,
    caseId,
    title,
    description,
    coords,
    submitMode,
    isOnline,
    getToken,
    buildFormData,
    addToQueue,
    router,
  ]);

  const resetForm = () => {
    setCaseId("");
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setCapturedAt(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    setSubmitMode(null);
    clearGPS();
  };

  if (submitSuccess) {
    return (
      <div className="page">
        <div className="success-card">
          <div className="success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>
            {isOnline ? "Evidence Submitted" : "Queued for Submission"}
          </h2>
          <p>
            {isOnline
              ? "Your evidence has been securely submitted. AI analysis is in progress."
              : "Saved locally. It will be submitted automatically when connectivity is restored."}
          </p>
          <button className="btn-primary" onClick={() => setSubmitSuccess(false)}>
            Submit Another
          </button>
        </div>
        <style jsx>{`
          .page { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 24px; background: #0f1117; }
          .success-card { text-align: center; max-width: 360px; padding: 32px; border-radius: 16px; border: 1px solid rgba(74,222,128,0.2); background: rgba(74,222,128,0.05); }
          .success-icon { margin: 0 auto 16px; width: 72px; height: 72px; border-radius: 50%; background: rgba(74,222,128,0.1); display: flex; align-items: center; justify-content: center; }
          h2 { color: #f0fdf4; font-size: 20px; margin: 0 0 8px; }
          p { color: #9ca3af; font-size: 14px; margin: 0 0 24px; }
          .btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Submit Evidence</h1>
          <p>All submissions are hashed, IPFS-stored, and blockchain-anchored.</p>
        </header>

        {/* Offline / Queue status */}
        <OfflineQueueIndicator
          isOnline={isOnline}
          pendingCount={pendingCount}
          isSyncing={isSyncing}
          queue={queue}
          onSync={syncQueue}
          onRemove={removeFromQueue}
          expanded={pendingCount > 0}
        />

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Case ID */}
          <div className="field">
            <label>Case ID *</label>
            <div className="input-with-icon">
              <FolderSearch className="input-icon" />
              <input
                type="text"
                placeholder="e.g. CASE-2024-001"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Title */}
          <div className="field">
            <label>Evidence Title *</label>
            <div className="input-with-icon">
              <FileText className="input-icon" />
              <input
                type="text"
                placeholder="Brief description of evidence"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="field">
            <label>Description</label>
            <div className="input-with-icon">
              <AlignLeft className="input-icon" style={{ top: "12px" }} />
              <textarea
                placeholder="Optional: additional context about where and how this was captured"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Capture method */}
          <div className="field">
            <label>Capture Method *</label>
            <div className="method-tabs">
              <button
                type="button"
                className={`method-tab ${submitMode === "camera" ? "active" : ""}`}
                onClick={() => setSubmitMode("camera")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Use Camera
              </button>
              <button
                type="button"
                className={`method-tab ${submitMode === "upload" ? "active" : ""}`}
                onClick={() => setSubmitMode("upload")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload File
              </button>
            </div>
          </div>

          {/* Camera flow */}
          {submitMode === "camera" && (
            <div className="field">
              <div className="capture-type-row">
                <button
                  type="button"
                  className={`capture-type-btn ${captureMode === "photo" ? "active" : ""}`}
                  onClick={() => setCaptureMode("photo")}
                >
                  Photo
                </button>
                <button
                  type="button"
                  className={`capture-type-btn ${captureMode === "video" ? "active" : ""}`}
                  onClick={() => setCaptureMode("video")}
                >
                  Video
                </button>
              </div>

              {!selectedFile ? (
                <button
                  type="button"
                  className="open-camera-btn"
                  onClick={() => setShowCamera(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Open Camera
                </button>
              ) : (
                <div className="file-preview-row">
                  {selectedFile.type.startsWith("image/") ? (
                    <img src={filePreviewUrl!} alt="Preview" className="file-thumb" />
                  ) : (
                    <video src={filePreviewUrl!} className="file-thumb" muted />
                  )}
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    {capturedAt && (
                      <span className="file-time">{capturedAt.toLocaleString()}</span>
                    )}
                    <button
                      type="button"
                      className="reopen-camera"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreviewUrl(null);
                        setShowCamera(true);
                      }}
                    >
                      Recapture
                    </button>
                  </div>
                </div>
              )}

              {showCamera && (
                <div className="camera-modal-backdrop">
                  <div className="camera-modal">
                    <CameraCapture
                      mode={captureMode}
                      onCapture={handleCameraCapture}
                      onCancel={() => setShowCamera(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File upload flow */}
          {submitMode === "upload" && (
            <div className="field">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,application/pdf"
                onChange={handleFileSelect}
                className="hidden-input"
              />
              {!selectedFile ? (
                <button
                  type="button"
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Tap to select file</span>
                  <small>Images, video, PDF — max 200MB</small>
                </button>
              ) : (
                <div className="file-preview-row">
                  {selectedFile.type.startsWith("image/") && filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview" className="file-thumb" />
                  ) : (
                    <div className="file-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                      </svg>
                    </div>
                  )}
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button
                      type="button"
                      className="reopen-camera"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GPS panel */}
          {submitMode && (
            <div className="field">
              <label>GPS Geotag</label>
              <GPSStatusBadge
                status={gpsStatus}
                coords={coords}
                error={gpsError}
                onRequest={requestGPS}
                onClear={clearGPS}
              />
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="error-banner">{submitError}</div>
          )}

          {/* Submit */}
          {submitMode && (
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !selectedFile || !caseId || !title}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" />
                  {isOnline ? "Submitting…" : "Saving offline…"}
                </>
              ) : isOnline ? (
                "Submit Evidence"
              ) : (
                "Save to Offline Queue"
              )}
            </button>
          )}
        </form>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #0f1117;
          padding: 24px 16px 48px;
          color: white;
        }
        .container {
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .page-header { padding-bottom: 4px; }
        .page-header h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: #f9fafb; }
        .page-header p { font-size: 13px; color: #6b7280; margin: 0; }
        .form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 13px; font-weight: 500; color: #9ca3af; }
        input[type="text"], textarea {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
        }
        .input-with-icon { position: relative; width: 100%; }
        .input-with-icon input[type="text"], .input-with-icon textarea {
          padding-left: 40px;
        }
        .input-with-icon .input-icon {
          position: absolute;
          left: 12px;
          top: 10px;
          color: #9ca3af;
          width: 18px;
          height: 18px;
          pointer-events: none;
        }
        input:focus, textarea:focus { border-color: rgba(59,130,246,0.6); }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        .method-tabs { display: flex; gap: 8px; }
        .method-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #9ca3af;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .method-tab.active {
          border-color: rgba(59,130,246,0.5);
          background: rgba(59,130,246,0.1);
          color: #60a5fa;
        }
        .capture-type-row { display: flex; gap: 6px; margin-bottom: 10px; }
        .capture-type-btn {
          padding: 5px 14px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #6b7280;
          font-size: 13px;
          cursor: pointer;
        }
        .capture-type-btn.active {
          border-color: rgba(59,130,246,0.4);
          background: rgba(59,130,246,0.1);
          color: #60a5fa;
        }
        .open-camera-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1.5px dashed rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.03);
          color: #9ca3af;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .open-camera-btn:hover {
          border-color: rgba(59,130,246,0.4);
          color: #60a5fa;
          background: rgba(59,130,246,0.05);
        }
        .upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 24px;
          border-radius: 10px;
          border: 1.5px dashed rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.03);
          color: #9ca3af;
          cursor: pointer;
          text-align: center;
        }
        .upload-zone span { font-size: 14px; font-weight: 500; color: #d1d5db; }
        .upload-zone small { font-size: 12px; color: #4b5563; }
        .hidden-input { display: none; }
        .file-preview-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }
        .file-thumb {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .file-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          color: #6b7280;
          flex-shrink: 0;
        }
        .file-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .file-name { font-size: 13px; color: #e5e7eb; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size, .file-time { font-size: 11px; color: #6b7280; }
        .reopen-camera {
          font-size: 12px;
          color: #60a5fa;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 2px;
          text-align: left;
        }
        .camera-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .camera-modal {
          width: 100%;
          max-width: 480px;
          background: #111827;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #f87171;
        }
        .submit-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s;
        }
        .submit-btn:hover:not(:disabled) { background: #1d4ed8; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}