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
      <TabsList className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-sm p-1 grid w-full grid-cols-2 md:w-[400px]">
        <TabsTrigger value="overview" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]:bg-[var(--dash-bg)] data-[state=active]:text-[var(--dash-accent)]">
          Mission Overview
        </TabsTrigger>
        <TabsTrigger value="log" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]:bg-[var(--dash-bg)] data-[state=active]:text-[var(--dash-accent)]">
          Custody Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <CardContainer className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-[var(--dash-accent)] rounded-sm hover:bg-[var(--dash-hover)] hover:border-[var(--dash-accent)] transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">Evidence Submitted</CardTitle>
              <FileText className="h-4 w-4 text-[var(--dash-accent)]" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.evidenceSubmitted}</CardContainer>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-emerald-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-[var(--dash-accent)] transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">Active Cases</CardTitle>
              <Briefcase className="h-4 w-4 text-[var(--dash-accent)]" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.activeCases}</CardContainer>
            </CardContent>
          </Card>
        </CardContainer>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)] flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Field Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <CardContainer className="text-center py-8 text-[var(--dash-muted)] font-mono text-sm uppercase">
                No recent activity logged.
              </CardContainer>
            ) : (
              <CardContainer className="space-y-4">
                {recentSubmissions.map((sub, i) => (
                  <CardContainer key={i} className="flex items-start gap-4 p-3 border border-[var(--dash-border)] bg-[var(--dash-bg)] rounded-sm hover:bg-[var(--dash-hover)] hover:border-[var(--dash-accent)] transition-all cursor-pointer group">
                    <ShieldCheck className="h-5 w-5 text-[var(--dash-accent)] mt-0.5" />
                    <CardContainer>
                      <p className="font-mono text-sm text-[var(--dash-text)] truncate">{sub.title || "Unknown Evidence"}</p>
                      <p className="font-mono text-xs text-[var(--dash-muted)] mt-1">
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
