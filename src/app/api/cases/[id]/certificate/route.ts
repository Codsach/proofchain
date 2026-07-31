import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import Verdict from "@/lib/models/Verdict";
import User from "@/lib/models/User";
import { verifyAccessToken, getIp } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { getAppBaseUrl } from "@/lib/email";
import ForensicCertificate from "@/lib/pdf/ForensicCertificate";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: caseId } = await ctx.params;

    // 1. Get Token from Header or Query String (since simple links don't pass headers)
    let token = "";
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token") || "";
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization credentials" },
        { status: 401 }
      );
    }

    // 2. Verify Access Token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: "Token expired or invalid" },
        { status: 401 }
      );
    }

    // 3. Re-validate User status and permissions from DB
    const dbUser = await User.findById(payload.userId).select(
      "role isActive isVerified"
    );
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (!dbUser.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 }
      );
    }

    if (!dbUser.isVerified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    // 4. Fetch Case Document
    const caseDoc = await Case.findOne({ caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 5. Restrict investigator access to their own cases
    if (dbUser.role === "investigator" && caseDoc.investigatorId.toString() !== dbUser.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 6. Only verified cases have certificates
    if (caseDoc.status !== "verified") {
      return NextResponse.json(
        { error: "Forensic Certificate is only available for verified cases" },
        { status: 400 }
      );
    }

    // 7. Fetch AI reports and Verdict
    const aiReports = await AiReport.find({ caseId }).lean();
    const verdictDoc = await Verdict.findOne({ caseId }).lean();

    // 8. Generate QR Code containing public verify URL
    const verifyUrl = `${getAppBaseUrl(req)}/verify/${caseId}`;
    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        color: {
          dark: "#00C9A7",
          light: "#0D1B2A",
        },
        margin: 1,
        width: 150,
      });
    } catch (qrErr) {
      console.error("[certificate/get] Failed to generate QR Code:", qrErr);
    }

    // Read logo file and convert to base64 Data URL
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    let logoDataUrl: string | null = null;
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (logoErr) {
      console.error("[certificate/get] Failed to read logo.png:", logoErr);
    }

    // 9. Render PDF Document to Buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(ForensicCertificate, {
        caseData: caseDoc as any,
        verdict: verdictDoc as any,
        aiReports: aiReports as any,
        qrCodeDataUrl,
        verifyUrl,
        logoDataUrl,
      }) as any
    );

    // 10. Audit Log Action
    await logAction({
      actorId: dbUser.id,
      actorRole: dbUser.role,
      actionType: "case.export_pdf",
      targetType: "case",
      targetId: caseId,
      ipAddress: getIp(req),
      metadata: { caseId },
    });

    // 11. Return Application/PDF stream
    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proofchain-cert-${caseId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[certificate/get] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
