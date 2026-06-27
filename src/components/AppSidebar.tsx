"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ShieldCheck,
  Search,
  Users,
  Activity,
  FileText,
  LogOut,
  Hexagon,
  ChevronLeft,
  Briefcase,
  User,
  Settings,
  Fingerprint
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { MfaSetupModal } from "@/components/MfaSetupModal";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = {
  investigator: [
    { label: "My Cases", href: "/investigator", icon: Search },
    { label: "Submit Evidence", href: "/investigator/submit", icon: ShieldCheck },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  analyst: [
    { label: "Case Queue", href: "/analyst", icon: Activity },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: Hexagon },
    { label: "Cases", href: "/admin/cases", icon: Briefcase },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Audit Log", href: "/admin/audit", icon: FileText },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

const roleLabel: Record<string, string> = {
  investigator: "Investigator",
  analyst: "Forensic Analyst",
  admin: "Administrator",
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const [isMfaOpen, setIsMfaOpen] = useState(false);

  if (!user) return null;

  const items = navItems[user.role as keyof typeof navItems] ?? [];
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-dash-border bg-dash-sidebar"
    >
      <SidebarHeader className="py-6 px-4 border-b border-dash-border/50 min-h-[96px] flex items-center justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 shrink-0 overflow-hidden">
                <Image src="/icon-v2.png" alt="ProofChain Icon" width={28} height={28} className="object-contain" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-lg font-bold tracking-tight truncate">
                    <span className="text-dash-text">Proof</span>
                    <span className="text-emerald-500">Chain</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest truncate">
                    {roleLabel[user.role]}
                  </span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarMenu className="gap-3">
            {items.map((item) => {
              const isActive =
                item.href === "/investigator" || item.href === "/admin" || item.href === "/analyst"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href} className={isCollapsed ? "flex justify-center" : ""}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={`transition-all duration-300 text-dash-muted hover:bg-dash-hover/60! hover:text-dash-text! data-[active=true]:bg-transparent! data-[active=true]:hover:bg-dash-hover/60! rounded-xl ${isCollapsed ? "size-10 justify-center p-0" : "h-11 px-2"}`}
                  >
                    <Link href={item.href} className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                      <div className={`flex items-center justify-center rounded-full shrink-0 transition-all duration-300 ${isActive ? "bg-[var(--dash-active-bg)] text-[var(--dash-active-text)] shadow-sm size-9" : "size-9"}`}>
                        <Icon size={20} className={isActive ? "" : "opacity-70"} />
                      </div>
                      {!isCollapsed && <span className={isActive ? "text-dash-text font-medium" : ""}>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-dash-border/50 min-h-[80px]">
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-8 w-8 rounded-full border border-dash-border bg-dash-bg">
                  <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                    {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-dash-muted/70 uppercase tracking-widest">
                    Logged in as
                  </span>
                  <span className="text-xs text-dash-muted truncate font-medium" title={user.email}>
                    {user.email}
                  </span>
                </div>
              </div>
              <NotificationBell />
            </div>

            <SidebarMenuButton
              onClick={() => setIsMfaOpen(true)}
              className="h-10 mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold justify-center rounded-xl shadow-sm transition-colors"
            >
              <ShieldCheck size={18} />
              <span>Enable 2FA</span>
            </SidebarMenuButton>

            <SidebarMenuButton
              onClick={logout}
              className="h-10 text-dash-muted hover:text-rose-400 hover:bg-rose-500/10 justify-start rounded-xl px-3"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <Avatar className="h-8 w-8 rounded-full border border-dash-border bg-dash-bg">
              <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex justify-center w-full">
              <NotificationBell />
            </div>
            
            <SidebarMenuButton
              onClick={() => setIsMfaOpen(true)}
              tooltip="Enable 2FA"
              className="size-10 flex items-center justify-center text-dash-muted hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl p-0"
            >
              <ShieldCheck size={20} />
            </SidebarMenuButton>

            <SidebarMenuButton
              onClick={logout}
              tooltip="Logout"
              className="size-10 flex items-center justify-center text-dash-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-xl p-0"
            >
              <LogOut size={20} />
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
      <MfaSetupModal isOpen={isMfaOpen} onClose={() => setIsMfaOpen(false)} />
    </Sidebar>
  );
}
