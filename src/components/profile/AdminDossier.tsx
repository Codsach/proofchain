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
 <TabsList className="border rounded-sm p-1 grid w-full grid-cols-2 md:w-[400px]">
 <TabsTrigger value="overview" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]: data-[state=active]:text-purple-500">
 System Overview
 </TabsTrigger>
 <TabsTrigger value="log" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]: data-[state=active]:text-purple-500">
 Audit Log
 </TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="mt-6 space-y-6">
 <CardContainer className="grid gap-6 md:grid-cols-2">
 <Card className="border-t-2 border-t-purple-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-purple-500/50 transition-all cursor-pointer group">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Total System Users</CardTitle>
 <Users className="h-4 w-4 text-purple-500" />
 </CardHeader>
 <CardContent>
 <CardContainer className="text-3xl font-bold font-mono">{stats.totalUsers}</CardContainer>
 </CardContent>
 </Card>
 
 <Card className="border-t-2 border-t-purple-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-purple-500/50 transition-all cursor-pointer group">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground">System Events (24H)</CardTitle>
 <ServerCrash className="h-4 w-4 text-purple-500" />
 </CardHeader>
 <CardContent>
 <CardContainer className="text-3xl font-bold font-mono">{stats.recentAudits}</CardContainer>
 </CardContent>
 </Card>
 </CardContainer>
 </TabsContent>

 <TabsContent value="log" className="mt-6">
 <Card className="rounded-sm">
 <CardHeader>
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground flex items-center gap-2">
 <TerminalSquare className="h-4 w-4" />
 Administrative Actions
 </CardTitle>
 </CardHeader>
 <CardContent>
 {recentActions.length === 0 ? (
 <CardContainer className="text-center py-8 text-muted-foreground font-mono text-sm uppercase">
 No administrative actions recorded.
 </CardContainer>
 ) : (
 <CardContainer className="space-y-4">
 {recentActions.map((action, i) => (
 <CardContainer key={i} className="flex items-start gap-4 p-3 border rounded-sm hover:bg-[var(--dash-hover)] hover:border-purple-500/50 transition-all cursor-pointer group">
 <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
 <CardContainer>
 <p className="font-mono text-sm uppercase">{action.action}</p>
 <p className="font-mono text-xs text-muted-foreground mt-1">
 {new Date(action.createdAt).toLocaleString()} • Target: {action.targetId?.toString()?.substring(0, 12) || "SYSTEM"}
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
