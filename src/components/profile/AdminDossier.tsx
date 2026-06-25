"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
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
      <TabsList className="bg-dash-card border border-dash-border p-1 grid w-full grid-cols-2 md:w-[400px] rounded-xl">
        <TabsTrigger 
          value="overview" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-purple-400"
        >
          System Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-purple-400"
        >
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <CardContainer className="grid gap-6 md:grid-cols-2">
          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-purple-500 rounded-2xl hover:bg-dash-hover hover:border-purple-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">Total System Users</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-white">{stats.totalUsers}</CardContainer>
            </CardContent>
          </Card>
          
          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-purple-500 rounded-2xl hover:bg-dash-hover hover:border-purple-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">System Events (24H)</CardTitle>
              <ServerCrash className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-white">{stats.recentAudits}</CardContainer>
            </CardContent>
          </Card>
        </CardContainer>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-dash-muted flex items-center gap-2">
              <TerminalSquare className="h-4 w-4 text-purple-400" />
              Administrative Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <CardContainer className="text-center py-8 text-dash-muted font-mono text-sm uppercase">
                No administrative actions recorded.
              </CardContainer>
            ) : (
              <CardContainer className="space-y-4">
                {recentActions.map((action, i) => (
                  <CardContainer 
                    key={i} 
                    className="flex items-start gap-4 p-4 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-purple-500/30 rounded-xl transition-all duration-300 cursor-pointer group"
                  >
                    <Shield className="h-5 w-5 text-purple-400 mt-0.5" />
                    <CardContainer>
                      <p className="font-mono text-sm uppercase text-white">{action.action}</p>
                      <p className="font-mono text-xs text-dash-muted mt-1">
                        {new Date(action.createdAt).toLocaleString()} • Target: <span className="text-zinc-300">{action.targetId?.toString()?.substring(0, 12) || "SYSTEM"}</span>
                      </p>
                    </CardContainer>
                  </CardContainer>
                ))}
              </CardContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
 );
}
