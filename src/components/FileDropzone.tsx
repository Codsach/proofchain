"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
  "video/mp4": [".mp4"],
  "text/plain": [".log"],
  "application/octet-stream": [".pcap"],
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILES = 3;

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export function FileDropzone({ files, onChange, error }: Props) {
  const [dropError, setDropError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setDropError(null);

      if (rejected.length > 0) {
        const reasons = rejected
          .map((r) => r.errors.map((e) => e.message).join(", "))
          .join("; ");
        setDropError(reasons);
        return;
      }

      const combined = [...files, ...accepted].slice(0, MAX_FILES);
      onChange(combined);
    },
    [files, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES - files.length,
    disabled: files.length >= MAX_FILES,
  });

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayError = error || dropError;

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer
          transition-colors duration-150
          ${
            isDragActive
              ? "border-teal-500 bg-teal-950/20"
              : files.length >= MAX_FILES
              ? "border-border bg-muted/20 cursor-not-allowed opacity-50"
              : "border-border hover:border-teal-700 hover:bg-muted/10"
          }
          ${displayError ? "border-destructive" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {files.length >= MAX_FILES
              ? "Maximum 3 files reached"
              : isDragActive
              ? "Drop files here…"
              : "Drag & drop evidence files here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            JPG, PNG, PDF, MP4, LOG, PCAP · Max 50 MB each · Up to 3 files
          </p>
        </div>
      </div>

      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-md bg-muted/30 border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} · {file.type || "unknown type"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-3 text-muted-foreground hover:text-destructive text-xs shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}