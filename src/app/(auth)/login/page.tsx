"use client";

import { useEffect, useState, Suspense } from "react";
import type { Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
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
  "rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-8 py-7 space-y-5 shadow-sm hover:shadow-md hover:border-[var(--dash-accent)]/30 transition-all duration-300 group";
const labelCls = "label-md font-heading text-[var(--dash-muted)] uppercase tracking-wider font-semibold";
const inputCls =
  "bg-[var(--dash-input)] border-[var(--dash-border)] focus:border-[var(--dash-accent)] focus:ring-[var(--dash-accent)]/20 transition-all h-12 text-[var(--dash-text)] placeholder:text-[var(--dash-muted)]/50 font-sans rounded-xl w-full border";
const btnCls =
  "w-full bg-[var(--dash-accent)] hover:bg-[var(--dash-active-text)] text-white font-bold h-12 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.30)] rounded-xl font-heading tracking-wide";

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
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const message = searchParams.get("message");
  const error = searchParams.get("error");

  const getRedirectPath = (role: string, landing?: string) => {
    const landingPage = landing || "dashboard";
    if (role === "admin") {
      if (landingPage === "cases") return "/admin/cases";
      if (landingPage === "audit") return "/admin/audit";
      return "/admin";
    }
    if (role === "analyst") return "/analyst";
    if (role === "investigator") return "/investigator";
    return "/";
  };

  // Redirect if already logged in and not in success state
  useEffect(() => {
    if (!isLoading && user && !isSuccess) {
      router.push(getRedirectPath(user.role, user.landingPage));
    }
  }, [user, isLoading, router, isSuccess]);

  // Handle redirect after success transition completes
  useEffect(() => {
    if (isSuccess && user) {
      const timer = setTimeout(() => {
        router.push(getRedirectPath(user.role, user.landingPage));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, user, router]);

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
      } else {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Access granted. Redirecting to workspace...",
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
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "MFA verified. Redirecting to workspace...",
      });
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

  const checkCapsLock = (e: React.KeyboardEvent) => {
    const caps = e.getModifierState("CapsLock");
    setIsCapsLockOn(caps);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--dash-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-[var(--dash-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--dash-accent)]/60 text-xs font-medium uppercase tracking-widest animate-pulse">
            Authenticating
          </p>
        </div>
      </div>
    );
  }

  if (user && !isSuccess) return null;

  const messageMap: Record<string, string> = {
    verified: "Email verified. You can now log in.",
    already_verified: "Your email is already verified.",
  };
  const errorMap: Record<string, string> = {
    invalid_link: "Verification link is invalid.",
    link_expired: "Verification link has expired. Please register again.",
    server_error: "Something went wrong. Please try again.",
  };

  if (isSuccess) {
    return (
      <AuthLayout leftPanel={<NetworkOrb />}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 text-center"
        >
          <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-8 py-8 space-y-6 shadow-md text-center flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="h-16 w-16 bg-[#10b981]/10 border border-[#10b981]/30 rounded-full flex items-center justify-center mb-2"
            >
              <span className="text-3xl text-[#10b981]">✓</span>
            </motion.div>
            <div className="space-y-2">
              <h2 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">Access Granted</h2>
              <p className="body-sm text-[var(--dash-muted)] font-sans">
                Establishing secure session connection. Redirecting to workspace...
              </p>
            </div>
            <div className="h-1.5 w-32 bg-[var(--dash-input)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#10b981]"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftPanel={<NetworkOrb />}>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4">
        {/* Page title */}
        <motion.div variants={item} className="space-y-1">
          <h1 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">
            {step === "mfa" ? "Verification" : "Sign in"}
          </h1>
          <p className="body-sm text-[var(--dash-muted)] font-sans">
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
        <motion.div variants={item} whileHover={{ y: -1 }} className={cardCls}>
          <div className="space-y-1">
            <div className="h-0.5 w-8 bg-[var(--dash-accent)] rounded-full transition-all duration-300 group-hover:w-16" />
          </div>

          {step === "credentials" ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            className={`px-4 ${inputCls}`}
                            autoComplete="email"
                            disabled={isSubmitting}
                            onKeyDown={checkCapsLock}
                            onKeyUp={checkCapsLock}
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
                            className="body-sm text-[var(--dash-accent)] hover:text-[var(--dash-active-text)] transition-colors font-semibold"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className={`pl-4 pr-10 ${inputCls}`}
                              autoComplete="current-password"
                              disabled={isSubmitting}
                              {...field}
                              onBlur={(e) => {
                                field.onBlur();
                                setIsCapsLockOn(false);
                              }}
                              onKeyDown={checkCapsLock}
                              onKeyUp={checkCapsLock}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dash-muted)] hover:text-[var(--dash-text)] transition-colors focus:outline-none"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        {isCapsLockOn && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mt-1"
                          >
                            <ShieldAlert size={13} className="text-amber-500 animate-pulse" />
                            <span>Caps Lock is active</span>
                          </motion.div>
                        )}
                        <FormMessage className="text-xs text-destructive/80" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={item} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1">
                  <Button type="submit" className={btnCls} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                        Authenticating…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </motion.div>

                <div className="text-center pt-1.5">
                  <p className="body-sm text-[var(--dash-muted)] font-sans">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-[var(--dash-accent)] hover:text-[var(--dash-active-text)] font-semibold transition-colors">
                      Create account
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          ) : (
            <form onSubmit={onMfaSubmit} className="space-y-4">
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
                  className="h-4 w-4 rounded border-[var(--dash-border)] bg-[var(--dash-input)] text-[var(--dash-accent)] focus:ring-[var(--dash-accent)]/20 focus:ring-offset-0"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="rememberDevice"
                  className="body-sm text-[var(--dash-muted)] font-medium leading-none cursor-pointer hover:text-[var(--dash-text)] transition-colors"
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Verifying…
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </motion.div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setMfaCode("");
                  }}
                  className="body-sm text-[var(--dash-accent)] hover:text-[var(--dash-active-text)] transition-colors font-semibold"
                  disabled={isSubmitting}
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </motion.div>
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