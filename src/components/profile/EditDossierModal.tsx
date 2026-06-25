"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CardContainer, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateDossier } from "@/app/(dashboard)/profile/actions";
import { useToast } from "@/hooks/use-toast";
import { Edit, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const dossierSchema = z.object({
 phoneNumber: z.string().optional().nullable(),
 department: z.string().optional().nullable(),
 location: z.string().optional().nullable(),
 bio: z.string().max(500, "Bio must be under 500 characters").optional().nullable(),
 emergencyContactName: z.string().optional().nullable(),
 emergencyContactPhone: z.string().optional().nullable(),
 skills: z.string().optional().nullable(), // We'll process this to an array
 assignedDevices: z.string().optional().nullable(), // We'll process this to an array
});

type DossierFormValues = z.infer<typeof dossierSchema>;

interface EditDossierModalProps {
  role: "investigator" | "analyst" | "admin";
  profile: {
    phoneNumber?: string | null;
    department?: string | null;
    location?: string | null;
    bio?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    skills?: string[];
    assignedDevices?: string[];
  } | null;
}

export function EditDossierModal({ role, profile }: EditDossierModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const roleAccent = {
    investigator: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-400",
    analyst: "text-cyan-400 border-cyan-500/30 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-400",
    admin: "text-purple-400 border-purple-500/30 hover:bg-purple-500 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-400",
  }[role];

  const roleSubmitBtn = {
    investigator: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    analyst: "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    admin: "bg-purple-500 text-white hover:bg-purple-450 shadow-[0_0_15px_rgba(168,85,247,0.3)]",
  }[role];

  const roleAccentGlow = {
    investigator: "hover:border-emerald-500/50 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50",
    analyst: "hover:border-cyan-500/50 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50",
    admin: "hover:border-purple-500/50 focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50",
  }[role];

  const roleTabsActive = {
    investigator: "data-[state=active]:bg-dash-hover data-[state=active]:text-emerald-400",
    analyst: "data-[state=active]:bg-dash-hover data-[state=active]:text-cyan-400",
    admin: "data-[state=active]:bg-dash-hover data-[state=active]:text-purple-400",
  }[role];

  const form = useForm<DossierFormValues>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      phoneNumber: profile?.phoneNumber || "",
      department: profile?.department || "",
      location: profile?.location || "",
      bio: profile?.bio || "",
      emergencyContactName: profile?.emergencyContactName || "",
      emergencyContactPhone: profile?.emergencyContactPhone || "",
      skills: profile?.skills?.join(", ") || "",
      assignedDevices: profile?.assignedDevices?.join(", ") || "",
    },
  });

  const onSubmit = async (data: DossierFormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        phoneNumber: data.phoneNumber || null,
        department: data.department || null,
        location: data.location || null,
        bio: data.bio || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        assignedDevices: data.assignedDevices ? data.assignedDevices.split(",").map(s => s.trim()).filter(Boolean) : [],
      };

      const res = await updateDossier(payload);
      
      if (res.success) {
        toast({ title: "Dossier Updated", description: "Your profile has been successfully updated." });
        setOpen(false);
        window.location.reload(); 
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: res.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`font-mono border transition-all duration-300 rounded-xl h-9 px-4 ${roleAccent}`}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Dossier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-dash-modal border border-dash-border rounded-2xl shadow-2xl ring-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading tracking-wider uppercase text-white">Update Dossier</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-dash-sidebar border border-dash-border p-1 rounded-xl">
                <TabsTrigger value="general" className={`font-mono text-xs uppercase rounded-lg text-dash-muted transition-all ${roleTabsActive}`}>General</TabsTrigger>
                <TabsTrigger value="operational" className={`font-mono text-xs uppercase rounded-lg text-dash-muted transition-all ${roleTabsActive}`}>Operational</TabsTrigger>
                <TabsTrigger value="emergency" className={`font-mono text-xs uppercase rounded-lg text-dash-muted transition-all ${roleTabsActive}`}>Emergency</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <CardContainer className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dash-muted font-mono text-xs uppercase">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1..." className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dash-muted font-mono text-xs uppercase">Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Cyber Forensics" className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContainer>
                
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Location / Precinct</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HQ - Sector 7" className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Duty Notes / Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Professional summary or active duty notes..." className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl p-3 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all resize-none h-24 ${roleAccentGlow}`} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>

              <TabsContent value="operational" className="space-y-4 mt-4">
                <FormField control={form.control} name="skills" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Skills & Certifications (Comma Separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="OSINT, Network Forensics, CEH..." className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="assignedDevices" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Assigned Devices (Comma Separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="Laptop-AX12, Mobile-Z9..." className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4 mt-4">
                <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1..." className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>
            </Tabs>

            <CardFooter className="flex justify-end pt-4 border-t border-dash-border bg-transparent p-0">
              <Button type="submit" disabled={isSubmitting} className={`font-mono font-bold uppercase rounded-xl h-11 px-6 transition-all ${roleSubmitBtn}`}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? "UPDATING..." : "SAVE DOSSIER"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
