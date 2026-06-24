"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
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

import { Suspense } from "react";

function LoginForm() {
  const { login, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredsDialog, setShowCredsDialog] = useState(false);
  const [dynamicCreds, setDynamicCreds] = useState<Record<string, {email: string, password: string}>>({});
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
    fetch('/cred.md?t=' + Date.now()) // cache buster
      .then(res => res.text())
      .then(text => {
        const parsed: Record<string, any> = {};
        const blocks = text.split('###');
        blocks.slice(1).forEach(block => {
          const lines = block.trim().split('\n');
          const roleMatch = lines[0].match(/([a-zA-Z]+)/);
          const role = roleMatch ? roleMatch[1].toLowerCase() : null;
          const emailMatch = block.match(/- Email:\s*(.+)/);
          const passMatch = block.match(/- Password:\s*(.+)/);
          if (role && emailMatch && passMatch) {
            parsed[role] = {
              email: emailMatch[1].trim(),
              password: passMatch[1].trim()
            };
          }
        });
        setDynamicCreds(parsed);
      })
      .catch(console.error);
  }, []);

  // Ctrl+K Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCredsDialog((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      await login(values.email, values.password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-500/50 text-xs font-medium uppercase tracking-widest animate-pulse">
            Authenticating
          </p>
        </div>
      </div>
    );
  }

  // Hide form if user is already logged in (while redirecting)
  if (user) {
    return null;
  }

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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] px-4 overflow-hidden">
      {/* Background Network Nodes */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />
      

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
                  delay: 0.5 // Start after entrance
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

        <AnimatePresence mode="wait">
          {message && messageMap[message] && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-emerald-950/30 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400"
            >
              {messageMap[message]}
            </motion.div>
          )}
          {error && errorMap[error] && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
            >
              {errorMap[error]}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 space-y-6 shadow-2xl transition-colors hover:border-emerald-500/30 group"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white/90">Sign in</h2>
            <div className="h-0.5 w-8 bg-emerald-500 rounded-full transition-all duration-300 group-hover:w-16" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        className="bg-white/90 backdrop-blur-md border-white/20 focus:border-emerald-500 focus:ring-emerald-500/30 transition-all h-11 text-zinc-900 placeholder:text-zinc-500"
                        autoComplete="email"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive/80" />
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
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-white/90 backdrop-blur-md border-white/20 focus:border-emerald-500 focus:ring-emerald-500/30 transition-all h-11 text-zinc-900 placeholder:text-zinc-500 pr-10"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
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
                  {isSubmitting ? "Authenticating…" : "Continue"}
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
          New to the platform?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowCredsDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-emerald-500/30 bg-black/90 p-6 shadow-2xl shadow-emerald-500/10 space-y-4"
            >
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-semibold text-white">Test Credentials</h3>
                <p className="text-xs text-white/50">Select a role to auto-fill and login</p>
              </div>
              
              <div className="space-y-3 pt-2">
                {['investigator', 'analyst', 'admin'].map(role => {
                  const cred = dynamicCreds[role];
                  return (
                    <Button 
                      key={role}
                      type="button"
                      variant="outline" 
                      className="w-full justify-between border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white"
                      onClick={() => {
                        if (cred) handleAutoLogin(cred.email, cred.password);
                      }}
                    >
                      <span className="capitalize">{role}</span>
                      <span className="text-xs opacity-50">{cred ? cred.email : 'Loading...'}</span>
                    </Button>
                  );
                })}
              </div>
              <div className="pt-2 text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Reading live from cred.md</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#09111e] to-[#000000] flex items-center justify-center">
        <div className="text-emerald-500 animate-pulse">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}