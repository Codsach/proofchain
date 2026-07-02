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
    investigator: "bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 border-emerald-500/20",
    analyst: "bg-cyan-500/10 text-cyan-800 hover:bg-cyan-500/20 border-cyan-500/20",
    admin: "bg-purple-500/10 text-purple-800 hover:bg-purple-500/20 border-purple-500/20",
  }[user.role];

  const roleBarTheme = {
    investigator: "bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    analyst: "bg-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    admin: "bg-purple-650 shadow-[0_0_8px_rgba(168,85,247,0.4)]",
  }[user.role];

  const roleAccent = {
    investigator: "text-emerald-700",
    analyst: "text-cyan-700",
    admin: "text-purple-700",
  }[user.role];

  const roleBgAccent = {
    investigator: "bg-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.3)]",
    analyst: "bg-cyan-600 shadow-[0_0_6px_rgba(6,182,212,0.3)]",
    admin: "bg-purple-600 shadow-[0_0_6px_rgba(168,85,247,0.3)]",
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
    <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-md rounded-xl">
      {/* Strict utilitarian top bar */}
      <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
      
      <CardContent className="pt-8 pb-6 flex flex-col gap-6 relative">
        <CardContainer className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full">
          {/* Avatar Section */}
          <CardContainer className="relative group">
            <Avatar className="h-24 w-24 rounded-xl border border-dash-border bg-dash-hover/40 shadow-inner">
              <AvatarImage src={avatarPreview || undefined} className="object-cover" />
              <AvatarFallback className="rounded-xl text-dash-muted flex items-center justify-center bg-dash-hover/20">
                <User size={32} strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>
            
            <Label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer text-[10px] font-mono rounded-xl text-white tracking-widest font-bold"
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
          <CardContainer className="flex-1 space-y-2 w-full">
            <CardContainer className="flex items-center justify-between gap-3 flex-wrap w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="headline-sm font-bold tracking-wide uppercase font-heading text-dash-text">
                  {user.fullName}
                </h1>
                <Badge variant="outline" className={`rounded-md font-mono uppercase tracking-wider px-2 py-0.5 text-xs ${roleColor}`}>
                  {user.role}
                </Badge>
                {user.mfaEnabled ? (
                  <Badge variant="outline" className="rounded-md font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border-emerald-500/20 flex items-center gap-1 px-2 py-0.5 text-xs">
                    <ShieldCheck size={12} /> MFA Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-md font-mono uppercase tracking-wider bg-rose-500/10 text-rose-800 border-rose-500/20 px-2 py-0.5 text-xs">
                    MFA Disabled
                  </Badge>
                )}
              </div>
              <div className="flex-shrink-0">
                <EditDossierModal role={user.role} profile={profile} />
              </div>
            </CardContainer>
            <CardContainer className="text-dash-muted font-mono text-xs uppercase tracking-wider flex items-center gap-2">
              Status: <Badge variant="outline" className="rounded-md font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">Active Duty</Badge>
            </CardContainer>
          </CardContainer>

          {/* Official Data Grid */}
          <CardContainer className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs w-full md:w-auto bg-dash-input/30 p-4 border border-dash-border/60 rounded-xl">
            <CardContainer className="flex items-center gap-2 text-dash-muted">
              <Mail className={`h-3.5 w-3.5 ${roleAccent}`} />
              <span className="truncate max-w-[150px] text-dash-text">{user.email}</span>
            </CardContainer>
            <CardContainer className="flex items-center gap-2 text-dash-muted">
              <Phone className={`h-3.5 w-3.5 ${roleAccent}`} />
              <span className="text-dash-text">{profile?.phoneNumber || "Not Provided"}</span>
            </CardContainer>
            <CardContainer className="flex items-center gap-2 text-dash-muted sm:col-span-2">
              <MapPin className={`h-3.5 w-3.5 ${roleAccent}`} />
              <span className="text-dash-text">{profile?.department || "Not Provided"} - {profile?.location || "Not Provided"}</span>
            </CardContainer>
          </CardContainer>
        </CardContainer>
        
        {/* Metadata Row */}
        <CardContainer className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 text-[10px] text-dash-muted/70 font-mono uppercase w-full border-t border-dash-border/40 pt-4">
          <CardContainer className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" /> Member Since: <span className="text-dash-text">{formattedDate}</span>
          </CardContainer>
          <CardContainer className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Last Login: <span className="text-dash-text">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</span>
          </CardContainer>
        </CardContainer>

        {/* Extended Dossier Data */}
        <CardContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dash-border w-full">
          <CardContainer className="md:col-span-2 space-y-6">
            <CardContainer className="bg-dash-input/20 border border-dash-border p-5 rounded-xl">
              <CardTitle className="label-lg font-mono uppercase text-dash-muted mb-2 tracking-wider">Duty Notes / Bio</CardTitle>
              <p className="body-md font-mono text-dash-text/80 whitespace-pre-wrap leading-relaxed">
                {profile?.bio || "No duty notes recorded."}
              </p>
            </CardContainer>

            {profile?.skills && profile.skills.length > 0 && (
              <CardContainer className="bg-dash-input/20 border border-dash-border p-5 rounded-xl">
                <CardTitle className="label-lg font-mono uppercase text-dash-muted mb-3 tracking-wider">Certifications & Skills</CardTitle>
                <CardContainer className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-dash-muted bg-dash-input border-dash-border hover:bg-dash-hover hover:text-dash-text transition-colors font-mono text-[10px] uppercase rounded-md px-2 py-0.5">
                      {skill}
                    </Badge>
                  ))}
                </CardContainer>
              </CardContainer>
            )}
          </CardContainer>
          
          <CardContainer className="space-y-6">
            {(profile?.emergencyContactName || profile?.emergencyContactPhone) && (
              <CardContainer className="bg-dash-input/20 border border-dash-border p-5 rounded-xl">
                <CardTitle className="label-lg font-mono uppercase text-dash-muted mb-2 tracking-wider">Emergency Contact</CardTitle>
                <p className="body-md font-mono text-dash-text font-bold">{profile.emergencyContactName || "Unknown"}</p>
                <p className="body-sm text-dash-muted font-mono mt-1">{profile.emergencyContactPhone || "No number listed"}</p>
              </CardContainer>
            )}

            {profile?.assignedDevices && profile.assignedDevices.length > 0 && (
              <CardContainer className="bg-dash-input/20 border border-dash-border p-5 rounded-xl">
                <CardTitle className="label-lg font-mono uppercase text-dash-muted mb-3 tracking-wider">Assigned Hardware</CardTitle>
                <CardContainer className="flex flex-col gap-2">
                  {profile.assignedDevices.map((device, i) => (
                    <CardContainer key={i} className="text-xs text-dash-text/80 font-mono flex items-center gap-2">
                      <CardContainer className={`w-1.5 h-1.5 rounded-full ${roleBgAccent}`} />
                      <span className="body-sm">{device}</span>
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
