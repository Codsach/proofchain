import { useState, useEffect, useCallback, useRef } from "react";

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  capturedAt: Date;
}

export type GPSStatus =
  | "idle"
  | "requesting"
  | "acquired"
  | "denied"
  | "unavailable"
  | "timeout";

interface UseGPSOptions {
  autoStart?: boolean;
  highAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGPSReturn {
  coords: GPSCoordinates | null;
  status: GPSStatus;
  error: string | null;
  requestGPS: () => void;
  clearGPS: () => void;
}

export function useGPS(options: UseGPSOptions = {}): UseGPSReturn {
  const {
    autoStart = false,
    highAccuracy = true,
    timeout = 15000,
    maximumAge = 30000,
  } = options;

  const [coords, setCoords] = useState<GPSCoordinates | null>(null);
  const [status, setStatus] = useState<GPSStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation is not supported by this device.");
      return;
    }

    setStatus("requesting");
    setError(null);

    // Clear any existing watch
    clearWatch();

    const geoOptions: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout,
      maximumAge,
    };

    // Use getCurrentPosition for a one-shot accurate fix
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(),
        });
        setStatus("acquired");
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            setStatus("denied");
            setError(
              "Location access denied. Please enable location permissions in your device settings."
            );
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            setStatus("unavailable");
            setError("Location information is unavailable. Try moving to an open area.");
            break;
          case GeolocationPositionError.TIMEOUT:
            setStatus("timeout");
            setError("Location request timed out. Please try again.");
            break;
          default:
            setStatus("unavailable");
            setError("An unknown error occurred while retrieving location.");
        }
      },
      geoOptions
    );
  }, [highAccuracy, timeout, maximumAge, clearWatch]);

  const clearGPS = useCallback(() => {
    clearWatch();
    setCoords(null);
    setStatus("idle");
    setError(null);
  }, [clearWatch]);

  useEffect(() => {
    if (autoStart) {
      requestGPS();
    }
    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return { coords, status, error, requestGPS, clearGPS };
}