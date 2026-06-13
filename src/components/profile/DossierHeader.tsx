"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Calendar, Camera, Loader2 } from "lucide-react";
import { useState } from "react";
import { uploadAvatar } from "@/app/(dashboard)/profile/actions";

interface DossierHeaderProps {
  user: {
    fullName: string;
    email: string;
    role: "investigator" | "analyst" | "admin";
    createdAt: string;
  };
  profile: {
    avatarUrl: string | null;
    phoneNumber: string | null;
    department: string | null;
    location: string | null;
  } | null;
}

export function DossierHeader({ user, profile }: DossierHeaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl || null);

  const roleColor = {
    investigator: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
    analyst: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border-cyan-500/20",
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
    <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-none relative overflow-hidden">
      {/* Strict utilitarian top bar */}
      <div className="h-2 w-full bg-[var(--dash-border)]" />
      
      <CardContent className="pt-6 pb-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="h-24 w-24 rounded-md border border-[var(--dash-border)] bg-[var(--dash-bg)]">
            <AvatarImage src={avatarPreview || undefined} className="object-cover" />
            <AvatarFallback className="rounded-md bg-[var(--dash-bg)] text-[var(--dash-text)] text-2xl font-mono">
              {user.fullName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <label 
            htmlFor="avatar-upload" 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-mono text-white"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mb-1" /> : <Camera className="h-4 w-4 mb-1" />}
            {isUploading ? "UPLOADING" : "UPDATE"}
          </label>
          <input 
            type="file" 
            id="avatar-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
        </div>

        {/* Identity Section */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-text)] uppercase">
              {user.fullName}
            </h1>
            <Badge variant="outline" className={`rounded-sm font-mono uppercase tracking-wider ${roleColor}`}>
              {user.role}
            </Badge>
          </div>
          <div className="text-[var(--dash-muted)] font-mono text-sm uppercase">
            Status: <span className="text-[var(--dash-text)]">Active Duty</span>
          </div>
        </div>

        {/* Official Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs w-full md:w-auto">
          <div className="flex items-center gap-2 text-[var(--dash-muted)]">
            <Mail className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
            <span className="truncate max-w-[150px]">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--dash-muted)]">
            <Phone className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
            <span>{profile?.phoneNumber || "UNLISTED"}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--dash-muted)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
            <span>{profile?.department || "HQ"} - {profile?.location || "UNDISCLOSED"}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--dash-muted)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--dash-accent)]" />
            <span>SINCE {formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
