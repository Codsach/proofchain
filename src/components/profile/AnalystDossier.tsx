"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <TabsList className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-sm p-1 grid w-full grid-cols-2 md:w-[400px]">
        <TabsTrigger value="overview" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]:bg-[var(--dash-bg)] data-[state=active]:text-cyan-500">
          Analysis Overview
        </TabsTrigger>
        <TabsTrigger value="log" className="font-mono uppercase text-xs rounded-sm text-zinc-400 data-[state=active]:bg-[var(--dash-bg)] data-[state=active]:text-cyan-500">
          Security & Identity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-cyan-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">Pending Reviews</CardTitle>
              <FileSearch className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.pendingReviews}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-cyan-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">Verdicts Issued</CardTitle>
              <CheckCircle className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.verdictsIssued}</div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] border-t-2 border-t-cyan-500 rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)]">Auth/Tampered</CardTitle>
              <ShieldAlert className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--dash-text)] font-mono">{stats.authenticReviews} <span className="text-[var(--dash-muted)] text-xl">/</span> {stats.tamperedReviews}</div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-[var(--dash-muted)] flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Recent Verdicts Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVerdicts.length === 0 ? (
              <div className="text-center py-8 text-[var(--dash-muted)] font-mono text-sm uppercase">
                No verdicts recorded.
              </div>
            ) : (
              <div className="space-y-4">
                {recentVerdicts.map((verdict, i) => {
                  const isAuthentic = verdict.status === "authentic";
                  return (
                    <div key={i} className="flex items-start gap-4 p-3 border border-[var(--dash-border)] bg-[var(--dash-bg)] rounded-sm hover:bg-[var(--dash-hover)] hover:border-cyan-500/50 transition-all cursor-pointer group">
                      {isAuthentic ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-mono text-sm text-[var(--dash-text)] uppercase">
                          Verdict: <span className={isAuthentic ? "text-emerald-500" : "text-red-500"}>{verdict.status}</span>
                        </p>
                        <p className="font-mono text-xs text-[var(--dash-muted)] mt-1">
                          {new Date(verdict.createdAt).toLocaleString()} • Item: {verdict.evidenceId?.toString()?.substring(0, 12)}...
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
