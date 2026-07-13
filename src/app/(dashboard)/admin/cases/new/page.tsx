"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutTemplate, Camera, Upload, MapPin, Check, X, Info, FileText } from "lucide-react";
import { CameraCapture } from "@/components/evidence/CameraCapture";
import { GPSStatusBadge } from "@/components/evidence/GPSStatusBadge";
import { useGPS, type GPSCoordinates } from "@/hooks/useGPS";
import { useAuth } from "@/components/providers/AuthContext";
import type { CaptureMode } from "@/hooks/useCamera";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  interface SelectedFileItem {
    file: File;
    previewUrl: string;
    capturedAt?: Date;
  }

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for template cards selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Dynamic visual indicators
  const [draftCaseId, setDraftCaseId] = useState("");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setDraftCaseId(`CAS-${Math.floor(100000 + Math.random() * 900000)}`);
    const dateOpts: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    setFormattedDate(new Date().toLocaleString("en-US", dateOpts).replace(",", ""));
  }, []);

  // GPS
  const { coords, status: gpsStatus, error: gpsError, requestGPS, clearGPS } = useGPS({
    autoStart: true,
    highAccuracy: true,
    maximumAge: 0,
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
      setSelectedTemplateId(null);
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

  const buildFormData = useCallback(() => {
    if (selectedFiles.length === 0 || !title) return null;
    const fd = new FormData();
    selectedFiles.forEach((item) => {
      fd.append("files", item.file, item.file.name); // NOTE: /api/cases expects "files"
    });
    fd.append("title", title);
    fd.append("description", description);
    fd.append("incidentType", incidentType);
    fd.append("incidentDate", refinedCoords ? refinedCoords.capturedAt.toISOString() : new Date().toISOString());

    tags.forEach(tag => fd.append("tags", tag));

    if (refinedCoords) {
      fd.append("gpsLat", String(refinedCoords.latitude));
      fd.append("gpsLng", String(refinedCoords.longitude));
      fd.append("gpsAccuracy", String(refinedCoords.accuracy));
    }
    return fd;
  }, [selectedFiles, title, description, incidentType, tags, refinedCoords]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setIncidentType("other");
    setTags([]);
    selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedFiles([]);
    setSubmitMode(null);
    clearGPS();
    setSelectedTemplateId(null);
    setRefinedCoords(null);
  }, [selectedFiles, clearGPS]);

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0 || !title.trim()) {
      setSubmitError("Title and at least one file are required.");
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
        setTimeout(() => router.push("/admin/cases"), 2000);
      }
    } catch {
      setSubmitError("Submission failed. Network error.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFiles, title, getToken, buildFormData, router, resetForm]);

  if (submitSuccess) {
    return (
      <div className="page">
        <div className="success-card">
          <div className="success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--dash-info)" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Case Created</h2>
          <p>Your new case and initial evidence have been securely submitted. AI analysis is in progress.</p>
          <button className="btn-primary" onClick={() => router.push("/admin/cases")}>
            Go to Archives
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
        <header className="page-header mb-2">
          <div className="flex items-center gap-3 mb-2 justify-center">
            <div className="h-px w-8 bg-slate-400/30" />
            <p className="type-eyebrow">Operative Case Manager</p>
            <div className="h-px w-8 bg-slate-400/30" />
          </div>
          <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg text-center mb-1">
            Initiate New Case
          </h1>
          <p className="text-dash-muted max-w-md mx-auto text-xs text-center">
            Select a template or manually enter case details.
          </p>

          {/* Metadata Strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-dash-muted/80 border-y border-dash-border/40 py-2.5 mt-5 max-w-xl mx-auto">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider text-[9px] text-amber-500">Draft Status</span>
            </div>
            <div className="h-3 w-px bg-dash-border/40" />
            <div>
              Preview Case ID: <span className="font-mono font-bold text-dash-text">{draftCaseId || "Generating..."}</span>
            </div>
            <div className="h-3 w-px bg-dash-border/40" />
            <div>
              Date & Time: <span className="font-semibold text-dash-text">{formattedDate || "Initializing..."}</span>
            </div>
          </div>
        </header>

        <div className="rounded-xl border border-dash-border bg-dash-card p-6 md:p-8 shadow-sm form-card">
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* Group 1: Case Templates */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Case Templates</h3>
                <p className="section-subtitle">Select a template to prefill case configuration (optional)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {CASE_TEMPLATES.map((t) => {
                  const isSelected = selectedTemplateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTemplateId(null);
                          resetForm();
                        } else {
                          setSelectedTemplateId(t.id);
                          applyTemplate(t.id);
                        }
                      }}
                      className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent/50 ${
                        isSelected
                          ? "border-dash-accent bg-dash-accent/5 shadow-[0_0_12px_rgba(var(--dash-accent-rgb),0.15)]"
                          : "border-dash-border bg-dash-card hover:bg-dash-hover/60 hover:border-dash-border/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-semibold tracking-tight transition-colors ${isSelected ? "text-dash-accent" : "text-dash-text group-hover:text-dash-accent"}`}>
                            {t.label}
                          </span>
                          <LayoutTemplate className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-dash-accent" : "text-dash-muted/70 group-hover:text-dash-accent"}`} />
                        </div>
                        <p className="text-xs text-dash-muted line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-dash-muted/70">
                          {t.incidentType.replace("_", " ")}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-dash-accent uppercase tracking-wider flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-dash-accent animate-pulse" />
                            Applied
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Case Information */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Case Information</h3>
                <p className="section-subtitle">Core classifications for index logging</p>
              </div>
              <div className="form-grid">
                {/* Row 1: Case ID & Incident Type */}
                <div className="field col-half">
                  <Label className="field-label">Case ID</Label>
                  <Input
                    type="text"
                    value={draftCaseId || "Generating ID..."}
                    disabled
                    className="bg-dash-input border-dash-border text-dash-muted h-11 rounded-xl cursor-not-allowed opacity-80"
                  />
                </div>

                <div className="field col-half">
                  <Label className="field-label">Incident Type *</Label>
                  <Select value={incidentType} onValueChange={(val) => { setIncidentType(val); setSelectedTemplateId(null); }}>
                    <SelectTrigger className="w-full bg-dash-input border-dash-border text-dash-text h-11 rounded-xl focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-dash-accent transition-all">
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="phishing">Phishing</SelectItem>
                      <SelectItem value="malware">Malware / Ransomware</SelectItem>
                      <SelectItem value="data_breach">Data Breach</SelectItem>
                      <SelectItem value="insider_threat">Insider Threat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Group 3: Evidence Details */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Evidence Details</h3>
                <p className="section-subtitle">Specific description and descriptors of the record</p>
              </div>
              <div className="form-grid">
                {/* Row 2: Evidence Title & Evidence Category */}
                <div className="field col-half">
                  <Label className="field-label">Evidence Title *</Label>
                  <Input
                    type="text"
                    placeholder="Brief description of evidence"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setSelectedTemplateId(null); }}
                    className="bg-dash-input border-dash-border hover:border-dash-accent/40 focus-visible:ring-dash-accent/20 focus-visible:border-dash-accent transition-all text-dash-text h-11 rounded-xl focus-visible:ring-offset-0 focus-visible:outline-none"
                    required
                  />
                </div>

                <div className="field col-half">
                  <Label className="field-label">Evidence Category</Label>
                  <Input
                    type="text"
                    value="Digital Forensic Specimen"
                    disabled
                    className="bg-dash-input border-dash-border text-dash-muted h-11 rounded-xl cursor-not-allowed opacity-80"
                  />
                </div>

                {/* Row 3: Tags & Classification */}
                <div className="field col-half">
                  <Label className="field-label">Evidence Tags</Label>
                  <Input
                    type="text"
                    placeholder="Press Enter or comma to insert tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="bg-dash-input border-dash-border hover:border-dash-accent/40 focus-visible:ring-dash-accent/20 focus-visible:border-dash-accent transition-all text-dash-text h-11 rounded-xl focus-visible:ring-offset-0 focus-visible:outline-none"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-dash-border/40 text-[10px] font-bold text-dash-text uppercase tracking-wider border border-dash-border/50">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 font-bold ml-0.5 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="field col-half">
                  <Label className="field-label">Classification Status</Label>
                  <div className="flex items-center h-11 px-3 bg-dash-input border border-dash-border rounded-xl text-xs text-dash-muted gap-2 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono tracking-wider font-semibold text-[10px]">RESTRICTED // CHAIN-OF-CUSTODY AUDITED</span>
                  </div>
                </div>

                {/* Row 4: Description (Full Width) */}
                <div className="field col-full">
                  <Label className="field-label">Description</Label>
                  <Textarea
                    placeholder="Optional: additional context about where and how this was captured"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setSelectedTemplateId(null); }}
                    className="bg-dash-input border-dash-border hover:border-dash-accent/40 focus-visible:ring-dash-accent/20 focus-visible:border-dash-accent transition-all text-dash-text rounded-xl focus-visible:ring-offset-0 focus-visible:outline-none min-h-[90px]"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Group 4: Acquisition & Geotagging */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Acquisition & Geotagging</h3>
                <p className="section-subtitle">Select capture medium and document exact localized origin</p>
              </div>
              <div className="form-grid">
                {/* Row 5: Capture Method (Full Width) */}
                <div className="field col-full">
                  <Label className="field-label">Capture Method *</Label>
                  <div className="method-tabs">
                    <button
                      type="button"
                      className={`method-tab ${submitMode === "camera" ? "active" : ""}`}
                      onClick={() => setSubmitMode("camera")}
                    >
                      <Camera className="w-4 h-4 shrink-0 text-dash-muted" />
                      Use Camera
                    </button>
                    <button
                      type="button"
                      className={`method-tab ${submitMode === "upload" ? "active" : ""}`}
                      onClick={() => setSubmitMode("upload")}
                    >
                      <Upload className="w-4 h-4 shrink-0 text-dash-muted" />
                      Upload File
                    </button>
                  </div>
                </div>

                {/* Row 6: Camera Preview / Upload Area (Full Width) */}
                {submitMode === "camera" && (
                  <div className="field col-full">
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
                              <span className="file-name">{item.file.name}</span>
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
                                Remove Specimen
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
                        <Camera className="w-5 h-5 text-dash-muted" />
                        Add Camera Specimen ({selectedFiles.length}/3)
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

                {submitMode === "upload" && (
                  <div className="field col-full">
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
                                <FileText className="w-6 h-6 text-dash-muted" />
                              </div>
                            )}
                            <div className="file-info">
                              <span className="file-name">{item.file.name}</span>
                              <span className="file-size">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              <button
                                type="button"
                                className="reopen-camera"
                                style={{ color: 'var(--dash-error)' }}
                                onClick={() => handleRemoveFile(idx)}
                              >
                                Remove File
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
                        <Upload className="w-6 h-6 text-dash-muted" />
                        <span>Select Cryptographic Specimen File ({selectedFiles.length}/3)</span>
                        <small>Images, video, PDF — max 200MB per file</small>
                      </button>
                    ) : (
                      <p className="text-xs text-amber-500 font-medium">Maximum limit of 3 files reached.</p>
                    )}
                  </div>
                )}

                {/* Rows 7 & 8: GPS Information & Map (Full Width) */}
                {submitMode && (
                  <div className="field col-full gps-box">
                    <div className="flex items-center gap-1.5 mb-1.5 ml-0.5">
                      <MapPin className="w-4 h-4 text-dash-muted" />
                      <Label className="field-label mb-0">Secure Geotag Origin</Label>
                    </div>
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
                      <div className="w-full mt-3 rounded-xl overflow-hidden border border-dash-border">
                        <LocationPickerMap
                          lat={refinedCoords.latitude}
                          lng={refinedCoords.longitude}
                          accuracy={refinedCoords.accuracy}
                          onChange={handleMapChange}
                        />
                      </div>
                    ) : (
                      (gpsStatus === "denied" || gpsStatus === "unavailable" || gpsStatus === "timeout" || gpsStatus === "idle") && (
                        <Button
                          type="button"
                          variant="link"
                          className="mt-2 text-xs text-dash-accent hover:underline flex items-center gap-1.5 w-fit font-bold uppercase tracking-wider text-left p-0 h-auto"
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
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Group 5: Additional Information */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Additional Information</h3>
                <p className="section-subtitle">System trust standard notes</p>
              </div>
              <div className="rounded-xl border border-dash-border/60 bg-dash-bg/40 p-4 flex gap-3 text-xs leading-relaxed text-dash-muted select-none">
                <Info className="w-5 h-5 text-dash-accent shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-semibold text-dash-text">Blockchain Integrity & Compliance</p>
                  <p>
                    All evidence submitted to ProofChain is run through cryptographic hashing (SHA-256) on device and anchored to the tamper-evident ledger. The localized coordinates and device timestamp are cryptographically bound, ensuring strict compliance with legal chain-of-custody standards. Modifying files after creation will invalidate their signature.
                  </p>
                </div>
              </div>
            </div>

            {/* Group 6: Submission Area */}
            <div className="form-section pt-6 border-t border-dash-border/40 flex flex-col gap-4">
              {submitError && (
                <div className="error-banner flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0 text-dash-danger" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {submitMode ? (
                  <>
                    <Button
                      type="submit"
                      className="submit-btn w-full sm:flex-1 h-12 bg-dash-accent hover:bg-dash-accent/90 text-white font-semibold rounded-xl shadow-sm transition-all text-base flex items-center justify-center gap-2"
                      disabled={isSubmitting || selectedFiles.length === 0 || !title || !refinedCoords}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-sm mr-2" />
                          Creating Case…
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Create Case
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto h-12 px-6 border-dash-border hover:bg-dash-hover text-dash-text rounded-xl font-medium"
                      onClick={() => router.push("/admin/cases")}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-dash-border hover:bg-dash-hover text-dash-text rounded-xl font-medium"
                    onClick={() => router.push("/admin/cases")}
                  >
                    Cancel / Go Back
                  </Button>
                )}
              </div>
            </div>
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
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .page-header { padding-bottom: 4px; }
        .form { display: flex; flex-direction: column; gap: 32px; }
        .form-section { display: flex; flex-direction: column; gap: 16px; }
        .section-header { border-bottom: 1px solid var(--dash-border); padding-bottom: 8px; margin-bottom: 4px; }
        .section-title { font-size: 15px; font-weight: 600; color: var(--dash-text); }
        .section-subtitle { font-size: 11px; color: var(--dash-muted); margin-top: 1px; }

        .form-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; width: 100%; }
        .col-full { grid-column: span 12; }
        .col-half { grid-column: span 6; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 12px; font-weight: 600; color: var(--dash-muted); margin-bottom: 2px; }

        .method-tabs { display: flex; gap: 12px; }
        .method-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        .method-tab:hover {
          background: var(--dash-hover);
          color: var(--dash-text);
        }
        .method-tab.active {
          border-color: var(--dash-accent);
          background: rgba(16, 185, 129, 0.06);
          color: var(--dash-accent);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.05);
        }
        .capture-type-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .capture-type-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid var(--dash-border);
          background: transparent;
          color: var(--dash-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .capture-type-btn:hover {
          border-color: var(--dash-border-hover);
          color: var(--dash-text);
        }
        .capture-type-btn.active {
          border-color: var(--dash-accent);
          background: rgba(16, 185, 129, 0.06);
          color: var(--dash-accent);
        }
        .open-camera-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: 1.5px dashed var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          font-size: 14px;
          font-weight: 600;
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
          padding: 32px;
          border-radius: 12px;
          border: 1.5px dashed var(--dash-border);
          background: var(--dash-input);
          color: var(--dash-muted);
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }
        .upload-zone:hover {
          border-color: var(--dash-accent);
          background: var(--dash-hover);
        }
        .upload-zone span { font-size: 14px; font-weight: 600; color: var(--dash-text); }
        .upload-zone small { font-size: 11px; color: var(--dash-muted); }
        .hidden-input { display: none; }
        .file-preview-row {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--dash-border);
          background: var(--dash-input);
        }
        .file-thumb {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          border: 1px solid var(--dash-border);
        }
        .file-icon {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--dash-bg);
          border-radius: 8px;
          color: var(--dash-muted);
          flex-shrink: 0;
          border: 1px solid var(--dash-border);
        }
        .file-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .file-name { font-size: 13px; color: var(--dash-text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size, .file-time { font-size: 11px; color: var(--dash-muted); }
        .reopen-camera {
          font-size: 12px;
          font-weight: 600;
          color: var(--dash-accent);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 4px;
          text-align: left;
          width: fit-content;
        }
        .reopen-camera:hover {
          text-decoration: underline;
        }
        .camera-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
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
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: var(--dash-danger);
          font-weight: 500;
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

        @media (max-width: 767px) {
          .col-half {
            grid-column: span 12;
          }
          .form-grid {
            gap: 16px;
          }
          .form-card {
            padding: 20px 16px !important;
          }
          .method-tabs {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
