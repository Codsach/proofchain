"use client";

import { Card, CardContent, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, FileSearch, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

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

      <TabsContent value="overview" className="mt-6 space-y-6">
        <CardContainer className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full"
          >
            <Card className="border border-cyan-100 bg-[linear-gradient(135deg,rgba(6,182,212,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-cyan-600 rounded-xl hover:border-cyan-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-cyan-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-cyan-200/50 bg-cyan-600/10 w-fit">
                    PROOFCHAIN // PENDING
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">Pending Reviews</CardTitle>
                </div>
                <FileSearch className="h-4 w-4 text-cyan-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">{stats.pendingReviews}</div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-cyan-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
            <Card className="border border-sky-100 bg-[linear-gradient(135deg,rgba(14,165,233,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-sky-600 rounded-xl hover:border-sky-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-sky-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-sky-200/50 bg-sky-600/10 w-fit">
                    PROOFCHAIN // AUDITS
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">Verdicts Issued</CardTitle>
                </div>
                <CheckCircle className="h-4 w-4 text-sky-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">{stats.verdictsIssued}</div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-sky-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <motion.path 
                        d="M5,8 Q30,5 55,22 T95,15" 
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
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full"
          >
            <Card className="border border-rose-100 bg-[linear-gradient(135deg,rgba(244,63,94,0.04)_0%,rgba(255,255,255,1)_100%)] border-t-2 border-t-rose-600 rounded-xl hover:border-rose-300 ring-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-mono tracking-widest text-rose-700 font-bold uppercase select-none px-2 py-0.5 rounded border border-rose-200/50 bg-rose-600/10 w-fit">
                    PROOFCHAIN // VERDICTS
                  </div>
                  <CardTitle className="text-sm font-mono uppercase text-dash-muted mt-1">Auth / Tampered</CardTitle>
                </div>
                <ShieldAlert className="h-4 w-4 text-rose-700" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mt-2">
                  <div className="text-3xl font-bold font-mono text-dash-text">
                    <span className="text-emerald-700">{stats.authenticReviews}</span>
                    <span className="text-dash-muted text-xl mx-1">/</span>
                    <span className="text-rose-700">{stats.tamperedReviews}</span>
                  </div>
                  <div className="h-8 w-20 opacity-80">
                    <svg className="w-full h-full text-rose-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
