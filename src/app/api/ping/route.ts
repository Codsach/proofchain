import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pingDatabase();

    return NextResponse.json({
      ok: true,
      service: "mongodb",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown MongoDB connectivity error";

    return NextResponse.json(
      {
        ok: false,
        service: "mongodb",
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 },
    );
  }
}
