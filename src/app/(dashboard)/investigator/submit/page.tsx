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
    autoStart: true,
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

        <div className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 md:p-8 shadow-2xl form-card">
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="file-name">{selectedFile.name}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="file-name">{selectedFile.name}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
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
            <div className="field gps-box">
              <label>GPS Geotag</label>
              <GPSStatusBadge
                status={gpsStatus}
                coords={coords}
                error={gpsError}
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
              disabled={isSubmitting || !selectedFile || !caseId || !title || !coords || gpsStatus !== "acquired"}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" />
                  {isOnline ? "Submitting…" : "Saving offline…"}
                </>
              ) : gpsStatus === "requesting" ? (
                <>
                  <span className="spinner-sm" />
                  Acquiring GPS...
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
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: transparent;
          padding: 24px 16px 48px;
          color: white;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-card {
          /* specific padding/margin tweaks can go here if needed */
        }
        .page-header { padding-bottom: 4px; text-align: center; }
        .page-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 6px; color: #f8fafc; }
        .page-header p { font-size: 14px; color: #94a3b8; margin: 0; }
        .form { display: flex; flex-direction: column; gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 14px; font-weight: 600; color: #cbd5e1; }
        input[type="text"], textarea {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          color: white;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
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
          color: #64748b;
          width: 18px;
          height: 18px;
          pointer-events: none;
        }
        input:focus, textarea:focus { 
          border-color: #06b6d4; 
          box-shadow: 0 0 0 1px #06b6d4;
          background: #0f172a;
        }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        .method-tabs { display: flex; gap: 8px; }
        .method-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .method-tab:hover { background: #334155; color: #e2e8f0; }
        .method-tab.active {
          border-color: #06b6d4;
          background: rgba(6,182,212,0.1);
          color: #22d3ee;
        }
        .capture-type-row { display: flex; gap: 6px; margin-bottom: 8px; }
        .capture-type-btn {
          flex: 1;
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .capture-type-btn:hover { background: #334155; color: #e2e8f0; }
        .capture-type-btn.active {
          border-color: #06b6d4;
          background: rgba(6,182,212,0.1);
          color: #22d3ee;
        }
        .open-camera-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1.5px dashed #475569;
          background: rgba(30,41,59,0.5);
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .open-camera-btn:hover {
          border-color: #06b6d4;
          color: #22d3ee;
          background: rgba(6,182,212,0.05);
        }
        .upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 20px;
          border-radius: 8px;
          border: 1.5px dashed #475569;
          background: rgba(30,41,59,0.5);
          color: #cbd5e1;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .upload-zone:hover {
          border-color: #06b6d4;
          background: rgba(6,182,212,0.05);
        }
        .upload-zone span { font-size: 14px; font-weight: 500; color: #e2e8f0; }
        .upload-zone small { font-size: 12px; color: #94a3b8; }
        .hidden-input { display: none; }
        .file-preview-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #1e293b;
        }
        .file-thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
          border: 1px solid #334155;
        }
        .file-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          border-radius: 6px;
          color: #64748b;
          flex-shrink: 0;
          border: 1px solid #334155;
        }
        .file-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .file-name { font-size: 13px; color: #f8fafc; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size, .file-time { font-size: 11px; color: #94a3b8; }
        .reopen-camera {
          font-size: 12px;
          color: #06b6d4;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 2px;
          text-align: left;
          font-weight: 500;
        }
        .reopen-camera:hover { color: #22d3ee; text-decoration: underline; }
        .gps-box {
          background: rgba(15,23,42,0.4);
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 12px;
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
          background: #0f172a;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #334155;
        }
        .error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #fca5a5;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          background: #06b6d4;
          color: #082f49;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(6,182,212,0.2);
        }
        .submit-btn:hover:not(:disabled) { 
          background: #22d3ee; 
          box-shadow: 0 4px 16px rgba(6,182,212,0.3);
          transform: translateY(-1px);
        }
        .submit-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
          box-shadow: none;
          transform: none;
        }
        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(8,47,73,0.3);
          border-top-color: #082f49;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}