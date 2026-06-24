"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, FileSearch, ShieldAlert } from "lucide-react";

interface AnalystDossierProps {
 stats: {
 pendingReviews: number;
 verdictsIssued: number;
 authenticReviews: number;
 tamperedReviews: number;
 };
 recentVerdicts: any[];
}

export function AnalystDossier({ stats, recentVerdicts }: AnalystDossierProps) {
 return (
 <Tabs defaultValue="overview" className="w-full mt-10">
 <TabsList className="border rounded-sm p-1 grid w-full grid-cols-2 md:w-[400px]">
 <TabsTrigger value="overview" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]: data-[state=active]:text-cyan-500">
 Analysis Overview
 </TabsTrigger>
 <TabsTrigger value="log" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]: data-[state=active]:text-cyan-500">
 Security & Identity
 </TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="mt-6 space-y-6">
 <CardContainer className="grid gap-6 md:grid-cols-3">
 <Card className="border-t-2 border-t-cyan-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Pending Reviews</CardTitle>
 <FileSearch className="h-4 w-4 text-cyan-500" />
 </CardHeader>
 <CardContent>
 <CardContainer className="text-3xl font-bold font-mono">{stats.pendingReviews}</CardContainer>
 </CardContent>
 </Card>
 
 <Card className="border-t-2 border-t-cyan-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Verdicts Issued</CardTitle>
 <CheckCircle className="h-4 w-4 text-cyan-500" />
 </CardHeader>
 <CardContent>
 <CardContainer className="text-3xl font-bold font-mono">{stats.verdictsIssued}</CardContainer>
 </CardContent>
 </Card>

 <Card className="border-t-2 border-t-cyan-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Auth/Tampered</CardTitle>
 <ShieldAlert className="h-4 w-4 text-cyan-500" />
 </CardHeader>
 <CardContent>
 <CardContainer className="text-3xl font-bold font-mono">{stats.authenticReviews} <span className="text-muted-foreground text-xl">/</span> {stats.tamperedReviews}</CardContainer>
 </CardContent>
 </Card>
 </CardContainer>
 </TabsContent>

 <TabsContent value="log" className="mt-6">
 <Card className="rounded-sm">
 <CardHeader>
 <CardTitle className="text-sm font-mono uppercase text-muted-foreground flex items-center gap-2">
 <ShieldAlert className="h-4 w-4" />
 Recent Verdicts Log
 </CardTitle>
 </CardHeader>
 <CardContent>
 {recentVerdicts.length === 0 ? (
 <CardContainer className="text-center py-8 text-muted-foreground font-mono text-sm uppercase">
 No verdicts recorded.
 </CardContainer>
 ) : (
 <CardContainer className="space-y-4">
 {recentVerdicts.map((verdict, i) => {
 const isAuthentic = verdict.status === "authentic";
 return (
 <CardContainer key={i} className="flex items-start gap-4 p-3 border rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
 {isAuthentic ? (
 <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
 ) : (
 <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
 )}
 <CardContainer>
 <p className="font-mono text-sm uppercase">
 Verdict: <span className={isAuthentic ? "text-emerald-500" : "text-red-500"}>{verdict.status}</span>
 </p>
 <p className="font-mono text-xs text-muted-foreground mt-1">
 {new Date(verdict.createdAt).toLocaleString()} • Item: {verdict.evidenceId?.toString()?.substring(0, 12)}...
 </p>
 </CardContainer>
 </CardContainer>
 );
 })}
 </CardContainer>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 );
}
