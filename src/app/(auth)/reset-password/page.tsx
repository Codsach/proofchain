"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, Suspense } from "react";
import type { Variants } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
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

const cardCls =
  "rounded-2xl border border-white/70 bg-white/75 backdrop-blur-md p-8 space-y-6 shadow-[0_4px_30px_rgba(15,23,42,0.06),0_1px_8px_rgba(13,158,110,0.06)] hover:shadow-[0_8px_40px_rgba(13,158,110,0.12)] hover:border-[#10b981]/40 transition-all duration-300 group";
const labelCls = "label-md font-heading text-[#64748b] uppercase tracking-wider";
const inputCls =
  "bg-[#f8fafc] border-[#e2e8f0] focus:border-[#10b981] focus:ring-[#10b981]/20 transition-all h-11 text-[#1e293b] placeholder:text-[#94a3b8] font-sans rounded-lg";
const btnCls =
  "w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold h-11 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.20)] hover:shadow-[0_0_30px_rgba(16,185,129,0.40)] rounded-lg font-heading tracking-wide";

function ResetPasswordForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Invalid token state
  if (!token) {
    return (
      <AuthLayout leftPanel={<ShieldMaterialize />}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="rounded-2xl border border-destructive/30 bg-white/75 backdrop-blur-md p-8 space-y-6 shadow-lg">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center">
                <span className="text-3xl text-destructive">✕</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider">Invalid Link</h2>
              <p className="body-sm text-[#64748b] font-sans">
                The password reset token is missing or invalid. Please request a new password reset link.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-[#0D9E6E] text-sm font-bold text-white transition-all hover:bg-[#0b8a5f] shadow-[0_0_20px_rgba(13,158,110,0.2)]"
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
          <div className={`${cardCls} !space-y-6`}>
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
              <h2 className="text-xl font-bold text-[#1A2033]">Password Updated</h2>
              <p className="text-sm text-[#556070]">
                Your password has been changed successfully. You can now sign in using your new credentials.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-[#0D9E6E] text-sm font-bold text-white transition-all hover:bg-[#0b8a5f] shadow-[0_0_20px_rgba(13,158,110,0.2)] hover:shadow-[0_0_28px_rgba(13,158,110,0.4)]"
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
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={item} className="space-y-1">
          <h1 className="text-2xl font-bold text-[#1A2033] font-heading">Reset Password</h1>
          <p className="text-sm text-[#556070]">
            Create a new secure password for your ProofChain account.
          </p>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -2 }} className={cardCls}>
          <div className="h-0.5 w-8 bg-[#0D9E6E] rounded-full transition-all duration-300 group-hover:w-16" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#556070]/60" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={`pl-10 ${inputCls} pr-10`}
                            autoComplete="new-password"
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

              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#556070]/60" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={`pl-10 ${inputCls}`}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive/80" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={item} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button type="submit" className={btnCls} disabled={isSubmitting}>
                  {isSubmitting ? "Resetting…" : "Reset Password"}
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>

        <motion.p variants={item} className="text-center text-sm text-[#556070]">
          Nevermind?{" "}
          <Link href="/login" className="text-[#0D9E6E] hover:text-[#0b8a5f] font-semibold transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
          <div className="text-[#0D9E6E] animate-pulse">Loading…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
