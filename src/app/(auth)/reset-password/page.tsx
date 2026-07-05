"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, Suspense } from "react";
import type { Variants } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { ResetPasswordSchema } from "@/lib/schemas/auth";
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
import { ShieldMaterialize } from "@/components/auth/illustrations/ShieldMaterialize";

// Schema extension for password match validation
const ResetFormSchema = ResetPasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormInput = z.infer<typeof ResetFormSchema>;

// Stagger variants
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// Styling variables aligned with sentinel-theme-v2 tokens
const cardCls =
  "rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-8 py-7 space-y-5 shadow-sm hover:shadow-md hover:border-[var(--dash-accent)]/30 transition-all duration-300 group";
const labelCls = "label-md font-heading text-[var(--dash-muted)] uppercase tracking-wider font-semibold";
const inputCls =
  "bg-[var(--dash-input)] border-[var(--dash-border)] focus:border-[var(--dash-accent)] focus:ring-[var(--dash-accent)]/20 transition-all h-12 text-[var(--dash-text)] placeholder:text-[var(--dash-muted)]/50 font-sans rounded-xl w-full border";
const btnCls =
  "w-full bg-[var(--dash-accent)] hover:bg-[var(--dash-active-text)] text-white font-bold h-12 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.30)] rounded-xl font-heading tracking-wide";

function ResetPasswordForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const form = useForm<ResetFormInput>({
    resolver: zodResolver(ResetFormSchema),
    defaultValues: { token: token || "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetFormInput) => {
    if (!token) {
      toast({
        title: "Reset failed",
        description: "Token is missing. Check your reset link.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Reset failed",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      setSubmitted(true);
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server. Try again.",
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

  // Invalid token state
  if (!token) {
    return (
      <AuthLayout leftPanel={<ShieldMaterialize />}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="rounded-2xl border border-destructive/20 bg-[var(--dash-card)] px-8 py-8 space-y-6 shadow-md flex flex-col items-center justify-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center">
                <span className="text-3xl text-destructive">✕</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">Invalid Link</h2>
              <p className="body-sm text-[var(--dash-muted)] font-sans">
                The password reset token is missing or invalid. Please request a new password reset link.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-destructive text-sm font-bold text-white transition-all hover:bg-destructive/90 shadow-sm font-heading tracking-wide"
            >
              Request Reset Link
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Success state
  if (submitted) {
    return (
      <AuthLayout leftPanel={<ShieldMaterialize />}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 text-center"
        >
          <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-8 py-8 space-y-6 shadow-md text-center flex flex-col items-center justify-center">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="h-16 w-16 bg-[#0D9E6E]/10 border border-[#0D9E6E]/30 rounded-full flex items-center justify-center"
              >
                <span className="text-3xl text-[#0D9E6E]">✓</span>
              </motion.div>
            </div>
            <div className="space-y-2">
              <h2 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">Password Updated</h2>
              <p className="body-sm text-[var(--dash-muted)] font-sans">
                Your password has been changed successfully. You can now sign in using your new credentials.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-[var(--dash-accent)] text-sm font-bold text-white transition-all hover:bg-[var(--dash-active-text)] shadow-sm font-heading tracking-wide"
            >
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftPanel={<ShieldMaterialize />}>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4">
        <motion.div variants={item} className="space-y-1">
          <h1 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">Reset Password</h1>
          <p className="body-sm text-[var(--dash-muted)] font-sans">
            Create a new secure password for your ProofChain account.
          </p>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -1 }} className={cardCls}>
          <div className="h-0.5 w-8 bg-[var(--dash-accent)] rounded-full transition-all duration-300 group-hover:w-16" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--dash-muted)]/50" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 ${inputCls}`}
                            autoComplete="new-password"
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

              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--dash-muted)]/50" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 ${inputCls}`}
                            autoComplete="new-password"
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dash-muted)] hover:text-[var(--dash-text)] transition-colors focus:outline-none"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
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
                      Resetting…
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </motion.div>

              <div className="text-center pt-1.5">
                <p className="body-sm text-[var(--dash-muted)] font-sans">
                  Nevermind?{" "}
                  <Link href="/login" className="text-[var(--dash-accent)] hover:text-[var(--dash-active-text)] font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--dash-bg)] flex items-center justify-center">
          <div className="text-[var(--dash-accent)] animate-pulse">Loading…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
