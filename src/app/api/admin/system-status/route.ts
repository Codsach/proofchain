import { NextRequest, NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getSystemStatus(
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _user: JWTPayload
) {
  const start = Date.now();

  // Database check
  let dbOk = false;
  let dbLatency = 0;
  try {
    const t0 = Date.now();
    await pingDatabase();
    dbLatency = Date.now() - t0;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  // AI service check (internal FastAPI service)
  let aiOk = false;
  let aiLatency = 0;
  const aiUrl = process.env.AI_SERVICE_URL || process.env.FASTAPI_URL;
  if (aiUrl) {
    try {
      const t0 = Date.now();
      const res = await fetch(`${aiUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      aiLatency = Date.now() - t0;
      aiOk = res.ok;
    } catch {
      aiOk = false;
    }
  } else {
    // No URL configured — mark as unknown/degraded
    aiOk = false;
  }

  // Blockchain RPC check (Ethereum or similar JSON-RPC endpoint)
  let chainOk = false;
  let chainLatency = 0;
  const rpcUrl =
    process.env.POLYGON_RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    process.env.RPC_URL;
  if (rpcUrl) {
    try {
      const t0 = Date.now();
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
        signal: AbortSignal.timeout(4000),
      });
      chainLatency = Date.now() - t0;
      chainOk = res.ok;
    } catch {
      chainOk = false;
    }
  } else {
    // No RPC configured
    chainOk = false;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totalLatency: Date.now() - start,
    services: {
      database: { ok: dbOk, latencyMs: dbLatency },
      aiService: { ok: aiOk, latencyMs: aiLatency },
      blockchain: { ok: chainOk, latencyMs: chainLatency },
    },
  });
}

export const GET = withAuth(getSystemStatus, ["admin"]);
