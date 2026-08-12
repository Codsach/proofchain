"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Send, Lock, MessageSquare, EyeOff, X } from "lucide-react";

interface Comment {
  _id: string;
  caseId: string;
  authorId: string;
  authorRole: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

interface Props {
  caseId: string;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export function CaseChatWidget({ caseId }: Props) {
  const { getToken, user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    const token = await getToken();
    const res = await fetch(`/api/cases/${caseId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Load failed");
    return res.json();
  }, [caseId, getToken]);

  // Fetch comments and compute unread count on mount or when conditions change
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchComments();
        if (!active) return;
        setComments(data);
        
        if (isOpen) {
          setUnreadCount(0);
        } else {
          const lastReadStr = localStorage.getItem(`lastRead_${caseId}_${user?.id}`);
          const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0;
          const unread = data.filter((c: Comment) => {
            const isOthers = c.authorId !== user?.id;
            const isNew = new Date(c.createdAt).getTime() > lastReadTime;
            return isOthers && isNew;
          }).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("[CaseChatWidget] Load failed:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [caseId, fetchComments, isOpen, user?.id]);

  const toggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setUnreadCount(0);
      localStorage.setItem(`lastRead_${caseId}_${user?.id}`, new Date().toISOString());
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${caseId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          isInternal: user?.role === "investigator" ? false : isInternal,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }

      const created = await res.json();
      setComments((prev) => [...prev, created]);
      setNewComment("");
      setIsInternal(false);
      localStorage.setItem(`lastRead_${caseId}_${user?.id}`, new Date().toISOString());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to post comment";
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getRoleBgClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-500 text-white";
      case "analyst":
        return "bg-purple-500 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-96 h-[500px] bg-dash-card/95 border border-dash-border backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 mr-1"
          >
            {/* Header */}
            <div className="bg-dash-hover/40 px-4 py-3 border-b border-dash-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-dash-accent/10 flex items-center justify-center text-dash-accent">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dash-text uppercase tracking-wider">
                    Case Communications
                  </h4>
                  <p className="text-[9px] text-dash-muted uppercase tracking-widest font-medium">
                    Secure Channel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-dash-hover flex items-center justify-center text-dash-muted hover:text-dash-text transition-colors cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-dash-border scrollbar-track-transparent bg-dash-bg/20"
            >
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3 max-w-[80%] animate-pulse",
                        i % 2 === 0 ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-dash-hover/45 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-dash-hover/45 rounded w-16" />
                        <div className="h-10 bg-dash-hover/45 rounded w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <MessageSquare className="w-8 h-8 text-dash-muted/30" />
                  <p className="text-xs text-dash-muted uppercase tracking-wider font-bold">
                    No logs recorded
                  </p>
                  <p className="text-[10px] text-dash-muted/70 max-w-[200px]">
                    Initiate a secure transmission by sending a message below.
                  </p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isSelf = comment.authorId === user?.id;
                  return (
                    <div
                      key={comment._id}
                      className={cn(
                        "flex gap-2.5 max-w-[85%] items-start",
                        isSelf ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 uppercase tracking-widest shadow-md",
                          getRoleBgClass(comment.authorRole)
                        )}
                        title={`${comment.authorName} (${comment.authorRole})`}
                      >
                        {getInitials(comment.authorName)}
                      </div>

                      {/* Content Bubble */}
                      <div className="flex flex-col space-y-1 max-w-[80%]">
                        {/* Sender Info (Only if not self) */}
                        {!isSelf && (
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-bold text-dash-text truncate max-w-[100px]">
                              {comment.authorName}
                            </span>
                            <span className="text-[8px] font-extrabold uppercase px-1 text-dash-muted/80">
                              {comment.authorRole}
                            </span>
                          </div>
                        )}

                        {/* Bubble Body */}
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 text-xs leading-relaxed border shadow-md",
                            isSelf
                              ? "bg-emerald-600/15 border-emerald-500/20 text-dash-text rounded-tr-none"
                              : comment.isInternal
                              ? "bg-amber-500/5 border-amber-500/20 text-dash-text rounded-tl-none"
                              : "bg-dash-input/60 border-dash-border text-dash-text rounded-tl-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words [word-break:break-words]">
                            {comment.content}
                          </p>

                          {/* Time & Internal Tag */}
                          <div className="flex items-center justify-end gap-1.5 mt-1 text-[8px] text-dash-muted/70 font-semibold uppercase tracking-wider select-none">
                            {comment.isInternal && (
                              <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                                <EyeOff className="w-2 h-2" />
                                Internal
                              </span>
                            )}
                            <span>{formatRelativeTime(comment.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="bg-dash-hover/20 p-3 border-t border-dash-border space-y-2"
            >
              <div className="flex items-end gap-2 bg-dash-input border border-dash-border rounded-xl px-2.5 py-1.5 focus-within:border-dash-accent transition-colors">
                <textarea
                  placeholder="Type a secure message..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={isSending}
                  maxLength={2000}
                  className="flex-1 text-xs bg-transparent border-0 text-dash-text placeholder-dash-muted/40 focus:outline-none focus:ring-0 resize-none max-h-16 h-8 py-0.5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSending}
                  className="w-7 h-7 rounded-lg bg-dash-accent text-black hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-dash-accent flex items-center justify-center shrink-0 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Internal toggle (Admins/Analysts) */}
              {user?.role !== "investigator" && (
                <div className="px-1 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[9px] font-bold uppercase tracking-wider text-dash-muted hover:text-dash-text transition-colors">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      disabled={isSending}
                      className="rounded border-dash-border bg-dash-input text-dash-accent focus:ring-0 focus:ring-offset-0 focus:outline-none w-3 h-3 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-500/60" />
                      Internal Note
                    </span>
                  </label>
                  <span className="text-[8px] text-dash-muted/50 font-bold uppercase tracking-widest">
                    Enter to send
                  </span>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-14 h-14 rounded-full bg-dash-accent hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl relative group cursor-pointer focus:outline-none active:scale-95 transition-all duration-300"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 border border-black text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
