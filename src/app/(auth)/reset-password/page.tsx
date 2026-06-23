"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { NetworkParticles } from "@/components/ui/network-particles";

// Schema extension for password match validation on the client side
const ResetFormSchema = ResetPasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormInput = z.infer<typeof ResetFormSchema>;

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
        body: JSON.stringify({
          token: token,
          newPassword: values.newPassword,
        }),
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

  if (!token) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />
        <NetworkParticles className="opacity-70 z-[1]" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center space-y-6"
        >
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl p-8 space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center">
                <span className="text-3xl text-destructive">✕</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white/90">Invalid Link</h2>
              <p className="text-sm text-white/40">
                The password reset token is missing or invalid. Please request a new password reset link.
              </p>
            </div>
            <Link 
              href="/forgot-password" 
              className="inline-flex w-full h-11 items-center justify-center rounded-md bg-emerald-500 text-sm font-bold text-black transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Request Reset Link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />
        <NetworkParticles className="opacity-70 z-[1]" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center space-y-6"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl text-emerald-500">✓</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white/90">Password Updated</h2>
              <p className="text-sm text-white/40">
                Your password has been changed successfully. You can now sign in using your new credentials.
              </p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex w-full h-11 items-center justify-center rounded-md bg-emerald-500 text-sm font-bold text-black transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] px-4 overflow-hidden">
      {/* Background Network Nodes */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />
      <NetworkParticles className="opacity-70 z-[1]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1 
              }}
            >
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                  filter: [
                    "drop-shadow(0px 0px 4px rgba(7, 165, 114, 0.1))",
                    "drop-shadow(0px 0px 12px rgba(7, 165, 114, 0.5))",
                    "drop-shadow(0px 0px 4px rgba(7, 165, 114, 0.1))"
                  ]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4, 
                  ease: "easeInOut",
                  delay: 0.5 
                }}
              >
                <Image src="/icon-v2.png" alt="ProofChain Icon" width={56} height={56} className="object-contain" priority />
              </motion.div>
            </motion.div>
            <div className="flex text-5xl font-extrabold tracking-tight">
              <motion.span
                initial={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
                className="text-white"
              >
                Proof
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
                className="text-[#07A572]"
              >
                Chain
              </motion.span>
            </div>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm text-white/40 font-medium tracking-wide uppercase"
          >
            Digital Forensic Evidence Platform
          </motion.p>
        </div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 space-y-6 shadow-2xl transition-colors hover:border-emerald-500/30 group"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white/90">Reset Password</h2>
            <div className="h-0.5 w-8 bg-emerald-500 rounded-full transition-all duration-300 group-hover:w-16" />
            <p className="pt-2 text-xs text-white/40 leading-relaxed">
              Create a new secure password for your ProofChain account.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all h-11 text-white pr-10"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-destructive/80" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all h-11 text-white"
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

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting…" : "Reset Password"}
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-white/40"
        >
          Nevermind?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] flex items-center justify-center">
        <div className="text-emerald-500 animate-pulse">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
