"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

let lastSoundPlay = 0;

const playNotificationSound = () => {
  if (typeof window !== "undefined") {
    const now = Date.now();
    // Throttle sound to play at most once every 1 second
    if (now - lastSoundPlay > 1000) {
      lastSoundPlay = now;
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5; // keep it subtle
      audio.play().catch(() => {
        // Autoplay may be blocked if user hasn't interacted yet
      });
    }
  }
};

function showToast({ title, description, variant = "default" }: ToastOptions) {
  playNotificationSound();

  if (variant === "destructive") {
    return sonnerToast.error(title, { description });
  }

  return sonnerToast(title, { description });
}

export function useToast() {
  return { toast: showToast };
}

export { showToast as toast };
