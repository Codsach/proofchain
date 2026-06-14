"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ServerCrash, TerminalSquare, Shield } from "lucide-react";

interface AdminDossierProps {
  stats: {
    totalUsers: number;
    recentAudits: number;
  };
  recentActions: any[];
}

export function AdminDossier({ stats, recentActions }: AdminDossierProps) {
  return (
    <Tabs defaultValue="overview" className="w-full mt-10">
      <TabsList className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-sm p-1 grid w-full grid-cols-2 md:w-[400px]">
        <TabsTrigger value="overview" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]:bg-[var(--dash-bg)] data-[state=active]:text-purple-500">
          System Overview
        </TabsTrigger>
        <TabsTrigger value="log" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]:bg-[var(--dash-bg)] data-[state=active]:text-purple-500">
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-purple-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-purple-500/50 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">Total System Users</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-purple-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-purple-500/50 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">System Events (24H)</CardTitle>
              <ServerCrash className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.recentAudits}</div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)] flex items-center gap-2">
              <TerminalSquare className="h-4 w-4" />
              Administrative Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <div className="text-center py-8 text-[var(--dash-muted)] font-mono text-sm uppercase">
                No administrative actions recorded.
              </div>
            ) : (
              <div className="space-y-4">
                {recentActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 border border-[var(--dash-border)] bg-[var(--dash-bg)] rounded-sm hover:bg-[var(--dash-hover)] hover:border-purple-500/50 transition-all cursor-pointer group">
                    <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-mono text-sm text-[var(--dash-text)] uppercase">{action.action}</p>
                      <p className="font-mono text-xs text-[var(--dash-muted)] mt-1">
                        {new Date(action.createdAt).toLocaleString()} • Target: {action.targetId?.toString()?.substring(0, 12) || "SYSTEM"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
