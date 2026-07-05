"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { Variants } from "framer-motion";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { RegisterSchema } from "@/lib/schemas/auth";
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
import { ChainRings } from "@/components/auth/illustrations/ChainRings";

// Add confirm password to schema for the form only
const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormInput = z.infer<typeof RegisterFormSchema>;

// Stagger variants
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// Styling variables aligned with sentinel-theme-v2 tokens
const cardCls =
  "rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-8 py-7 space-y-5 shadow-sm hover:shadow-md hover:border-[var(--dash-accent)]/30 transition-all duration-300 group";
const labelCls = "label-md font-heading text-[var(--dash-muted)] uppercase tracking-wider font-semibold";
const iconCls = "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--dash-muted)]/50";
const inputCls =
  "bg-[var(--dash-input)] border-[var(--dash-border)] focus:border-[var(--dash-accent)] focus:ring-[var(--dash-accent)]/20 transition-all h-12 text-[var(--dash-text)] placeholder:text-[var(--dash-muted)]/50 font-sans rounded-xl w-full border";
const btnCls =
  "w-full bg-[var(--dash-accent)] hover:bg-[var(--dash-active-text)] text-white font-bold h-12 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.30)] rounded-xl font-heading tracking-wide";

const getPasswordStrength = (password: string) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const getStrengthProps = (score: number) => {
  switch (score) {
    case 0:
      return { width: "0%", color: "bg-transparent", label: "" };
    case 1:
      return { width: "20%", color: "bg-rose-500", label: "Very Weak" };
    case 2:
      return { width: "40%", color: "bg-rose-400", label: "Weak" };
    case 3:
      return { width: "60%", color: "bg-amber-500", label: "Medium" };
    case 4:
      return { width: "80%", color: "bg-emerald-500", label: "Strong" };
    case 5:
    default:
      return { width: "100%", color: "bg-emerald-600", label: "Enterprise Secure" };
  }
};

export default function RegisterPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", fullName: "" },
  });

  const password = form.watch("password") || "";
  const strength = getPasswordStrength(password);
  const strengthProps = getStrengthProps(strength);

  const checkCapsLock = (e: React.KeyboardEvent) => {
    const caps = e.getModifierState("CapsLock");
    setIsCapsLockOn(caps);
  };

  const onSubmit = async (values: RegisterFormInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password, fullName: values.fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Registration failed",
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

  // Success state
  if (submitted) {
    return (
      <AuthLayout leftPanel={<ChainRings />}>
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
                className="h-16 w-16 bg-[#10b981]/10 border border-[#10b981]/30 rounded-full flex items-center justify-center"
              >
                <span className="text-3xl text-[#10b981]">✓</span>
              </motion.div>
            </div>
            <div className="space-y-2">
              <h2 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">Check your email</h2>
              <p className="body-sm text-[var(--dash-muted)] font-sans">
                We sent a verification link to{" "}
                <span className="text-[var(--dash-accent)] font-semibold">{form.getValues("email")}</span>.
                Click the link to activate your account.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--dash-accent)] text-sm font-bold text-white transition-all hover:bg-[var(--dash-active-text)] shadow-sm font-heading tracking-wide"
            >
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftPanel={<ChainRings />}>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4">
        <motion.div variants={item} className="space-y-1">
          <h1 className="headline-sm font-heading font-bold text-[var(--dash-text)] tracking-wider uppercase">Create account</h1>
          <p className="body-sm text-[var(--dash-muted)] font-sans">Join ProofChain — secure forensic evidence platform</p>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -1 }} className={cardCls}>
          <div className="h-0.5 w-8 bg-[var(--dash-accent)] rounded-full transition-all duration-300 group-hover:w-16" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>Full name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className={iconCls} />
                          <Input
                            placeholder="Jane Smith"
                            className={`pl-10 pr-4 ${inputCls}`}
                            autoComplete="name"
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

              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className={iconCls} />
                          <Input
                            type="email"
                            placeholder="name@company.com"
                            className={`pl-10 pr-4 ${inputCls}`}
                            autoComplete="email"
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

              <motion.div variants={item}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelCls}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className={iconCls} />
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
                      
                      {password && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-[var(--dash-muted)]">Password Strength</span>
                            <span className={
                              strength <= 2 ? "text-rose-500" : strength <= 3 ? "text-amber-500" : "text-emerald-500"
                            }>
                              {strengthProps.label}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-[var(--dash-input)] rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${strengthProps.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: strengthProps.width }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

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
                      <FormLabel className={labelCls}>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className={iconCls} />
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
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </motion.div>

              <div className="text-center pt-1.5">
                <p className="body-sm text-[var(--dash-muted)] font-sans">
                  Already have an account?{" "}
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