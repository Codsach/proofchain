"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { Variants } from "framer-motion";
import Link from "next/link";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock } from "lucide-react";
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

const cardCls =
  "rounded-2xl border border-white/70 bg-white/75 backdrop-blur-md p-8 space-y-6 shadow-[0_4px_30px_rgba(15,23,42,0.06),0_1px_8px_rgba(13,158,110,0.06)] hover:shadow-[0_8px_40px_rgba(13,158,110,0.12)] hover:border-[#10b981]/40 transition-all duration-300 group";
const labelCls = "label-md font-heading text-[#64748b] uppercase tracking-wider";
const iconCls = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]";
const inputCls =
  "bg-[#f8fafc] border-[#e2e8f0] focus:border-[#10b981] focus:ring-[#10b981]/20 transition-all h-11 text-[#1e293b] placeholder:text-[#94a3b8] font-sans rounded-lg";
const btnCls =
  "w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold h-11 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.20)] hover:shadow-[0_0_30px_rgba(16,185,129,0.40)] rounded-lg font-heading tracking-wide";

export default function RegisterPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", fullName: "" },
  });

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
          <div className={`${cardCls} !space-y-6`}>
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
              <h2 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider">Check your email</h2>
              <p className="body-sm text-[#64748b] font-sans">
                We sent a verification link to{" "}
                <span className="text-[#10b981] font-semibold">{form.getValues("email")}</span>.
                Click the link to activate your account.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#10b981] text-sm font-bold text-white transition-all hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] font-heading tracking-wide"
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
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={item} className="space-y-1">
          <h1 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider uppercase">Create account</h1>
          <p className="body-sm text-[#64748b] font-sans">Join ProofChain — secure forensic evidence platform</p>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -2 }} className={cardCls}>
          <div className="h-0.5 w-8 bg-[#0D9E6E] rounded-full transition-all duration-300 group-hover:w-16" />

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
                            className={`pl-10 ${inputCls}`}
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
                            className={`pl-10 ${inputCls}`}
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
                            type="password"
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
                            type="password"
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
                  {isSubmitting ? "Creating account…" : "Create account"}
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>

        <motion.p variants={item} className="text-center body-sm text-[#64748b] font-sans">
          Already have an account?{" "}
          <Link href="/login" className="text-[#10b981] hover:text-[#059669] font-semibold transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
}