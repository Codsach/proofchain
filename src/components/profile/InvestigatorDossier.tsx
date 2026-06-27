"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Briefcase, Activity, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

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
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-emerald-700"
        >
          Mission Overview
        </TabsTrigger>
        <TabsTrigger 
          value="log" 
          className="font-mono uppercase text-xs rounded-lg text-dash-muted transition-all data-[state=active]:bg-dash-hover data-[state=active]:text-emerald-700"
        >
          Custody Log
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
            <Card className="border border-emerald-100 bg-[linear-gradient(135deg,rgba(16,185,129,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-emerald-600 rounded-xl hover:border-emerald-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-emerald-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-emerald-200/50 bg-emerald-600/10 w-fit">
                    PROOFCHAIN // EVIDENCE
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">Evidence Submitted</CardTitle>
                </div>
                <FileText className="h-4 w-4 text-emerald-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">{stats.evidenceSubmitted}</div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full"
          >
            <Card className="border border-teal-100 bg-[linear-gradient(135deg,rgba(13,148,136,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-teal-600 rounded-xl hover:border-teal-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-teal-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-teal-200/50 bg-teal-600/10 w-fit">
                    PROOFCHAIN // CUSTODY
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">Active Cases</CardTitle>
                </div>
                <Briefcase className="h-4 w-4 text-teal-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">{stats.activeCases}</div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-teal-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        </CardContainer>
      </TabsContent>

      <TabsContent value="log" className="mt-6">
        <Card className="bg-dash-card border border-dash-border ring-0 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-dash-muted flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-700" />
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
                    className="flex items-start gap-4 py-4 px-5 border border-dash-border bg-dash-hover/20 hover:bg-dash-hover/50 hover:border-emerald-600/30 rounded-xl transition-all duration-300 cursor-pointer group"
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-700 mt-0.5" />
                    <CardContainer>
                      <p className="font-mono text-sm truncate text-dash-text group-hover:text-emerald-700 transition-colors">
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
