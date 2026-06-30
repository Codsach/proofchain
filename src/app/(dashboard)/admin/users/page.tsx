"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const CreateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});

type CreateInput = z.infer<typeof CreateSchema>;

const ROLE_STYLES: Record<string, string> = {
  investigator: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  analyst: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  admin: "text-amber-400 border-amber-500/20 bg-amber-500/5",
};

const IdentityBackground = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-transparent">
      {/* Top Left: Violet */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_30%,#ddd6fe_0%,transparent_40%)]" />
      {/* Top Right: Indigo */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_20%,#c7d2fe_0%,transparent_40%)]" />
      {/* Bottom Center: Violet */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_80%,#ddd6fe_0%,transparent_40%)]" />
      {/* Bottom Right: Indigo */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_90%_90%,#c7d2fe_0%,transparent_40%)]" />
    </div>
  );
};


export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<CreateInput>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { fullName: "", email: "" },
  });

  const fetchUsers = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      toast({ title: "Error", description: "Could not load users", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [getToken, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (values: CreateInput) => {
    setIsCreating(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, role: "analyst" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Analyst account created", description: "Credentials sent by email." });
      setCreateOpen(false);
      form.reset();
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    setTogglingId(userId);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({
        title: currentActive ? "Account deactivated" : "Account activated",
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: !currentActive } : u
        )
      );
    } catch {
      toast({ title: "Error", description: "Could not update account", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget._id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast({
        title: "Account deleted",
        description: `${deleteTarget.fullName} was removed from the database.`,
      });
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden flex justify-center w-full">
      {/* Background mesh gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <IdentityBackground />
      </div>

      <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-slate-400/50" />
            <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Identity Management</p>
          </div>
          <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">System Users</h1>
          <p className="text-dash-muted text-sm mt-1 font-medium">
            Review and manage <span className="text-dash-text">{users.length}</span> active directory entities.
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-dash-accent hover:bg-dash-accent text-black font-bold h-11 px-6 rounded-xl shadow-[0_0_20px_var(--dash-accent-glow)]"
          >
            + Register Analyst
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-16 w-full rounded-2xl bg-dash-hover" />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dash-border bg-dash-table backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border bg-dash-hover">
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Registry Subject</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden sm:table-cell">Privilege Level</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">Last Access</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Operational Status</th>
                  <th className="px-6 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                <AnimatePresence>
                  {users.map((u, idx) => (
                    <motion.tr 
                      key={u._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-emerald-500/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="font-semibold text-dash-text group-hover:text-dash-accent transition-colors">{u.fullName}</p>
                          <p className="text-xs text-dash-muted font-medium">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden sm:table-cell">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                            ROLE_STYLES[u.role] ?? "text-dash-muted bg-dash-border border-dash-border"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-dash-muted hidden md:table-cell font-mono">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : "INITIALIZING"}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-dash-accent animate-pulse" : "bg-dash-muted/20"}`} />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${
                              u.isActive ? "text-dash-accent" : "text-dash-muted"
                            }`}
                          >
                            {u.isActive ? "Online" : "Terminated"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {u.role !== "admin" && (
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => toggleActive(u._id, u.isActive)}
                              disabled={togglingId === u._id || deletingId === u._id}
                              className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                u.isActive ? "text-dash-muted hover:text-dash-text" : "text-dash-accent/60 hover:text-dash-accent"
                              } disabled:opacity-40`}
                            >
                              {togglingId === u._id ? "..." : u.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              disabled={togglingId === u._id || deletingId === u._id}
                              onClick={() => setDeleteTarget(u)}
                              className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60 hover:text-rose-500 transition-colors disabled:opacity-40"
                            >
                              {deletingId === u._id ? "Deleting" : "Purge"}
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create analyst dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!isCreating) { setCreateOpen(o); form.reset(); } }}>
        <DialogContent className="sm:max-w-md bg-dash-modal border-dash-border backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-dash-text text-xl font-bold tracking-tight">Register System Analyst</DialogTitle>
            <DialogDescription className="text-dash-muted font-medium">
              Create a new authenticated entity. Temporary credentials will be generated and dispatched.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-dash-muted">Legal Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dash-muted" />
                        <Input 
                          placeholder="Jane Smith" 
                          {...field} 
                          className="pl-10 bg-dash-hover border-dash-border focus:border-emerald-500/50 transition-all h-11 text-dash-text"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs italic" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-dash-muted">Secure Email Channel</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dash-muted" />
                        <Input 
                          type="email" 
                          placeholder="analyst@proofchain.io" 
                          {...field} 
                          className="pl-10 bg-dash-hover border-dash-border focus:border-emerald-500/50 transition-all h-11 text-dash-text"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs italic" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-3 sm:gap-0 sm:justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setCreateOpen(false); form.reset(); }}
                  disabled={isCreating}
                  className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text"
                >
                  Abort Registration
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-dash-accent hover:bg-dash-accent text-black font-bold h-11 px-8 rounded-xl"
                >
                  {isCreating ? "Encrypting Data…" : "Authorize Entity"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-dash-modal border-rose-500/20 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-dash-text text-xl font-bold tracking-tight">Purge System Entity</DialogTitle>
            <DialogDescription className="text-dash-muted font-medium">
              This action is <span className="text-rose-400">destructive</span> and permanent. All access tokens will be revoked immediately.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-xl border border-dash-border bg-dash-card p-5 space-y-2">
              <p className="font-bold text-dash-text text-lg">{deleteTarget.fullName}</p>
              <p className="text-dash-muted text-sm font-mono">{deleteTarget.email}</p>
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500/60 bg-rose-500/5 border border-rose-500/20 px-3 py-1 rounded-full">
                  Target: {deleteTarget.role}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3 sm:gap-0 sm:justify-between items-center pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(deletingId)}
              className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text"
            >
              Cancel Purge
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={Boolean(deletingId) || !deleteTarget}
              className="bg-rose-500 hover:bg-rose-600 text-dash-text font-bold h-11 px-8 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.1)]"
            >
              {deletingId ? "Executing…" : "Confirm Purge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
