"use client";

import { useEffect, useState, Suspense } from "react";
import type { Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { LoginSchema, LoginInput } from "@/lib/schemas/auth";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { NetworkOrb } from "@/components/auth/illustrations/NetworkOrb";

// ── Stagger variants ──────────────────────────────────────────────────────────
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ── Card class helpers ──────────────────────────────────────────────────────────
const cardCls =
  "rounded-2xl border border-white/70 bg-white/75 backdrop-blur-md p-8 space-y-6 shadow-[0_4px_30px_rgba(15,23,42,0.06),0_1px_8px_rgba(13,158,110,0.06)] hover:shadow-[0_8px_40px_rgba(13,158,110,0.12)] hover:border-[#10b981]/40 transition-all duration-300 group";
const labelCls = "label-md font-heading text-[#64748b] uppercase tracking-wider";
const inputCls =
  "bg-[#f8fafc] border-[#e2e8f0] focus:border-[#10b981] focus:ring-[#10b981]/20 transition-all h-11 text-[#1e293b] placeholder:text-[#94a3b8] font-sans rounded-lg";
const btnCls =
  "w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold h-11 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.20)] hover:shadow-[0_0_30px_rgba(16,185,129,0.40)] rounded-lg font-heading tracking-wide";

function LoginForm() {
  const { login, verifyMfa, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredsDialog, setShowCredsDialog] = useState(false);
  const [dynamicCreds, setDynamicCreds] = useState<Record<string, { email: string; password: string }>>({});
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const message = searchParams.get("message");
  const error = searchParams.get("error");

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        analyst: "/analyst",
        investigator: "/investigator",
      };
      router.push(redirectMap[user.role] || "/");
    }
  }, [user, isLoading, router]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Load credentials from cred.md dynamically
  useEffect(() => {
    fetch("/cred.md?t=" + Date.now())
      .then((res) => res.text())
      .then((text) => {
        const parsed: Record<string, any> = {};
        const blocks = text.split("###");
        blocks.slice(1).forEach((block) => {
          const lines = block.trim().split("\n");
          const roleMatch = lines[0].match(/([a-zA-Z]+)/);
          const role = roleMatch ? roleMatch[1].toLowerCase() : null;
          const emailMatch = block.match(/- Email:\s*(.+)/);
          const passMatch = block.match(/- Password:\s*(.+)/);
          if (role && emailMatch && passMatch) {
            parsed[role] = { email: emailMatch[1].trim(), password: passMatch[1].trim() };
          }
        });
        setDynamicCreds(parsed);
      })
      .catch(console.error);
  }, []);

  // Ctrl+K Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCredsDialog((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAutoLogin = (email: string, password?: string) => {
    setShowCredsDialog(false);
    form.setValue("email", email);
    form.setValue("password", password || "password123");
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = async (values: LoginInput) => {
    setIsSubmitting(true);
    try {
      const result = await login(values.email, values.password);
      if (result?.requiresMfa) {
        setStep("mfa");
        setMfaToken(result.mfaToken || null);
        toast({
          title: "Two-Factor Authentication Required",
          description: "Please enter the code from your authenticator app.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || !mfaToken) return;

    setIsSubmitting(true);
    try {
      await verifyMfa(mfaCode, mfaToken, rememberDevice);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "MFA Verification failed";
      toast({
        title: "Verification failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-[#0D9E6E] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#0D9E6E]/60 text-xs font-medium uppercase tracking-widest animate-pulse">
            Authenticating
          </p>
        </div>
      </div>
    );
  }

  if (user) return null;

  const messageMap: Record<string, string> = {
    verified: "Email verified. You can now log in.",
    already_verified: "Your email is already verified.",
  };
  const errorMap: Record<string, string> = {
    invalid_link: "Verification link is invalid.",
    link_expired: "Verification link has expired. Please register again.",
    server_error: "Something went wrong. Please try again.",
  };

  return (
    <AuthLayout leftPanel={<NetworkOrb />}>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
        {/* Page title */}
        <motion.div variants={item} className="space-y-1">
          <h1 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider uppercase">
            {step === "mfa" ? "Verification" : "Sign in"}
          </h1>
          <p className="body-sm text-[#64748b] font-sans">
            {step === "mfa" ? "Enter your authenticator code" : "Enter your credentials to access your workspace"}
          </p>
        </motion.div>

        {/* Status banners */}
        <AnimatePresence mode="wait">
          {message && messageMap[message] && (
            <motion.div
              key="msg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 px-4 py-3 body-sm text-[#059669] font-sans"
            >
              {messageMap[message]}
            </motion.div>
          )}
          {error && errorMap[error] && (
            <motion.div
              key="err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
            >
              {errorMap[error]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form card */}
        <motion.div variants={item} whileHover={{ y: -2 }} className={cardCls}>
          <div className="space-y-1">
            <div className="h-0.5 w-8 bg-[#0D9E6E] rounded-full transition-all duration-300 group-hover:w-16" />
          </div>

          {step === "credentials" ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <motion.div variants={item}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={labelCls}>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@company.com"
                            className={inputCls}
                            autoComplete="email"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-destructive/80" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={item}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <FormLabel className={labelCls}>Password</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="body-sm text-[#10b981] hover:text-[#059669] transition-colors font-semibold"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className={`${inputCls} pr-10`}
                              autoComplete="current-password"
                              disabled={isSubmitting}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#556070] hover:text-[#1A2033] transition-colors focus:outline-none"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-destructive/80" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={item} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button type="submit" className={btnCls} disabled={isSubmitting}>
                    {isSubmitting ? "Authenticating…" : "Continue"}
                  </Button>
                </motion.div>
              </form>
            </Form>
          ) : (
            <form onSubmit={onMfaSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className={labelCls}>
                  Authenticator Code
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`${inputCls} text-center tracking-[0.5em] font-mono text-lg`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e2e8f0] bg-[#f8fafc] text-[#10b981] focus:ring-[#10b981]/20 focus:ring-offset-0"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="rememberDevice"
                  className="body-sm text-[#64748b] font-medium leading-none cursor-pointer hover:text-[#1e293b] transition-colors"
                >
                  Remember this device for 30 days
                </label>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className={btnCls}
                  disabled={isSubmitting || mfaCode.length !== 6}
                >
                  {isSubmitting ? "Verifying…" : "Verify"}
                </Button>
              </motion.div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setMfaCode("");
                  }}
                  className="body-sm text-[#10b981] hover:text-[#059669] transition-colors font-semibold"
                  disabled={isSubmitting}
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.p variants={item} className="text-center body-sm text-[#64748b] font-sans">
          New to the platform?{" "}
          <Link href="/register" className="text-[#10b981] hover:text-[#059669] font-semibold transition-colors">
            Create an account
          </Link>
        </motion.p>
      </motion.div>

      {/* Creds Dialog */}
      <AnimatePresence>
        {showCredsDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2033]/40 backdrop-blur-sm px-4"
            onClick={() => setShowCredsDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[#D1D7E0] bg-white p-6 shadow-2xl shadow-[#0D9E6E]/10 space-y-4"
            >
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-semibold text-[#1A2033]">Test Credentials</h3>
                <p className="text-xs text-[#556070]">Select a role to auto-fill and login</p>
              </div>
              <div className="space-y-3 pt-2">
                {["investigator", "analyst", "admin"].map((role) => {
                  const cred = dynamicCreds[role];
                  return (
                    <Button
                      key={role}
                      type="button"
                      variant="outline"
                      className="w-full justify-between border-[#D1D7E0] bg-[#F0F2F5] hover:bg-[#0D9E6E]/10 hover:text-[#0D9E6E] hover:border-[#0D9E6E]/40 text-[#1A2033] transition-all"
                      onClick={() => { if (cred) handleAutoLogin(cred.email, cred.password); }}
                    >
                      <span className="capitalize font-semibold">{role}</span>
                      <span className="text-xs text-[#556070]">{cred ? cred.email : "Loading…"}</span>
                    </Button>
                  );
                })}
              </div>
              <div className="pt-2 text-center">
                <p className="text-[10px] text-[#556070]/60 uppercase tracking-wider">Reading live from cred.md</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
          <div className="text-[#0D9E6E] animate-pulse">Loading…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}