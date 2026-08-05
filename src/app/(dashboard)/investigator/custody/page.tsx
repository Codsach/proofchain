"use client";

import { CustodyInspector } from "@/components/CustodyInspector";
import { motion } from "framer-motion";

export default function InvestigatorCustodyPage() {
  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="type-eyebrow">Cryptographic Integrity Audit</p>
        </div>
        <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">
          Custody Chain
        </h1>
        <p className="text-dash-muted mt-2 font-medium">
          Verify and audit chronological evidence custody logs for your submitted case subjects.
        </p>
      </motion.div>

      <CustodyInspector />
    </div>
  );
}
