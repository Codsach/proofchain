"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardContainer, CardAction, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Calendar, Camera, Loader2, User, ShieldCheck, Clock } from "lucide-react";
import { useState } from "react";
import { uploadAvatar } from "@/app/(dashboard)/profile/actions";
import { EditDossierModal } from "./EditDossierModal";

interface DossierHeaderProps {
 user: {
 fullName: string;
 email: string;
 role: "investigator" | "analyst" | "admin";
 createdAt: string;
 lastLoginAt: string | null;
 mfaEnabled: boolean;
 };
 profile: {
 avatarUrl: string | null;
 phoneNumber: string | null;
 department: string | null;
 location: string | null;
 bio: string | null;
 emergencyContactName: string | null;
 emergencyContactPhone: string | null;
 skills: string[];
 assignedDevices: string[];
 } | null;
}

export function DossierHeader({ user, profile }: DossierHeaderProps) {
 const [isUploading, setIsUploading] = useState(false);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl || null);

 const roleColor = {
 investigator: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
 analyst: "bg-cyan-600/10 text-cyan-600 hover:bg-cyan-600/20 border-cyan-600/30",
 admin: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20",
 }[user.role];

 const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 try {
 setIsUploading(true);
 // Optimistic UI
 const objectUrl = URL.createObjectURL(file);
 setAvatarPreview(objectUrl);

 const formData = new FormData();
 formData.append("avatar", file);
 
 const res = await uploadAvatar(formData);
 if (res.success && res.url) {
 setAvatarPreview(res.url);
 } else {
 console.error(res.error);
 setAvatarPreview(profile?.avatarUrl || null); // Revert on failure
 }
 } catch (error) {
 console.error(error);
 setAvatarPreview(profile?.avatarUrl || null);
 } finally {
 setIsUploading(false);
 }
 };

 const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
 year: "numeric",
 month: "short",
 day: "numeric",
 });

 return (
 <Card className="relative overflow-hidden">
 {/* Strict utilitarian top bar */}
 <CardContainer className="absolute top-0 left-0 h-[2px] w-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
 
 <CardContent className="pt-8 pb-6 flex flex-col gap-6 relative">
 {/* Absolute positioned edit button so it stays in top right of content area */}
 <CardAction className="absolute right-6 top-6 z-10 p-0 border-none bg-transparent shadow-none ring-0">
 <EditDossierModal profile={profile} />
 </CardAction>

 <CardContainer className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full">
 {/* Avatar Section */}
 <CardContainer className="relative group">
 <Avatar className="h-24 w-24 rounded-md border">
 <AvatarImage src={avatarPreview || undefined} className="object-cover" />
 <AvatarFallback className="rounded-md text-muted-foreground flex items-center justify-center">
 <User size={32} strokeWidth={1.5} />
 </AvatarFallback>
 </Avatar>
 
 <Label 
 htmlFor="avatar-upload" 
 className="absolute inset-0 flex flex-col items-center justify-center /80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-xs font-mono rounded-md"
 >
 {isUploading ? <Loader2 className="h-4 w-4 animate-spin mb-1" /> : <Camera className="h-4 w-4 mb-1" />}
 {isUploading ? "UPLOADING" : "UPDATE"}
 </Label>
 <input 
 type="file" 
 id="avatar-upload" 
 className="hidden" 
 accept="image/*"
 onChange={handleAvatarChange}
 disabled={isUploading}
 />
 </CardContainer>

 {/* Identity Section */}
 <CardContainer className="flex-1 space-y-1">
 <CardContainer className="flex items-center gap-3">
 <h1 className="text-2xl font-bold tracking-tight uppercase">
 {user.fullName}
 </h1>
 <Badge variant="outline" className={`rounded-sm font-mono uppercase tracking-wider ${roleColor}`}>
 {user.role}
 </Badge>
 {user.mfaEnabled ? (
 <Badge variant="outline" className="rounded-sm font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
 <ShieldCheck size={12} /> MFA Active
 </Badge>
 ) : (
 <Badge variant="outline" className="rounded-sm font-mono uppercase tracking-wider bg-rose-500/10 text-rose-500 border-rose-500/20">
 MFA Disabled
 </Badge>
 )}
 </CardContainer>
 <CardContainer className="text-muted-foreground font-mono text-sm uppercase">
 Status: <span className="">Active Duty</span>
 </CardContainer>
 </CardContainer>

 {/* Official Data Grid */}
 <CardContainer className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs w-full md:w-auto">
 <CardContainer className="flex items-center gap-2 text-muted-foreground">
 <Mail className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
 <span className="truncate max-w-[150px]">{user.email}</span>
 </CardContainer>
 <CardContainer className="flex items-center gap-2 text-muted-foreground">
 <Phone className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
 <span>{profile?.phoneNumber || "Not Provided"}</span>
 </CardContainer>
 <CardContainer className="flex items-center gap-2 text-muted-foreground">
 <MapPin className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
 <span>{profile?.department || "Not Provided"} - {profile?.location || "Not Provided"}</span>
 </CardContainer>
 </CardContainer>
 
 {/* Metadata Row */}
 <CardContainer className="flex flex-col gap-1 mt-4 text-[10px] text-muted-foreground font-mono uppercase w-full">
 <CardContainer className="flex items-center gap-2">
 <Calendar className="h-3 w-3" /> Member Since: {formattedDate}
 </CardContainer>
 <CardContainer className="flex items-center gap-2">
 <Clock className="h-3 w-3" /> Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
 </CardContainer>
 </CardContainer>
 </CardContainer>

 {/* Extended Dossier Data */}
 <CardContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t w-full">
 <CardContainer className="md:col-span-2 space-y-4">
 <CardContainer>
 <CardTitle className="text-xs font-mono uppercase text-muted-foreground mb-1">Duty Notes / Bio</CardTitle>
 <p className="text-sm font-mono whitespace-pre-wrap">
 {profile?.bio || "No duty notes recorded."}
 </p>
 </CardContainer>
 {profile?.skills && profile.skills.length > 0 && (
 <CardContainer>
 <CardTitle className="text-xs font-mono uppercase text-muted-foreground mb-2">Certifications & Skills</CardTitle>
 <CardContainer className="flex flex-wrap gap-2">
 {profile.skills.map((skill, i) => (
 <Badge key={i} variant="outline" className="text-zinc-300 font-mono text-[10px] uppercase">
 {skill}
 </Badge>
 ))}
 </CardContainer>
 </CardContainer>
 )}
 </CardContainer>
 
 <CardContainer className="space-y-4">
 {(profile?.emergencyContactName || profile?.emergencyContactPhone) && (
 <CardContainer>
 <CardTitle className="text-xs font-mono uppercase text-muted-foreground mb-1">Emergency Contact</CardTitle>
 <p className="text-sm font-mono">{profile.emergencyContactName || "Unknown"}</p>
 <p className="text-xs text-muted-foreground font-mono">{profile.emergencyContactPhone || "No number listed"}</p>
 </CardContainer>
 )}

 {profile?.assignedDevices && profile.assignedDevices.length > 0 && (
 <CardContainer>
 <CardTitle className="text-xs font-mono uppercase text-muted-foreground mb-2">Assigned Hardware</CardTitle>
 <CardContainer className="flex flex-col gap-1">
 {profile.assignedDevices.map((device, i) => (
 <CardContainer key={i} className="text-xs text-zinc-300 font-mono flex items-center gap-2">
 <CardContainer className="w-1.5 h-1.5 rounded-full bg-[var(--dash-accent)]" />
 {device}
 </CardContainer>
 ))}
 </CardContainer>
 </CardContainer>
 )}
 </CardContainer>
 </CardContainer>
 </CardContent>
 </Card>
 );
}
