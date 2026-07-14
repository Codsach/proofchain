"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Send, Lock, MessageSquare, Trash2, EyeOff } from "lucide-react";

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
  className?: string;
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

export function CommentsPanel({ caseId, className }: Props) {
  const { getToken, user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadComments = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${caseId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (err) {
      console.error("[CommentsPanel] Load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadComments();
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "analyst":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className={cn("rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 shadow-2xl flex flex-col gap-4 w-full min-w-0", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-dash-border pb-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-dash-accent shrink-0" />
          <h3 className="type-section-heading text-dash-text truncate">
            Case Communications
          </h3>
        </div>
        <span className="text-[10px] font-bold text-dash-muted/40 uppercase tracking-widest shrink-0">
          {comments.length} {comments.length === 1 ? "Message" : "Messages"}
        </span>
      </div>

      {/* Scrollable Message List */}
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-dash-border scrollbar-track-transparent min-h-[120px] flex-1 min-w-0"
      >
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex flex-col gap-2">
                <div className="h-3 bg-dash-hover/40 rounded w-1/4" />
                <div className="h-10 bg-dash-hover/40 rounded w-full" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[10px] text-dash-muted font-bold uppercase tracking-wider">
              No communication logs recorded.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-3 border transition-colors min-w-0 w-full ${
                  comment.isInternal
                    ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30"
                    : "bg-dash-input/30 border-dash-border hover:bg-dash-hover/30"
                }`}
              >
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-xs font-bold text-dash-text truncate max-w-[100px] sm:max-w-[120px] shrink-0">
                      {comment.authorName}
                    </span>
                    <span
                      className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider shrink-0 ${getRoleBadgeClass(
                        comment.authorRole
                      )}`}
                    >
                      {comment.authorRole}
                    </span>
                    {comment.isInternal && (
                      <span className="flex items-center gap-1 text-[8px] font-extrabold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                        <EyeOff className="w-2.5 h-2.5" />
                        Internal
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-dash-muted shrink-0">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>

                {/* Content */}
                <p className="text-xs text-dash-text/80 leading-relaxed break-all [word-break:break-word] whitespace-pre-wrap">
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="space-y-3 pt-3 border-t border-dash-border">
        <textarea
          placeholder="Compose secure transmission..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSending}
          maxLength={2000}
          className="w-full text-xs bg-dash-input border border-dash-border rounded-xl px-3 py-2 text-dash-text placeholder-dash-muted/40 focus:outline-none focus:border-dash-accent transition-colors resize-none h-16 min-h-[50px]"
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Internal Checkbox for Analyst/Admin */}
          {user?.role !== "investigator" ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider text-dash-muted hover:text-dash-text transition-colors">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={isSending}
                className="rounded border-dash-border bg-dash-input text-dash-accent focus:ring-0 focus:ring-offset-0 focus:outline-none w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-500/60" />
                Internal Note (Analysts Only)
              </span>
            </label>
          ) : (
            <div />
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-dash-accent text-black hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-dash-accent transition-all cursor-pointer shadow-lg active:scale-95"
          >
            {isSending ? (
              <span>Transmitting...</span>
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
