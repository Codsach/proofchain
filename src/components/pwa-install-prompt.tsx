"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, Download } from "lucide-react";

// Extend the Event interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt only if they haven't dismissed it permanently
      if (localStorage.getItem("pwa-prompt-dismissed") !== "true") {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check if app is already installed
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-popover text-popover-foreground rounded-xl shadow-lg border border-border p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Download className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-heading font-medium text-sm">Install ProofChain</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen for quick access.</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <XIcon className="w-4 h-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>
            Maybe later
          </Button>
          <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black" onClick={handleInstallClick}>
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
}
