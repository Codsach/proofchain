"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, FileSearch, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";

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
  const cards = [
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      description: "Awaiting analyst verdict",
      icon: FileSearch,
      variantKey: "cyan" as const,
      metaText: "Active",
    },
    {
      label: "Verdicts Issued",
      value: stats.verdictsIssued,
      description: "Verdicts signed on-chain",
      icon: CheckCircle,
      variantKey: "blue" as const,
      metaText: "Verified",
    },
    {
      label: "Authentic / Tampered",
      value: (
        <div className="flex items-baseline">
          <span className="text-slate-900 leading-none tracking-tight font-black text-[42px]">{stats.authenticReviews}</span>
          <span className="text-slate-400 font-mono mx-1.5 text-2xl font-light">/</span>
          <span className="text-rose-600 leading-none tracking-tight font-black text-[42px]">{stats.tamperedReviews}</span>
        </div>
      ),
      description: "Consensus integrity logs",
      icon: ShieldAlert,
      variantKey: "orange" as const,
      metaText: "Live",
    }
  ];

  return (
    <Tabs defaultValue="overview" className="w-full mt-10">
      <TabsList className="bg-dash-card border border-dash-border p-1 grid w-full grid-cols-2 md:w-[400px] rounded-xl">
        <TabsTrigger 
          value="overview" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-cyan-700"
        >
          Analysis Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-cyan-700"
        >
          Recent Verdicts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6 w-full">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full">
          {cards.map((card) => {
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="h-full w-full"
              >
                <StatCard
                  label={card.label}
                  value={card.value}
                  description={card.description}
                  icon={card.icon}
                  variantKey={card.variantKey}
                  metaText={card.metaText}
                />
              </motion.div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-dash-muted flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-700" />
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
                      className="flex items-start gap-4 py-4 px-5 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-cyan-600/30 rounded-xl transition-all duration-300 cursor-pointer group"
                    >
                      {isAuthentic ? (
                        <CheckCircle className="h-5 w-5 text-emerald-700 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-700 mt-0.5" />
                      )}
                      <CardContainer>
                        <p className="font-mono text-sm uppercase text-dash-text">
                          Verdict: <span className={isAuthentic ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>{verdict.status}</span>
                        </p>
                        <p className="font-mono text-xs text-dash-muted mt-1">
                          {new Date(verdict.createdAt).toLocaleString()} • Item: <span className="text-dash-muted">{verdict.evidenceId?.toString()?.substring(0, 12)}...</span>
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
