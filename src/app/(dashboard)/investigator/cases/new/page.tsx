"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FolderSearch, FileText, AlignLeft, Tags, LayoutTemplate } from "lucide-react";
import { CameraCapture } from "@/components/evidence/CameraCapture";
import { GPSStatusBadge } from "@/components/evidence/GPSStatusBadge";
import { useGPS } from "@/hooks/useGPS";
import { useAuth } from "@/components/providers/AuthContext";
import type { CaptureMode } from "@/hooks/useCamera";
import { Badge } from "@/components/ui/badge";

type SubmitMode = "camera" | "upload";

const CASE_TEMPLATES = [
  {
    id: "phishing",
    label: "Phishing Campaign",
    incidentType: "phishing",
    title: "Phishing Email Investigation",
    description: "Suspicious email campaign targeting internal employees. Contains potentially malicious attachments or links.",
  },
  {
    id: "malware",
    label: "Ransomware / Malware",
    incidentType: "malware",
    title: "Malware Infection Analysis",
    description: "System infected with suspected malware. Requesting cryptographic baseline and behavior analysis.",
  },
  {
    id: "breach",
    label: "Data Exfiltration",
    incidentType: "data_breach",
    title: "Unauthorized Data Exfiltration",
    description: "Evidence of unauthorized data access and transfer outside the secure perimeter.",
  },
];

export default function CreateCasePage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [submitMode, setSubmitMode] = useState<SubmitMode | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photo");
  const [showCamera, setShowCamera] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const applyTemplate = (templateId: string) => {
    const t = CASE_TEMPLATES.find((x) => x.id === templateId);
    if (t) {
      setTitle(t.title);
      setDescription(t.description);
      setIncidentType(t.incidentType);
    }
  };

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
    if (!selectedFile || !title) return null;
    const fd = new FormData();
    fd.append("files", selectedFile, selectedFile.name); // NOTE: /api/cases expects "files"
    fd.append("title", title);
    fd.append("description", description);
    fd.append("incidentType", incidentType);
    fd.append("incidentDate", coords ? coords.capturedAt.toISOString() : new Date().toISOString());
    
    tags.forEach(tag => fd.append("tags", tag));

    if (coords) {
      fd.append("gpsLat", String(coords.latitude));
      fd.append("gpsLng", String(coords.longitude));
      fd.append("gpsAccuracy", String(coords.accuracy));
    }
    return fd;
  }, [selectedFile, title, description, incidentType, tags, coords]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !title.trim()) {
      setSubmitError("Title and file are required.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const token = await getToken();

    const fd = buildFormData();
    if (!fd) {
      setSubmitError("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/cases", {
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
        setTimeout(() => router.push("/investigator"), 2000);
      }
    } catch {
      setSubmitError("Submission failed. Network error.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, title, description, incidentType, tags, coords, getToken, buildFormData, router]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIncidentType("other");
    setTags([]);
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--dash-info)" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>
            Case Created
          </h2>
          <p>
            Your new case and initial evidence have been securely submitted. AI analysis is in progress.
          </p>
          <button className="btn-primary" onClick={() => setSubmitSuccess(false)}>
            Submit Another
          </button>
        </div>
        <style jsx>{`
          .page { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 24px; background: transparent; }
          .success-card { text-align: center; max-width: 360px; padding: 32px; border-radius: 12px; border: 1px solid var(--dash-border); background: var(--dash-card); }
          .success-icon { margin: 0 auto 16px; width: 72px; height: 72px; border-radius: 50%; background: rgba(100,116,139,0.1); display: flex; align-items: center; justify-content: center; }
          h2 { color: var(--dash-text); font-size: 20px; margin: 0 0 8px; }
          p { color: var(--dash-muted); font-size: 14px; margin: 0 0 24px; }
          .btn-primary { background: var(--dash-accent); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Initiate New Case</h1>
          <p>Select a template or manually enter case details.</p>
        </header>

        <div className="rounded-xl border border-dash-border bg-dash-card p-6 md:p-8 shadow-sm form-card">
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
          <div className="field">
            <label>Case Templates</label>
            <div className="template-cards">
              {CASE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="template-btn"
                >
                  <LayoutTemplate className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Incident Type *</label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="custom-select"
            >
              <option value="other">Other</option>
              <option value="phishing">Phishing</option>
              <option value="malware">Malware / Ransomware</option>
              <option value="data_breach">Data Breach</option>
              <option value="insider_threat">Insider Threat</option>
            </select>
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

          <div className="field">
            <label>Evidence Tags</label>
            <div className="input-with-icon">
              <Tags className="input-icon" />
              <input
                type="text"
                placeholder="Type and press Enter (e.g. priority:high, project-x)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-dash-border/40 text-xs font-bold text-dash-text uppercase tracking-wider">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            )}
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
              disabled={isSubmitting || !selectedFile || !title}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" />
                  Creating Case…
                </>
              ) : (
                "Create Case"
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
          color: var(--dash-text);
        }
        .container {
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .page-header { padding-bottom: 4px; }
        .page-header h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: var(--dash-text); }
        .page-header p { font-size: 13px; color: var(--dash-muted); margin: 0; }
        .form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 13px; font-weight: 500; color: var(--dash-muted); }
        input[type="text"], textarea {
          background: var(--dash-input);
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          color: var(--dash-text);
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
          color: var(--dash-muted);
          width: 18px;
          height: 18px;
          pointer-events: none;
        }
        .custom-select {
          background: var(--dash-input);
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          color: var(--dash-text);
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          width: 100%;
        }
        .custom-select option { background: var(--dash-bg); color: var(--dash-text); }
        input:focus, textarea:focus, .custom-select:focus { border-color: var(--dash-accent); }
        input::placeholder, textarea::placeholder { color: var(--dash-muted); opacity: 0.5; }
        .template-cards {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .template-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(30, 41, 59, 0.08);
          border: 1px solid rgba(30, 41, 59, 0.15);
          color: var(--dash-accent);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .template-btn:hover {
          background: rgba(30, 41, 59, 0.15);
        }
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
          transition: all 0.15s;
        }
        .method-tab.active {
          border-color: var(--dash-accent);
          background: rgba(30, 41, 59, 0.08);
          color: var(--dash-accent);
        }
        .capture-type-row { display: flex; gap: 6px; margin-bottom: 10px; }
        .capture-type-btn {
          padding: 5px 14px;
          border-radius: 6px;
          border: 1px solid var(--dash-border);
          background: transparent;
          color: var(--dash-muted);
          font-size: 13px;
          cursor: pointer;
        }
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
          padding: 14px;
          border-radius: 10px;
          border: 1.5px dashed var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
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
          gap: 8px;
          width: 100%;
          padding: 24px;
          border-radius: 10px;
          border: 1.5px dashed var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          cursor: pointer;
          text-align: center;
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
          background: var(--dash-bg);
          border-radius: 6px;
          color: var(--dash-muted);
          flex-shrink: 0;
        }
        .file-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .file-name { font-size: 13px; color: var(--dash-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
          max-width: 480px;
          background: var(--dash-modal);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid var(--dash-border);
        }
        .error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: var(--dash-danger);
        }
        .submit-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          background: var(--dash-accent);
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
        .submit-btn:hover:not(:disabled) { opacity: 0.9; }
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