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
  Fingerprint,
  FolderPlus,
} from "lucide-react";


const navItems = {
  investigator: [
    { label: "My Cases", href: "/investigator", icon: Search },
    { label: "New Case", href: "/investigator/cases/new", icon: FolderPlus },
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
    { label: "New Case", href: "/admin/cases/new", icon: FolderPlus },
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
                <Image src="/logo.png" alt="ProofChain Icon" width={28} height={28} className="object-contain rounded-md" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-heading font-extrabold tracking-[0.2em] truncate">
                    <span className="text-dash-text">PROOF</span>
                    <span className="text-emerald-500">CHAIN</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.25em] truncate mt-0.5">
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
              const isActive = (() => {
                if (item.href === "/investigator" || item.href === "/admin" || item.href === "/analyst") {
                  return pathname === item.href;
                }
                if (item.href === "/admin/cases" && pathname === "/admin/cases/new") {
                  return false;
                }
                return pathname.startsWith(item.href);
              })();

              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href} className={isCollapsed ? "flex justify-center" : ""}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={`transition-all duration-300 text-dash-muted hover:bg-dash-hover/60! hover:text-dash-text! data-[active=true]:bg-[var(--dash-active-bg)]! data-[active=true]:text-[var(--dash-active-text)]! rounded-xl border border-transparent data-[active=true]:border-[var(--dash-border)] data-[active=true]:shadow-sm ${isCollapsed ? "size-10 justify-center p-0" : "h-11 px-3"}`}
                  >
                    <Link href={item.href} className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                      <Icon size={20} className={isActive ? "text-[var(--dash-active-text)]" : "opacity-70"} />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-dash-border/50 min-h-[60px] flex items-center justify-center">
        {!isCollapsed ? (
          <div className="flex flex-col w-full overflow-hidden select-none">
            <span className="text-[10px] font-bold text-dash-muted/70 uppercase tracking-widest">
              Logged in as
            </span>
            <span className="text-xs text-dash-text font-bold truncate mt-0.5" title={user.fullName}>
              {user.fullName || "User Profile"}
            </span>
            <span className="text-[10px] text-dash-muted truncate font-medium mt-0.5" title={user.email}>
              {user.email}
            </span>
            <div className="mt-2.5 flex">
              <span className="inline-flex items-center text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {roleLabel[user.role]}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono">
            {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
