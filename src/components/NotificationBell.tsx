"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers/AuthContext";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { getToken, user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  // Track the ID of the most recent notification we have seen to know when to play sound
  const latestSeenId = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn("Audio playback failed", err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const notifs: Notification[] = data.notifications || [];
        setNotifications(notifs);

        if (notifs.length > 0) {
          const newest = notifs[0];
          // Check if we have a new notification that we haven't seen before and it is unread
          if (latestSeenId.current !== null && latestSeenId.current !== newest._id && !newest.isRead) {
            playNotificationSound();
          }
          latestSeenId.current = newest._id;
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, [getToken, user, playNotificationSound]);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const updateDropdownPosition = useCallback(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 8,
        left: Math.max(16, rect.left), // Ensure it doesn't go off-screen to the left
        zIndex: 9999
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string, link: string) => {
    try {
      const token = await getToken();
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      
      setIsOpen(false);
      router.push(link);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAsReadWithoutNavigation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-dash-muted hover:text-dash-text hover:bg-dash-hover transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dash-sidebar" />
        )}
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              style={dropdownStyle}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-80 max-h-[400px] overflow-y-auto custom-scrollbar bg-dash-card border border-dash-border rounded-2xl shadow-2xl backdrop-blur-3xl"
            >
              <div className="p-4 border-b border-dash-border sticky top-0 bg-dash-card/90 backdrop-blur-md z-10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-dash-text uppercase tracking-wider">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-dash-accent/20 text-dash-accent px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-dash-muted text-sm font-medium">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-dash-border/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => markAsRead(notif._id, notif.link)}
                      className={`p-4 hover:bg-dash-hover transition-colors cursor-pointer group flex gap-3 ${!notif.isRead ? 'bg-emerald-500/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-semibold truncate ${!notif.isRead ? 'text-dash-text' : 'text-dash-muted'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-dash-muted font-mono whitespace-nowrap mt-1">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-dash-text/80' : 'text-dash-text/40'}`}>
                          {notif.message}
                        </p>
                      </div>
                      
                      <div className="flex flex-col justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button 
                            onClick={(e) => markAsReadWithoutNavigation(e, notif._id)}
                            className="p-1 text-dash-muted hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <ExternalLink size={14} className="text-dash-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

