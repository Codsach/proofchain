"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Briefcase, Activity, ShieldCheck } from "lucide-react";

interface InvestigatorDossierProps {
 stats: {
 evidenceSubmitted: number;
 activeCases: number;
 };
 recentSubmissions: any[];
}

export function InvestigatorDossier({ stats, recentSubmissions }: InvestigatorDossierProps) {
  return (
    <Tabs defaultValue="overview" className="w-full mt-10">
      <TabsList className="bg-dash-card border border-dash-border p-1 grid w-full grid-cols-2 md:w-[400px] rounded-xl">
        <TabsTrigger 
          value="overview" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-emerald-400"
        >
          Mission Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-emerald-400"
        >
          Custody Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <CardContainer className="grid gap-6 md:grid-cols-2">
          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-emerald-500 rounded-2xl hover:bg-dash-hover hover:border-emerald-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">Evidence Submitted</CardTitle>
              <FileText className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-dash-text">{stats.evidenceSubmitted}</CardContainer>
            </CardContent>
          </Card>
          
          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-emerald-500 rounded-2xl hover:bg-dash-hover hover:border-emerald-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">Active Cases</CardTitle>
              <Briefcase className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-dash-text">{stats.activeCases}</CardContainer>
            </CardContent>
          </Card>
        </CardContainer>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-dash-muted flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Recent Field Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <CardContainer className="text-center py-8 text-dash-muted font-mono text-sm uppercase">
                No recent activity logged.
              </CardContainer>
            ) : (
              <CardContainer className="space-y-4">
                {recentSubmissions.map((sub, i) => (
                  <CardContainer 
                    key={i} 
                    className="flex items-start gap-4 p-4 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-emerald-500/30 rounded-xl transition-all duration-300 cursor-pointer group"
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <CardContainer>
                      <p className="font-mono text-sm truncate text-dash-text group-hover:text-emerald-400 transition-colors">
                        {sub.title || "Unknown Evidence"}
                      </p>
                      <p className="font-mono text-xs text-dash-muted mt-1">
                        {new Date(sub.createdAt).toLocaleString()} • Hash: {sub.fileHash?.substring(0, 16)}...
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
