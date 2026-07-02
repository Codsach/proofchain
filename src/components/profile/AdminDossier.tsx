"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ServerCrash, TerminalSquare, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface AdminDossierProps {
  stats: {
    totalUsers: number;
    recentAudits: number;
  };
  recentActions: any[];
}

const STAT_VARIANTS = {
  purple: {
    circleColors: [
      "bg-pink-500",
      "bg-purple-600",
      "bg-fuchsia-500",
      "bg-violet-600",
      "bg-indigo-600",
      "bg-blue-500"
    ],
    iconBg: "bg-purple-606/15 text-purple-800 border border-purple-500/25",
  },
  blue: {
    circleColors: [
      "bg-cyan-500",
      "bg-blue-600",
      "bg-indigo-600",
      "bg-purple-600",
      "bg-teal-400",
      "bg-sky-500"
    ],
    iconBg: "bg-blue-606/15 text-blue-800 border border-blue-500/25",
  }
} as const;

export function AdminDossier({ stats, recentActions }: AdminDossierProps) {
  const cards = [
    {
      label: "Total System Users",
      value: stats.totalUsers,
      brand: "DIRECTORY",
      icon: Users,
      variantKey: "purple" as const,
      sparkline: (
        <svg className="w-16 h-8 text-purple-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path 
            d="M5,15 Q30,12 60,18 T95,10" 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      )
    },
    {
      label: "System Events (24H)",
      value: stats.recentAudits,
      brand: "MONITORS",
      icon: ServerCrash,
      variantKey: "blue" as const,
      sparkline: (
        <svg className="w-16 h-8 text-blue-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path 
            d="M5,22 Q20,10 45,20 T80,8 T95,12" 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      )
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
            const variant = STAT_VARIANTS[card.variantKey];
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="h-full flex justify-center"
              >
                <div className="relative overflow-hidden w-full h-[180px] rounded-[20px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] select-none group cursor-pointer">
                  {/* Layer 1: Solid Card Base (z-0) */}
                  <div className="absolute inset-0 bg-white/25 rounded-[20px] z-0 pointer-events-none" />

                  {/* Layer 2: Blurred liquid background circles (z-10) */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none rounded-[20px] z-10">
                    <div 
                      className="absolute -inset-16 flex flex-wrap opacity-85 transition-opacity duration-300 transform-gpu will-change-[filter]"
                      style={{ filter: "blur(130px)" }}
                    >
                      {/* Circle 1 - Top Left */}
                      <div className={`absolute top-[5%] left-[5%] w-[170px] h-[170px] rounded-full ${variant.circleColors[0]}`} />
                      {/* Circle 2 - Top Right */}
                      <div className={`absolute top-[2%] right-[10%] w-[150px] h-[150px] rounded-full ${variant.circleColors[1]}`} />
                      {/* Circle 3 - Center */}
                      <div className={`absolute top-[25%] left-[25%] w-[160px] h-[160px] rounded-full ${variant.circleColors[2]}`} />
                      {/* Circle 4 - Bottom Right */}
                      <div className={`absolute bottom-[5%] right-[5%] w-[180px] h-[180px] rounded-full ${variant.circleColors[3]}`} />
                      {/* Circle 5 - Bottom Left */}
                      <div className={`absolute bottom-[2%] left-[10%] w-[140px] h-[140px] rounded-full ${variant.circleColors[4]}`} />
                      {/* Circle 6 - Mid Right */}
                      <div className={`absolute top-[15%] right-[2%] w-[130px] h-[130px] rounded-full ${variant.circleColors[5]}`} />
                    </div>
                    {/* Subtle frosted backdrop filter cover */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                    {/* Stripes pattern overlay for premium tech look */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] mix-blend-overlay" />
                  </div>
                  
                  {/* Layer 3: Card Content (z-20) */}
                  <div className="relative z-20 flex flex-col justify-between h-full w-full p-5">
                    {/* Card Content Header */}
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-[10px] ${variant.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Card Content Value */}
                    <div className="flex flex-col mt-2">
                      <span className="text-[9px] text-slate-900 font-extrabold uppercase tracking-[0.2em] border-b border-white/10 pb-0.5 w-fit">
                        {card.brand}
                      </span>
                      <p className="text-3xl font-extrabold text-slate-955 tracking-tight mt-1 font-sans">
                        {card.value}
                      </p>
                    </div>

                    {/* Card Content Footer */}
                    <div className="flex items-end justify-between mt-auto">
                      <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">
                        {card.label}
                      </span>
                      <div className="opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                        {card.sparkline}
                      </div>
                    </div>
                  </div>
                </div>
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
