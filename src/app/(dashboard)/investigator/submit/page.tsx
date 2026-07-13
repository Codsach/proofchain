"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { CameraCapture } from "@/components/evidence/CameraCapture";
import { GPSStatusBadge } from "@/components/evidence/GPSStatusBadge";
import { OfflineQueueIndicator } from "@/components/evidence/OfflineQueueIndicator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useGPS, type GPSCoordinates } from "@/hooks/useGPS";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useAuth } from "@/components/providers/AuthContext";
import type { CaptureMode } from "@/hooks/useCamera";

type SubmitMode = "camera" | "upload";

// Dynamically import the Leaflet map component to prevent Next.js SSR document/window issues
const LocationPickerMap = dynamic(
  () => import("@/components/evidence/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] w-full bg-dash-sidebar animate-pulse rounded-xl border border-dash-border flex items-center justify-center mt-3">
        <span className="text-xs text-dash-muted uppercase tracking-wider">Loading Map Interface...</span>
      </div>
    ),
  }
);


export default function SubmitEvidencePage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [submitMode, setSubmitMode] = useState<SubmitMode | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photo");
  const [showCamera, setShowCamera] = useState(false);

  interface SelectedFileItem {
    file: File;
    previewUrl: string;
    capturedAt?: Date;
  }

  // Form fields
  const [caseId, setCaseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mockHashes, setMockHashes] = useState<string[]>([]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      const hashes = selectedFiles.map(item => {
        const hash = Array.from(item.file.name + item.file.size)
          .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
          .toString(16)
          .padStart(8, '0');
        return `f02b9e83a9a834d89a74421b${hash}d73c71ea4012e8790ba45112e`;
      });
      setMockHashes(hashes);
    } else {
      setMockHashes([]);
    }
  }, [selectedFiles]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // High-accuracy browser Geolocation hook
  const { coords, status: gpsStatus, error: gpsError, requestGPS, clearGPS } = useGPS({
    autoStart: true,
    highAccuracy: true,
    maximumAge: 0, // Force fresh coordinates lookup, bypassing browser cache
    timeout: 10000,
  });

  // Manage refined coordinates state (allows dragging marker / clicking map)
  const [refinedCoords, setRefinedCoords] = useState<GPSCoordinates | null>(null);
  const lastCoordsRef = useRef<GPSCoordinates | null>(null);

  // Auto-sync refined location when a new automatic geolocation fix is acquired
  useEffect(() => {
    if (coords && coords !== lastCoordsRef.current) {
      setRefinedCoords(coords);
      lastCoordsRef.current = coords;
    }
  }, [coords]);

  // Handle map selection/drag refinement
  const handleMapChange = useCallback((lat: number, lng: number) => {
    setRefinedCoords((prev) => {
      const now = new Date();
      if (!prev) {
        return {
          latitude: lat,
          longitude: lng,
          altitude: null,
          accuracy: 15, // manual entry estimation
          capturedAt: now,
        };
      }
      return {
        ...prev,
        latitude: lat,
        longitude: lng,
        capturedAt: now,
      };
    });
  }, []);

  // Offline queue
  const { queue, isOnline, addToQueue, syncQueue, removeFromQueue, isSyncing, pendingCount } =
    useOfflineQueue(getToken);

  const handleCameraCapture = useCallback(
    (file: File, capturedAt: Date, mode: CaptureMode) => {
      setSelectedFiles((prev) => {
        if (prev.length >= 3) return prev;
        return [
          ...prev,
          {
            file,
            previewUrl: URL.createObjectURL(file),
            capturedAt,
          },
        ];
      });
      setShowCamera(false);
      // Auto-fill title if empty
      setTitle((t) => t || `Field ${mode === "photo" ? "Photo" : "Video"} - ${capturedAt.toLocaleDateString()}`);
    },
    []
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    setSelectedFiles((prev) => {
      const newItems: SelectedFileItem[] = [];
      const remainingSlots = 3 - prev.length;

      for (let i = 0; i < Math.min(filesArray.length, remainingSlots); i++) {
        const file = filesArray[i];
        newItems.push({
          file,
          previewUrl: URL.createObjectURL(file),
          capturedAt: new Date(),
        });
      }

      if (filesArray.length > remainingSlots) {
        setSubmitError(`Only up to 3 files can be selected. Extra files were ignored.`);
      }

      return [...prev, ...newItems];
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return updated;
    });
  }, []);

  const resetForm = useCallback(() => {
    // Retain caseId so investigators can easily submit multiple files sequentially!
    setTitle("");
    setDescription("");
    selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedFiles([]);
    setSubmitMode(null);
    clearGPS();
    setRefinedCoords(null);
  }, [selectedFiles, clearGPS]);

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0 || !caseId.trim() || !title.trim()) {
      setSubmitError("Case ID, title, and at least one file are required.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const token = await getToken();

    // Helper to queue a single file offline
    const queueFile = async (item: SelectedFileItem, index: number) => {
      await addToQueue({
        caseId,
        title: selectedFiles.length > 1 ? `${title} (${index + 1}/${selectedFiles.length})` : title,
        description: description || `Uploaded file: ${item.file.name}`,
        fileName: item.file.name,
        fileType: item.file.type,
        fileSize: item.file.size,
        fileBlob: item.file,
        latitude: refinedCoords?.latitude ?? null,
        longitude: refinedCoords?.longitude ?? null,
        altitude: refinedCoords?.altitude ?? null,
        gpsAccuracy: refinedCoords?.accuracy ?? null,
        capturedAt: item.capturedAt?.toISOString() ?? refinedCoords?.capturedAt.toISOString() ?? new Date().toISOString(),
        captureMethod: submitMode === "camera" ? "camera" : "upload",
        deviceInfo: JSON.stringify({ userAgent: navigator.userAgent }),
      });
    };

    // Helper to upload a single file directly
    const uploadFile = async (item: SelectedFileItem, index: number) => {
      const fd = new FormData();
      fd.append("file", item.file, item.file.name);
      fd.append("caseId", caseId);
      fd.append("title", selectedFiles.length > 1 ? `${title} (${index + 1}/${selectedFiles.length})` : title);
      fd.append("description", description);
      fd.append("captureMethod", submitMode === "camera" ? "camera" : "upload");
      if (refinedCoords) {
        fd.append("latitude", String(refinedCoords.latitude));
        fd.append("longitude", String(refinedCoords.longitude));
        if (refinedCoords.altitude !== null) fd.append("altitude", String(refinedCoords.altitude));
        fd.append("gpsAccuracy", String(refinedCoords.accuracy));
        fd.append("capturedAt", item.capturedAt?.toISOString() ?? refinedCoords.capturedAt.toISOString());
      }
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      };
      fd.append("deviceInfo", JSON.stringify(deviceInfo));

      const res = await fetch("/api/evidence/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Upload failed for ${item.file.name}`);
      }
    };

    // If offline, queue all of them
    if (!isOnline || !token) {
      try {
        for (let i = 0; i < selectedFiles.length; i++) {
          await queueFile(selectedFiles[i], i);
        }
        setSubmitSuccess(true);
        resetForm();
      } catch {
        setSubmitError("Failed to queue submission. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Online: upload each
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadFile(selectedFiles[i], i);
      }
      setSubmitSuccess(true);
      resetForm();
    } catch (err: any) {
      console.error(err);
      // Queue all of them on failure
      try {
        for (let i = 0; i < selectedFiles.length; i++) {
          await queueFile(selectedFiles[i], i);
        }
        setSubmitSuccess(true);
        resetForm();
      } catch {
        setSubmitError(err.message || "Submission failed and offline queue is unavailable.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedFiles,
    caseId,
    title,
    description,
    refinedCoords,
    submitMode,
    isOnline,
    getToken,
    addToQueue,
    resetForm,
  ]);

  if (submitSuccess) {
    return (
      <div className="flex justify-center items-center w-full py-12">
        <div className="relative z-10 success-card">
          <div className="success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--dash-info)" strokeWidth="2">
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
          <div className="flex flex-col gap-2.5 w-full">
            <button className="btn-primary" onClick={() => setSubmitSuccess(false)}>
              Submit Another Evidence
            </button>
            <button className="btn-secondary" onClick={() => router.push("/investigator")}>
              Go to Dashboard
            </button>
          </div>
        </div>
        <style jsx>{`
          .page { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 24px; background: transparent; }
          .success-card { text-align: center; max-width: 400px; width: 100%; padding: 32px; border-radius: 16px; border: 1px solid var(--dash-border); background: var(--dash-card); display: flex; flex-direction: column; align-items: center; }
          .success-icon { margin: 0 auto 16px; width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.1); display: flex; align-items: center; justify-content: center; }
          h2 { color: var(--dash-text); font-size: 20px; margin: 0 0 8px; font-weight: 700; }
          p { color: var(--dash-muted); font-size: 14px; margin: 0 0 24px; font-weight: 500; }
          .btn-primary { background: var(--dash-accent); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; width: 100%; }
          .btn-primary:hover { opacity: 0.9; }
          .btn-secondary { background: transparent; border: 1px solid var(--dash-border); color: var(--dash-text); padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: 100%; }
          .btn-secondary:hover { background: var(--dash-hover); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="container px-4 py-6">
        <header className="page-header mb-8">
          <div className="flex items-center gap-3 mb-2 justify-center">
            <p className="type-eyebrow text-xs font-bold uppercase tracking-[0.2em] text-dash-muted">
              Forensic Capture Module
            </p>
          </div>
          <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg text-center">
            Submit Evidence
          </h1>
          <p className="mt-2 text-dash-muted font-medium max-w-md mx-auto text-sm text-center">
            All submissions are hashed, IPFS-stored, and blockchain-anchored.
          </p>
        </header>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left Column: Form (75% width) */}
          <div className="lg:col-span-9 rounded-xl border border-dash-border bg-dash-card p-6 md:p-8 shadow-sm form-card">
            
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
              {/* Evidence Information Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide text-dash-text">
                  Evidence Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Case ID */}
                  <div className="field">
                    <label>Case ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. CASE-2024-001"
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      required
                    />
                  </div>

                  {/* Title */}
                  <div className="field">
                    <label>Evidence Title *</label>
                    <input
                      type="text"
                      placeholder="Brief description of evidence"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Evidence Details Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide text-dash-text">
                  Evidence Details
                </h3>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    placeholder="Optional: additional context about where and how this was captured"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Capture Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide text-dash-text">
                  Capture
                </h3>
                
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
                  <div className="field space-y-3">
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

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {selectedFiles.map((item, idx) => (
                          <div key={idx} className="file-preview-row">
                            {item.file.type.startsWith("image/") ? (
                              <img src={item.previewUrl} alt="Preview" className="file-thumb" />
                            ) : (
                              <video src={item.previewUrl} className="file-thumb" muted />
                            )}
                            <div className="file-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="file-name">{item.file.name}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dash-info)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                              </div>
                              <span className="file-size">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              {item.capturedAt && (
                                <span className="file-time">{item.capturedAt.toLocaleString()}</span>
                              )}
                              <button
                                type="button"
                                className="reopen-camera"
                                style={{ color: 'var(--dash-error)' }}
                                onClick={() => handleRemoveFile(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedFiles.length < 3 ? (
                      <button
                        type="button"
                        className="open-camera-btn"
                        onClick={() => setShowCamera(true)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        Add Photo / Video ({selectedFiles.length}/3)
                      </button>
                    ) : (
                      <p className="text-xs text-amber-500 font-medium">Maximum limit of 3 files reached.</p>
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
                      multiple
                      accept="image/*,video/mp4,video/webm,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden-input"
                    />

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {selectedFiles.map((item, idx) => (
                          <div key={idx} className="file-preview-row">
                            {item.file.type.startsWith("image/") ? (
                              <img src={item.previewUrl} alt="Preview" className="file-thumb" />
                            ) : item.file.type.startsWith("video/") ? (
                              <video src={item.previewUrl} className="file-thumb" muted />
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
                                <span className="file-name">{item.file.name}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dash-info)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                              </div>
                              <span className="file-size">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              <button
                                type="button"
                                className="reopen-camera"
                                style={{ color: 'var(--dash-error)' }}
                                onClick={() => handleRemoveFile(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedFiles.length < 3 ? (
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
                        <span>Select File ({selectedFiles.length}/3)</span>
                        <small>Images, video, PDF — max 200MB per file</small>
                      </button>
                    ) : (
                      <p className="text-xs text-amber-500 font-medium">Maximum limit of 3 files reached.</p>
                    )}
                  </div>
                )}
              </div>

              {/* GPS & Location Group */}
              {submitMode && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-wide text-dash-text">
                    GPS & Location
                  </h3>
                  <div className="field gps-box">
                    <label>GPS Geotag</label>
                    <GPSStatusBadge
                      status={refinedCoords ? "acquired" : gpsStatus}
                      coords={refinedCoords}
                      error={gpsError}
                      onRequest={requestGPS}
                      onClear={() => {
                        clearGPS();
                        setRefinedCoords(null);
                      }}
                    />
                    
                    {refinedCoords ? (
                      <LocationPickerMap
                        lat={refinedCoords.latitude}
                        lng={refinedCoords.longitude}
                        accuracy={refinedCoords.accuracy}
                        onChange={handleMapChange}
                      />
                    ) : (
                      (gpsStatus === "denied" || gpsStatus === "unavailable" || gpsStatus === "timeout" || gpsStatus === "idle") && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-dash-accent hover:underline flex items-center gap-1.5 w-fit font-bold uppercase tracking-wider"
                          onClick={() => {
                            setRefinedCoords({
                              latitude: 40.7128,
                              longitude: -74.0060,
                              altitude: null,
                              accuracy: 15,
                              capturedAt: new Date(),
                            });
                          }}
                        >
                          📍 Pin Location Manually on Map
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Submission Group */}
              {submitMode && (
                <div className="space-y-4 pt-6 border-t border-dash-border/40 mt-4">
                  <h3 className="text-sm font-bold tracking-wide text-dash-text">
                    Submission
                  </h3>
                  
                  {submitError && (
                    <div className="error-banner">{submitError}</div>
                  )}

                  <div className="p-4 rounded-lg bg-dash-input/30 border border-dash-border/60">
                    <p className="text-xs text-dash-muted mb-4 leading-relaxed">
                      Review all evidence details. Upon submission, an immutable SHA-256 hash is generated, custody records are logged on the Ethereum Sepolia ledger, and the raw file is pinned to IPFS.
                    </p>
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isSubmitting || selectedFiles.length === 0 || !caseId || !title || !refinedCoords}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-sm" />
                          {isOnline ? "Submitting Record…" : "Saving offline…"}
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
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Capture Guide & Node Status (25% width) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Chain Processing Preview */}
            <Card className="border border-dash-border bg-dash-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-dash-border pb-3">
                <CardTitle className="text-xs font-bold text-dash-text uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedFiles.length > 0 ? "bg-amber-500 animate-pulse" : "bg-dash-muted"}`} />
                  Chain Processing Preview
                </CardTitle>
                <CardDescription className="text-[10px] text-dash-muted uppercase tracking-wider">
                  immutable tracking ledger
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 font-mono text-[10px]">
                <div className="space-y-2">
                  <span className="text-dash-muted font-bold uppercase tracking-wider block">SHA-256 Hash(es)</span>
                  {mockHashes.length === 0 ? (
                    <span className="text-dash-text break-all font-semibold block bg-dash-input/50 p-2 rounded text-[9px] border border-dash-border/30">
                      Awaiting file selection...
                    </span>
                  ) : (
                    <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                      {mockHashes.map((h, i) => (
                        <div key={i} className="text-dash-text break-all font-semibold bg-dash-input/50 p-1.5 rounded text-[8px] border border-dash-border/30">
                          <span className="text-[7px] text-dash-muted block truncate font-sans mb-0.5">{selectedFiles[i]?.file.name}</span>
                          {h}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-dash-border/30">
                  <span className="text-dash-muted font-bold uppercase tracking-wider">IPFS Status</span>
                  <span className={`font-bold uppercase ${selectedFiles.length > 0 ? "text-amber-500" : "text-dash-muted"}`}>
                    {selectedFiles.length > 0 ? "Ready to Pin" : "Awaiting Media"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dash-border/30">
                  <span className="text-dash-muted font-bold uppercase tracking-wider">Blockchain Node</span>
                  <span className={`font-bold uppercase ${selectedFiles.length > 0 ? "text-amber-500" : "text-dash-muted"}`}>
                    {selectedFiles.length > 0 ? "Tx Gen Pending" : "Awaiting Media"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dash-border/30">
                  <span className="text-dash-muted font-bold uppercase tracking-wider">AI Verification</span>
                  <span className={`font-bold uppercase ${selectedFiles.length > 0 ? "text-amber-500" : "text-dash-muted"}`}>
                    {selectedFiles.length > 0 ? "Queued" : "Awaiting Media"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Capture Guide */}
            <Card className="border border-dash-border bg-dash-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-dash-border pb-3">
                <CardTitle className="text-xs font-bold text-dash-text uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-dash-accent animate-pulse" />
                  Forensic Capture Guide
                </CardTitle>
                <CardDescription className="text-[10px] text-dash-muted uppercase tracking-wider">
                  compliance parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {[
                  {
                    title: "Good lighting",
                    desc: "Ensure evidence is captured in adequate lighting for clarity and automated verification.",
                  },
                  {
                    title: "GPS enabled",
                    desc: "High-accuracy GPS coordinates must be embedded for geospatial validation.",
                  },
                  {
                    title: "Original file",
                    desc: "Do not compress or screenshot the file; upload the raw original media.",
                  },
                  {
                    title: "Don't crop image",
                    desc: "Keep the original aspect ratio and metadata intact to prevent hash mismatches.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-dash-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-dash-text uppercase tracking-wider">{item.title}</p>
                      <p className="text-[10px] text-dash-muted font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Node Status */}
            <Card className="border border-dash-border bg-dash-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-dash-border pb-3">
                <CardTitle className="text-xs font-bold text-dash-text uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-dash-accent" />
                  System Node Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-dash-muted font-bold uppercase tracking-wider text-[10px]">IPFS Node Connection</span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-mono text-dash-text font-bold text-[10px] uppercase">Active</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-dash-border/30">
                  <span className="text-dash-muted font-bold uppercase tracking-wider text-[10px]">Blockchain Network</span>
                  <span className="font-mono text-dash-text font-bold text-[10px] uppercase">Ethereum Sepolia</span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-dash-border/30">
                  <span className="text-dash-muted font-bold uppercase tracking-wider text-[10px]">Smart Contract</span>
                  <span className="font-mono text-dash-accent font-bold text-[10px] uppercase">CustodyTracker v1.2</span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-dash-border/30">
                  <span className="text-dash-muted font-bold uppercase tracking-wider text-[10px]">Cryptography</span>
                  <span className="font-mono text-dash-text font-bold text-[10px] uppercase">SHA-256 Hash</span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .form-card {
          width: 100%;
        }
        .page-header { padding-bottom: 4px; text-align: center; width: 100%; }
        .form { display: flex; flex-direction: column; gap: 28px; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 13px; font-weight: 600; color: var(--dash-muted); }
        input[type="text"], textarea {
          background: var(--dash-input);
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          color: var(--dash-text);
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
        }
        input:focus, textarea:focus { 
          border-color: var(--dash-accent); 
          background: var(--dash-hover);
        }
        input::placeholder, textarea::placeholder { color: var(--dash-muted); opacity: 0.5; }
        .method-tabs { display: flex; gap: 8px; }
        .method-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .method-tab:hover { background: var(--dash-hover); color: var(--dash-text); }
        .method-tab.active {
          border-color: var(--dash-accent);
          background: rgba(30, 41, 59, 0.08);
          color: var(--dash-accent);
        }
        .capture-type-row { display: flex; gap: 6px; margin-bottom: 8px; }
        .capture-type-btn {
          flex: 1;
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .capture-type-btn:hover { background: var(--dash-hover); color: var(--dash-text); }
        .capture-type-btn.active {
          border-color: var(--dash-accent);
          background: rgba(30, 41, 59, 0.08);
          color: var(--dash-accent);
        }
        .open-camera-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1.5px dashed var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .open-camera-btn:hover {
          border-color: var(--dash-accent);
          color: var(--dash-accent);
          background: var(--dash-hover);
        }
        .upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 24px;
          border-radius: 8px;
          border: 1.5px dashed var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .upload-zone:hover {
          border-color: var(--dash-accent);
          background: var(--dash-hover);
        }
        .upload-zone span { font-size: 14px; font-weight: 500; color: var(--dash-text); }
        .upload-zone small { font-size: 12px; color: var(--dash-muted); }
        .hidden-input { display: none; }
        .file-preview-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--dash-border);
          background: var(--dash-input);
        }
        .file-thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
          border: 1px solid var(--dash-border);
        }
        .file-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--dash-bg);
          border-radius: 6px;
          color: var(--dash-muted);
          flex-shrink: 0;
          border: 1px solid var(--dash-border);
        }
        .file-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .file-name { font-size: 13px; color: var(--dash-text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size, .file-time { font-size: 11px; color: var(--dash-muted); }
        .reopen-camera {
          font-size: 12px;
          color: var(--dash-accent);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 2px;
          text-align: left;
          font-weight: 500;
        }
        .reopen-camera:hover { color: var(--dash-accent); text-decoration: underline; }
        .gps-box {
          background: var(--dash-card);
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          padding: 14px;
        }
        .camera-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .camera-modal {
          width: 100%;
          max-width: 640px;
          background: #09090b;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--dash-danger);
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          background: var(--dash-accent);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) { 
          opacity: 0.9;
        }
        .submit-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
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