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

export function AdminDossier({ stats, recentActions }: AdminDossierProps) {
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
        <CardContainer className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full"
          >
            <Card className="border border-purple-100 bg-[linear-gradient(135deg,rgba(147,51,234,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-purple-600 rounded-xl hover:border-purple-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-purple-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-purple-200/50 bg-purple-600/10 w-fit">
                    PROOFCHAIN // DIRECTORY
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">Total System Users</CardTitle>
                </div>
                <Users className="h-4 w-4 text-purple-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">{stats.totalUsers}</div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-purple-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <motion.path 
                        d="M5,15 Q30,12 60,18 T95,10" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full"
          >
            <Card className="border border-indigo-100 bg-[linear-gradient(135deg,rgba(79,70,229,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-indigo-600 rounded-xl hover:border-indigo-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-indigo-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-indigo-200/50 bg-indigo-600/10 w-fit">
                    PROOFCHAIN // MONITORS
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">System Events (24H)</CardTitle>
                </div>
                <ServerCrash className="h-4 w-4 text-indigo-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">{stats.recentAudits}</div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <motion.path 
                        d="M5,22 Q20,10 45,20 T80,8 T95,12" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </CardContainer>
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
