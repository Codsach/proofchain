"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function AccountSettings({ user }: { user: { fullName: string; email: string } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
        // The router will refresh from the parent, or we can just let it be optimistic
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
    <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-none relative overflow-hidden">
      <div className="absolute top-0 left-0 h-[2px] w-full bg-[var(--dash-accent)] shadow-[0_0_8px_var(--dash-accent)]" />
      <CardHeader>
        <CardTitle className="text-xl font-mono uppercase text-[var(--dash-text)] flex items-center gap-2">
          <User className="h-5 w-5 text-[var(--dash-accent)]" />
          Identity Protocol
        </CardTitle>
        <CardDescription className="text-[var(--dash-muted)] font-mono text-xs uppercase">
          Update your core personnel details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--dash-muted)] font-mono text-xs uppercase">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-[var(--dash-bg)] border-[var(--dash-border)] text-white font-mono"
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
                    <FormLabel className="text-[var(--dash-muted)] font-mono text-xs uppercase">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--dash-muted)]" />
                        <Input
                          placeholder="john.doe@example.com"
                          className="pl-9 bg-[var(--dash-bg)] border-[var(--dash-border)] text-white font-mono"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-[var(--dash-border)]">
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isDirty}
                className="bg-[var(--dash-accent)] text-black hover:bg-emerald-600 font-mono font-bold uppercase"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? "Processing..." : "Save Identity"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
