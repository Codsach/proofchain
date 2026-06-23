"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { LoginInput, LoginSchema } from "@/lib/schemas/auth";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type LoginFormProps = {
  statusMessage: string | null;
  statusError: string | null;
  mode?: "default" | "admin";
};

export default function LoginForm({
  statusMessage,
  statusError,
  mode = "default",
}: LoginFormProps) {
  const { login, verifyMfa } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

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
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      const errorMessage = err instanceof Error ? err.message : "MFA Verification failed";
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdminMode = mode === "admin";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#000000] px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
          >
            ProofChain
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-white/40 font-medium tracking-wide uppercase"
          >
            {isAdminMode ? "Administrator Portal" : "Digital Forensic Evidence Platform"}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400"
            >
              {statusMessage}
            </motion.div>
          )}

          {statusError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {statusError}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 space-y-6 shadow-2xl transition-all hover:border-emerald-500/30 group"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white/90">
              {isAdminMode ? "Admin Sign in" : "Sign in"}
            </h2>
            <div className="h-0.5 w-8 bg-emerald-500 rounded-full transition-all duration-300 group-hover:w-16" />
            {isAdminMode && step === "credentials" && (
              <p className="pt-2 text-xs text-white/40">
                Authorized access only. Audit logging is active.
              </p>
            )}
            {step === "mfa" && (
              <p className="pt-2 text-xs text-white/40">
                Enter the 6-digit code from your authenticator app.
              </p>
            )}
          </div>

          {step === "credentials" ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="email"
                          placeholder="admin@proofchain.io"
                          className="pl-10 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all h-11 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Password</FormLabel>
                      <Link href="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all h-11 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Authenticating..." : "Continue"}
                </Button>
              </motion.div>
            </form>
          </Form>
          ) : (
            <form onSubmit={onMfaSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Authenticator Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all h-11 text-white text-center tracking-[0.5em] font-mono text-lg"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-white/[0.03] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                />
                <label
                  htmlFor="rememberDevice"
                  className="text-sm text-white/60 font-medium leading-none cursor-pointer hover:text-white/80 transition-colors"
                >
                  Remember this device for 30 days
                </label>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  disabled={isSubmitting || mfaCode.length !== 6}
                >
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </motion.div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setMfaCode("");
                  }}
                  className="text-xs text-emerald-500/80 hover:text-emerald-400 transition-colors"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-white/40"
        >
          {isAdminMode ? (
            <p>
              Standard user?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Switch to employee portal
              </Link>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Request access
              </Link>
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

