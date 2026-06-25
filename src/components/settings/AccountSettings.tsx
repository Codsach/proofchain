"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardContainer, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateAccountDetails } from "@/app/(dashboard)/settings/actions";

const accountSchema = z.object({
 fullName: z.string().min(2, "Name must be at least 2 characters"),
 email: z.string().email("Please enter a valid email"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountSettings({ role, user }: { role: "investigator" | "analyst" | "admin"; user: { fullName: string; email: string } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const roleBarTheme = {
    investigator: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    analyst: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]",
    admin: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]",
  }[role];

  const roleAccent = {
    investigator: "text-emerald-400",
    analyst: "text-cyan-400",
    admin: "text-purple-400",
  }[role];

  const roleSubmitBtn = {
    investigator: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:bg-emerald-500/50 disabled:cursor-not-allowed",
    analyst: "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:bg-cyan-500/50 disabled:cursor-not-allowed",
    admin: "bg-purple-500 text-white hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:bg-purple-500/50 disabled:cursor-not-allowed",
  }[role];

  const roleAccentGlow = {
    investigator: "hover:border-emerald-500/50 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50",
    analyst: "hover:border-cyan-500/50 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50",
    admin: "hover:border-purple-500/50 focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50",
  }[role];

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await updateAccountDetails(data);
      if (res.success) {
        toast({ title: "Account Updated", description: "Your details have been successfully saved." });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: res.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
      <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
      <CardHeader>
        <CardTitle className="text-xl font-heading tracking-wider uppercase text-white flex items-center gap-2">
          <User className={`h-5 w-5 ${roleAccent}`} />
          Identity Protocol
        </CardTitle>
        <CardDescription className="text-dash-muted font-mono text-xs uppercase tracking-wider">
          Update your core personnel details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 font-mono focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Email Address</FormLabel>
                    <FormControl>
                      <CardContainer className="relative">
                        <Mail className={`absolute left-3.5 top-3.5 h-4 w-4 ${roleAccent}`} />
                        <Input
                          placeholder="john.doe@example.com"
                          className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 pl-10 pr-4 font-mono focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`}
                          {...field}
                        />
                      </CardContainer>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContainer>
            <CardFooter className="flex justify-end pt-4 border-t border-dash-border bg-transparent p-0">
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isDirty}
                className={`font-mono font-bold uppercase rounded-xl h-11 px-6 transition-all ${roleSubmitBtn}`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? "Processing..." : "Save Identity"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
