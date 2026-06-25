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
      <TabsList className="bg-dash-card border border-dash-border p-1 grid w-full grid-cols-2 md:w-[400px] rounded-xl">
        <TabsTrigger 
          value="overview" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-cyan-400"
        >
          Analysis Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-cyan-400"
        >
          Recent Verdicts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <CardContainer className="grid gap-6 md:grid-cols-3">
          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-cyan-500 rounded-2xl hover:bg-dash-hover hover:border-cyan-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">Pending Reviews</CardTitle>
              <FileSearch className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-white">{stats.pendingReviews}</CardContainer>
            </CardContent>
          </Card>
          
          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-cyan-500 rounded-2xl hover:bg-dash-hover hover:border-cyan-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">Verdicts Issued</CardTitle>
              <CheckCircle className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-white">{stats.verdictsIssued}</CardContainer>
            </CardContent>
          </Card>

          <Card className="border border-dash-border bg-dash-card border-t-2 border-t-cyan-500 rounded-2xl hover:bg-dash-hover hover:border-cyan-500/50 ring-0 shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono uppercase text-dash-muted">Auth / Tampered</CardTitle>
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <CardContainer className="text-3xl font-bold font-mono text-white">
                <span className="text-emerald-400">{stats.authenticReviews}</span>
                <span className="text-dash-muted text-xl mx-1">/</span>
                <span className="text-rose-400">{stats.tamperedReviews}</span>
              </CardContainer>
            </CardContent>
          </Card>
        </CardContainer>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-dash-muted flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              Recent Verdicts Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVerdicts.length === 0 ? (
              <CardContainer className="text-center py-8 text-dash-muted font-mono text-sm uppercase">
                No verdicts recorded.
              </CardContainer>
            ) : (
              <CardContainer className="space-y-4">
                {recentVerdicts.map((verdict, i) => {
                  const isAuthentic = verdict.status === "authentic";
                  return (
                    <CardContainer 
                      key={i} 
                      className="flex items-start gap-4 p-4 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-cyan-500/30 rounded-xl transition-all duration-300 cursor-pointer group"
                    >
                      {isAuthentic ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5" />
                      )}
                      <CardContainer>
                        <p className="font-mono text-sm uppercase text-white">
                          Verdict: <span className={isAuthentic ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{verdict.status}</span>
                        </p>
                        <p className="font-mono text-xs text-dash-muted mt-1">
                          {new Date(verdict.createdAt).toLocaleString()} • Item: <span className="text-zinc-300">{verdict.evidenceId?.toString()?.substring(0, 12)}...</span>
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
