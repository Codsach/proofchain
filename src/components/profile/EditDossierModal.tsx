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

export function EditDossierModal({ profile }: EditDossierModalProps) {
 const [open, setOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const { toast } = useToast();

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
 // Page refresh or state lift would happen here to show the new data immediately. 
 // For now, Next.js might revalidate the path if we call router.refresh(), but we are just handling the action.
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
 <Button variant="outline" size="sm" className="border-[var(--dash-accent)] text-[var(--dash-accent)] hover:bg-[var(--dash-accent)] hover:text-black shadow-[0_0_15px_rgba(34,197,94,0.1)]">
 <Edit className="w-4 h-4 mr-2" />
 Edit Dossier
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[600px] bg-[var(--dash-modal)] border">
 <DialogHeader>
 <DialogTitle className="text-xl font-mono uppercase">Update Dossier</DialogTitle>
 </DialogHeader>

 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
 <Tabs defaultValue="general" className="w-full">
 <TabsList className="grid w-full grid-cols-3 border">
 <TabsTrigger value="general" className="font-mono text-xs uppercase data-[state=active]: data-[state=active]:text-[var(--dash-accent)]">General</TabsTrigger>
 <TabsTrigger value="operational" className="font-mono text-xs uppercase data-[state=active]: data-[state=active]:text-[var(--dash-accent)]">Operational</TabsTrigger>
 <TabsTrigger value="emergency" className="font-mono text-xs uppercase data-[state=active]: data-[state=active]:text-[var(--dash-accent)]">Emergency</TabsTrigger>
 </TabsList>

 <TabsContent value="general" className="space-y-4 mt-4">
 <CardContainer className="grid grid-cols-2 gap-4">
 <FormField control={form.control} name="phoneNumber" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Phone Number</FormLabel>
 <FormControl>
 <Input placeholder="+1..." className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />
 <FormField control={form.control} name="department" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Department</FormLabel>
 <FormControl>
 <Input placeholder="e.g. Cyber Forensics" className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />
 </CardContainer>
 
 <FormField control={form.control} name="location" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Location / Precinct</FormLabel>
 <FormControl>
 <Input placeholder="e.g. HQ - Sector 7" className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />

 <FormField control={form.control} name="bio" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Duty Notes / Bio</FormLabel>
 <FormControl>
 <Textarea placeholder="Professional summary or active duty notes..." className="resize-none" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />
 </TabsContent>

 <TabsContent value="operational" className="space-y-4 mt-4">
 <FormField control={form.control} name="skills" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Skills & Certifications (Comma Separated)</FormLabel>
 <FormControl>
 <Input placeholder="OSINT, Network Forensics, CEH..." className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />

 <FormField control={form.control} name="assignedDevices" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Assigned Devices (Comma Separated)</FormLabel>
 <FormControl>
 <Input placeholder="Laptop-AX12, Mobile-Z9..." className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />
 </TabsContent>

 <TabsContent value="emergency" className="space-y-4 mt-4">
 <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Emergency Contact Name</FormLabel>
 <FormControl>
 <Input placeholder="Full Name" className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />

 <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
 <FormItem>
 <FormLabel className="text-muted-foreground font-mono text-xs">Emergency Contact Phone</FormLabel>
 <FormControl>
 <Input placeholder="+1..." className="" {...field} value={field.value || ""} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )} />
 </TabsContent>
 </Tabs>

 <CardFooter className="flex justify-end pt-4 border-t bg-transparent p-0">
 <Button type="submit" disabled={isSubmitting} className="bg-[var(--dash-accent)] text-black hover:bg-emerald-600 font-mono font-bold">
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
