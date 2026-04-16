import { useState, useRef, useCallback, useEffect, RefObject } from "react";

export type CameraFacing = "environment" | "user";
export type CaptureMode = "photo" | "video";
export type CameraStatus = "idle" | "initializing" | "active" | "recording" | "error";

export interface CapturedFile {
  file: File;
  previewUrl: string;
  capturedAt: Date;
  mode: CaptureMode;
}

interface UseCameraOptions {
  facing?: CameraFacing;
  mode?: CaptureMode;
}

interface UseCameraReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: string | null;
  capturedFile: CapturedFile | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  takePhoto: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  switchFacing: () => void;
  clearCapture: () => void;
  isRecording: boolean;
  recordingDuration: number;
  facing: CameraFacing;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const [facing, setFacing] = useState<CameraFacing>(options.facing ?? "environment");
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<CapturedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setStatus("idle");
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("initializing");
    setError(null);

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: options.mode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("active");
    } catch (err: unknown) {
      let msg = "Unable to access camera.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Camera access denied. Please allow camera permissions.";
        } else if (err.name === "NotFoundError") {
          msg = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          msg = "Camera is in use by another application.";
        } else {
          msg = err.message;
        }
      }
      setError(msg);
      setStatus("error");
    }
  }, [facing, options.mode]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || status !== "active") return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const now = new Date();
        const fileName = `evidence_${now.toISOString().replace(/[:.]/g, "-")}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);

        setCapturedFile({ file, previewUrl, capturedAt: now, mode: "photo" });
      },
      "image/jpeg",
      0.92
    );
  }, [status]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || status !== "active") return;

    chunksRef.current = [];
    setRecordingDuration(0);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const now = new Date();
      const fileName = `evidence_${now.toISOString().replace(/[:.]/g, "-")}.${ext}`;
      const file = new File([blob], fileName, { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);

      setCapturedFile({ file, previewUrl, capturedAt: now, mode: "video" });
      setIsRecording(false);
      setStatus("active");
    };

    recorder.start(1000); // collect data every second
    setIsRecording(true);
    setStatus("recording");

    // Duration counter
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  }, [status]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [isRecording]);

  const switchFacing = useCallback(() => {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  }, []);

  const clearCapture = useCallback(() => {
    if (capturedFile?.previewUrl) {
      URL.revokeObjectURL(capturedFile.previewUrl);
    }
    setCapturedFile(null);
  }, [capturedFile]);

  // Restart camera when facing changes
  useEffect(() => {
    if (status === "active" || status === "recording") {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedFile?.previewUrl) {
        URL.revokeObjectURL(capturedFile.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
  };
}