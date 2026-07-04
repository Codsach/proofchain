"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ServerCrash, TerminalSquare, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";

interface AdminDossierProps {
  stats: {
    totalUsers: number;
    recentAudits: number;
  };
  recentActions: any[];
}



export function AdminDossier({ stats, recentActions }: AdminDossierProps) {
  const cards = [
    {
      label: "Total System Users",
      value: stats.totalUsers,
      description: "Registered system accounts",
      icon: Users,
      variantKey: "purple" as const,
      metaText: "Synced",
    },
    {
      label: "System Events (24H)",
      value: stats.recentAudits,
      description: "System actions logged",
      icon: ServerCrash,
      variantKey: "blue" as const,
      metaText: "Live",
    }
  ];

  return (
    <Tabs defaultValue="overview" className="w-full mt-10">
      <TabsList className="bg-dash-card border border-dash-border p-1 grid w-full grid-cols-2 md:w-[400px] rounded-xl">
        <TabsTrigger 
          value="overview" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-purple-700"
        >
          System Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-purple-700"
        >
          Audit Log
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
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-dash-muted flex items-center gap-2">
              <TerminalSquare className="h-4 w-4 text-purple-700" />
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
                    className="flex items-start gap-4 py-4 px-5 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-purple-600/30 rounded-xl transition-all duration-300 cursor-pointer group"
                  >
                    <Shield className="h-5 w-5 text-purple-700 mt-0.5" />
                    <CardContainer>
                      <p className="font-mono text-sm uppercase text-dash-text group-hover:text-purple-700 transition-colors">{action.action}</p>
                      <p className="font-mono text-xs text-dash-muted mt-1">
                        {new Date(action.createdAt).toLocaleString()} • Target: <span className="text-dash-muted">{action.targetId?.toString()?.substring(0, 12) || "SYSTEM"}</span>
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
