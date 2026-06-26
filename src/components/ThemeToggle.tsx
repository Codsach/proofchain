"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render icon after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-xl bg-dash-hover/40 animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-9 w-9 rounded-xl text-dash-muted hover:text-dash-text hover:bg-dash-hover/60 transition-all duration-200 relative overflow-hidden"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {/* Sun — visible in dark mode, click to go light */}
            <Sun
              size={17}
              className={`absolute transition-all duration-300 ease-in-out ${
                isDark
                  ? "opacity-100 rotate-0 scale-100"
                  : "opacity-0 rotate-90 scale-75"
              }`}
            />
            {/* Moon — visible in light mode, click to go dark */}
            <Moon
              size={16}
              className={`absolute transition-all duration-300 ease-in-out ${
                !isDark
                  ? "opacity-100 rotate-0 scale-100"
                  : "opacity-0 -rotate-90 scale-75"
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-xs bg-dash-card border-dash-border text-dash-text"
        >
          {isDark ? "Switch to light mode" : "Switch to dark mode"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
