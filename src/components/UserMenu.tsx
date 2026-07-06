"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { User, Settings, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./providers/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MfaSetupModal } from "@/components/MfaSetupModal";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMfaOpen, setIsMfaOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isTop = rect.top < window.innerHeight / 2;

      if (isTop) {
        setDropdownStyle({
          position: "fixed",
          top: rect.bottom + 8,
          right: Math.max(16, window.innerWidth - rect.right),
          zIndex: 9999,
        });
      } else {
        setDropdownStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + 8,
          left: Math.max(16, rect.left),
          zIndex: 9999,
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-1.5 rounded-xl border border-dash-border hover:bg-dash-hover transition-all duration-300"
      >
        <Avatar className="h-7 w-7 rounded-lg shrink-0 overflow-hidden bg-dash-input border border-dash-border/30">
          <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-heading">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                style={dropdownStyle}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-56 overflow-hidden bg-dash-card border border-dash-border rounded-2xl shadow-2xl backdrop-blur-3xl p-1.5 flex flex-col gap-1 select-none"
              >
                {/* User Info Header */}
                <div className="px-3 py-2.5 border-b border-dash-border/50 mb-1 flex flex-col">
                  <span className="text-xs font-bold text-dash-text truncate">
                    {user.fullName || "User Profile"}
                  </span>
                  <span className="text-[10px] text-dash-muted truncate font-medium mt-0.5" title={user.email}>
                    {user.email}
                  </span>
                </div>

                {/* Menu items */}
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-dash-muted hover:text-dash-text hover:bg-dash-hover/60 rounded-xl transition-all duration-200"
                >
                  <User size={15} className="opacity-70" />
                  <span>View Profile</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-dash-muted hover:text-dash-text hover:bg-dash-hover/60 rounded-xl transition-all duration-200"
                >
                  <Settings size={15} className="opacity-70" />
                  <span>Account Settings</span>
                </Link>

                {/* State-based 2FA Logic */}
                {user.mfaEnabled ? (
                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="mx-1 mt-1 px-3 py-2 flex flex-col gap-0.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-emerald-600 dark:text-emerald-400 transition-all duration-200 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                      2FA Protected
                    </span>
                    <span className="text-[9px] font-medium text-emerald-600/70 dark:text-emerald-400/60 pl-[18px]">
                      Security Enabled
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsMfaOpen(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all duration-200 justify-start w-full text-left cursor-pointer"
                  >
                    <ShieldAlert size={15} className="opacity-70" />
                    <span>Enable 2FA</span>
                  </button>
                )}

                <div className="h-px bg-dash-border/40 my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all duration-200 justify-start w-full text-left cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <MfaSetupModal isOpen={isMfaOpen} onClose={() => setIsMfaOpen(false)} />
    </>
  );
}
