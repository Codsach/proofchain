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
          <span className="type-statistic text-dash-text leading-none">{stats.authenticReviews}</span>
          <span className="text-dash-muted/70 font-sans mx-1.5 text-2xl font-light">/</span>
          <span className="type-statistic text-rose-600 leading-none">{stats.tamperedReviews}</span>
        </div>
      ),
      description: "Consensus integrity logs",
      icon: ShieldAlert,
      variantKey: "orange" as const,
      metaText: "Live",
    }
  ];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="bg-dash-input/50 border border-dash-border p-0.5 inline-flex w-fit rounded-lg gap-1">
        <TabsTrigger 
          value="overview" 
          className="font-sans uppercase text-[10px] tracking-wider rounded-md text-dash-muted transition-all px-4 py-1.5 data-[state=active]:bg-dash-card data-[state=active]:text-cyan-600 data-[state=active]:shadow-2xs font-bold"
        >
          Analysis Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-sans uppercase text-[10px] tracking-wider rounded-md text-dash-muted transition-all px-4 py-1.5 data-[state=active]:bg-dash-card data-[state=active]:text-cyan-600 data-[state=active]:shadow-2xs font-bold"
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
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px]">
          <CardHeader className="p-0 mb-[20px]">
            <CardTitle className="text-xs font-sans uppercase text-dash-muted flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-600" />
              Recent Verdicts Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentVerdicts.length === 0 ? (
              <CardContainer className="text-center py-6 text-[11px] text-dash-muted/60 font-sans uppercase tracking-wider">
                No verdicts recorded
              </CardContainer>
            ) : (
              <CardContainer className="space-y-[12px]">
                {recentVerdicts.map((verdict, i) => {
                  const isAuthentic = verdict.status === "authentic";
                  return (
                    <CardContainer 
                      key={i} 
                      className="flex items-start gap-4 py-4 px-5 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-cyan-600/30 rounded-xl transition-all duration-300 cursor-pointer group"
                    >
                      {isAuthentic ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
                      )}
                      <CardContainer>
                        <p className="font-sans text-sm uppercase text-dash-text">
                          Verdict: <span className={isAuthentic ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{verdict.status}</span>
                        </p>
                        <p className="font-sans text-xs text-dash-muted mt-1">
                          {new Date(verdict.createdAt).toLocaleString()} • <span className="type-technical">Item: {verdict.evidenceId?.toString()?.substring(0, 12)}...</span>
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
