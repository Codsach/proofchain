"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Briefcase, Activity, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";

interface InvestigatorDossierProps {
  stats: {
    evidenceSubmitted: number;
    activeCases: number;
  };
  recentSubmissions: any[];
}



export function InvestigatorDossier({ stats, recentSubmissions }: InvestigatorDossierProps) {
  const cards = [
    {
      label: "Evidence Submitted",
      value: stats.evidenceSubmitted,
      description: "Blockchain verified files",
      icon: FileText,
      variantKey: "green" as const,
      metaText: "Verified",
    },
    {
      label: "Active Cases",
      value: stats.activeCases,
      description: "Assigned active case list",
      icon: Briefcase,
      variantKey: "blue" as const,
      metaText: "Active",
    }
  ];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="bg-dash-input/50 border border-dash-border p-0.5 inline-flex w-fit rounded-lg gap-1">
        <TabsTrigger 
          value="overview" 
          className="font-sans uppercase text-[10px] tracking-wider rounded-md text-dash-muted transition-all px-4 py-1.5 data-[state=active]:bg-dash-card data-[state=active]:text-emerald-600 data-[state=active]:shadow-2xs font-bold"
        >
          Mission Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-sans uppercase text-[10px] tracking-wider rounded-md text-dash-muted transition-all px-4 py-1.5 data-[state=active]:bg-dash-card data-[state=active]:text-emerald-600 data-[state=active]:shadow-2xs font-bold"
        >
          Custody Log
        </TabsTrigger>
      </TabsList>
 
      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
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
              <Activity className="h-4 w-4 text-emerald-600" />
              Recent Field Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentSubmissions.length === 0 ? (
              <CardContainer className="text-center py-6 text-[11px] text-dash-muted/60 font-sans uppercase tracking-wider">
                No recent activity logged
              </CardContainer>
            ) : (
              <CardContainer className="space-y-[12px]">
                {recentSubmissions.map((sub, i) => (
                  <CardContainer 
                    key={i} 
                    className="flex items-start gap-4 py-4 px-5 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-emerald-600/30 rounded-xl transition-all duration-300 cursor-pointer group"
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <CardContainer>
                      <p className="font-sans text-sm truncate text-dash-text group-hover:text-emerald-600 transition-colors">
                        {sub.title || "Unknown Evidence"}
                      </p>
                      <p className="font-sans text-xs text-dash-muted mt-1">
                        {new Date(sub.createdAt).toLocaleString()} • <span className="type-technical">Hash: {sub.fileHash?.substring(0, 16)}...</span>
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
