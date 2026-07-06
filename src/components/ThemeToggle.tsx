"use client";

import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl text-dash-muted hover:text-dash-text hover:bg-dash-hover border border-transparent hover:border-dash-border/30 transition-all duration-300 overflow-hidden flex items-center justify-center cursor-pointer select-none size-9 shrink-0"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun size={20} className="text-amber-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon size={20} className="text-blue-400" />
        </motion.div>
      </div>
    </button>
  );
}
