"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

function showToast({ title, description, variant = "default" }: ToastOptions) {
  if (variant === "destructive") {
    return sonnerToast.error(title, { description });
  }

  return sonnerToast(title, { description });
}

export function useToast() {
  return { toast: showToast };
}

export { showToast as toast };
