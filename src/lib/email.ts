/**
 * email.ts — Nodemailer (Gmail SMTP) transport
 *
 * Replaces the former Resend integration.
 * Required env vars (add to .env.local):
 *   GMAIL_USER          – the Gmail address used to send  (e.g. yourapp@gmail.com)
 *   GMAIL_APP_PASSWORD  – Google App Password (16-char, no spaces)
 *                         Generate at: https://myaccount.google.com/apppasswords
 *                         (requires 2-Step Verification to be enabled on the account)
 *
 * Optional env vars (keep the same ones used before):
 *   NEXT_PUBLIC_APP_URL / APP_URL  – canonical origin for email links
 */

import nodemailer, { type Transporter } from "nodemailer";
import User from "@/lib/models/User";

// ---------------------------------------------------------------------------
// Error class (same public API as before so callers need no changes)
// ---------------------------------------------------------------------------
export class EmailDeliveryError extends Error {
  code?: string;
  statusCode?: number;

  constructor(
    message: string,
    options?: { code?: string; statusCode?: number }
  ) {
    super(message);
    this.name = "EmailDeliveryError";
    this.code = options?.code;
    this.statusCode = options?.statusCode;
  }
}

// ---------------------------------------------------------------------------
// Nodemailer transporter (lazy singleton)
// ---------------------------------------------------------------------------
let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new EmailDeliveryError(
      "Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local."
    );
  }

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return _transporter;
}

function getDefaultFrom(): string {
  const user = process.env.GMAIL_USER ?? "noreply@gmail.com";
  const name = process.env.EMAIL_FROM_NAME ?? "ProofChain";
  return `"${name}" <${user}>`;
}

// ---------------------------------------------------------------------------
// Core send function (same signature / return semantics as the old Resend one)
// ---------------------------------------------------------------------------
type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailParams) {
  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: from ?? getDefaultFrom(),
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
      replyTo: replyTo
        ? Array.isArray(replyTo)
          ? replyTo.join(", ")
          : replyTo
        : undefined,
    });

    return { id: info.messageId };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Unknown SMTP error";

    // Surface actionable hints for common Gmail SMTP failures
    let hint = msg;
    if (msg.includes("Invalid login") || msg.includes("Username and Password not accepted")) {
      hint =
        "Gmail rejected the credentials. Make sure GMAIL_APP_PASSWORD is a valid App Password " +
        "(generated at myaccount.google.com/apppasswords) and that 2FA is enabled on the account.";
    } else if (msg.includes("5.7.0") || msg.includes("less secure")) {
      hint =
        "Gmail blocked the sign-in. Use an App Password instead of your regular Gmail password.";
    }

    throw new EmailDeliveryError(hint, { statusCode: 502 });
  }
}

// ---------------------------------------------------------------------------
// URL helpers (unchanged from old implementation)
// ---------------------------------------------------------------------------
export function getAppBaseUrl(request?: Request) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (configuredBaseUrl && !configuredBaseUrl.includes("localhost")) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (request) {
    const urlObj = new URL(request.url);
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      urlObj.host;

    if (
      host &&
      (host.includes("vercel.app") || host.includes("proofchain-web"))
    ) {
      return "https://proofchain-web.vercel.app";
    }
  }

  return "https://proofchain-web.vercel.app";
}

export function buildAppUrl(
  pathname: string,
  request?: Request,
  searchParams?: Record<string, string | undefined>
) {
  const url = new URL(pathname, getAppBaseUrl(request));

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

// ---------------------------------------------------------------------------
// Domain-specific email helpers (same signatures as before)
// ---------------------------------------------------------------------------
export async function notifyInvestigator(
  investigatorId: string,
  caseId: string,
  caseTitle: string,
  verdict: string,
  reason: string
) {
  const investigator = await User.findById(investigatorId).select(
    "email fullName"
  );
  if (!investigator) return;

  const appUrl = getAppBaseUrl();
  const statusColor = verdict === "verified" ? "#00C9A7" : "#FF6B6B";
  const statusLabel = verdict === "verified" ? "VERIFIED" : "REJECTED";

  await sendEmail({
    to: investigator.email,
    subject: `Case ${statusLabel}: ${caseTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1B2A;color:#E8E8F0;padding:32px;border-radius:8px;">
        <h2 style="color:#00C9A7;margin-top:0;">ProofChain</h2>
        <p>Hi ${investigator.fullName},</p>
        <p>A verdict has been issued on your case:</p>
        <div style="background:#1C1C28;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Case</p>
          <p style="margin:0 0 16px;font-weight:bold;">${caseTitle}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Verdict</p>
          <p style="margin:0 0 16px;font-weight:bold;color:${statusColor};">${statusLabel}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Reason</p>
          <p style="margin:0;color:#E8E8F0;">${reason}</p>
        </div>
        <a href="${appUrl}/investigator/cases/${caseId}"
           style="display:inline-block;background:#00C9A7;color:#000;padding:10px 20px;
                  text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
          View Case
        </a>
        <p style="font-size:11px;color:#555570;margin-top:24px;">
          ProofChain · Digital Forensic Evidence Platform
        </p>
      </div>
    `,
  });
}

export async function notifyAnalyst(
  analystId: string,
  caseIds: string[],
  actionType: "transfer" | "bulk_assign"
) {
  const analyst = await User.findById(analystId).select("email fullName");
  if (!analyst) return;

  const appUrl = getAppBaseUrl();
  const caseCount = caseIds.length;
  const isMultiple = caseCount > 1;

  const titleText = isMultiple
    ? `You have been assigned ${caseCount} new cases`
    : `A new case has been assigned to you`;
  const subjectText = isMultiple
    ? `New Assignment: ${caseCount} Cases`
    : `New Case Assignment: ${caseIds[0].substring(0, 8)}`;

  await sendEmail({
    to: analyst.email,
    subject: subjectText,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1B2A;color:#E8E8F0;padding:32px;border-radius:8px;">
        <h2 style="color:#00C9A7;margin-top:0;">ProofChain</h2>
        <p>Hi ${analyst.fullName},</p>
        <p>${titleText}.</p>
        <div style="background:#1C1C28;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Action Type</p>
          <p style="margin:0 0 16px;font-weight:bold;text-transform:capitalize;">${actionType.replace("_", " ")}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Case ${isMultiple ? "IDs" : "ID"}</p>
          <ul style="margin:0;padding-left:16px;color:#00C9A7;font-family:monospace;">
            ${caseIds.map((id) => `<li>${id.substring(0, 16)}...</li>`).join("")}
          </ul>
        </div>
        <a href="${appUrl}/analyst"
           style="display:inline-block;background:#3B82F6;color:#FFF;padding:10px 20px;
                  text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
          View My Queue
        </a>
        <p style="font-size:11px;color:#555570;margin-top:24px;">
          ProofChain · Digital Forensic Evidence Platform
        </p>
      </div>
    `,
  });
}

export async function notifyPasswordChange(email: string, fullName: string) {
  const appUrl = getAppBaseUrl();

  await sendEmail({
    to: email,
    subject: "ProofChain: Security Alert - Password Changed",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1B2A;color:#E8E8F0;padding:32px;border-radius:8px;">
        <h2 style="color:#00C9A7;margin-top:0;">ProofChain Security</h2>
        <p>Hi ${fullName},</p>
        <p>The password for your ProofChain account has just been changed.</p>
        <div style="background:#1C1C28;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0;color:#E8E8F0;">If you made this change, no further action is required.</p>
        </div>
        <p>If you did not authorize this change, please contact an administrator immediately.</p>
        <a href="${appUrl}/login"
           style="display:inline-block;background:#FF6B6B;color:#FFF;padding:10px 20px;
                  text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
          Secure Account
        </a>
        <p style="font-size:11px;color:#555570;margin-top:24px;">
          ProofChain · Digital Forensic Evidence Platform
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetUrl: string
) {
  await sendEmail({
    to: email,
    subject: "Reset your ProofChain password",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1B2A;color:#E8E8F0;padding:32px;border-radius:8px;">
        <h2 style="color:#00C9A7;margin-top:0;">ProofChain Security</h2>
        <p>Hi ${fullName},</p>
        <p>You requested a password reset for your ProofChain account.</p>
        <p>Click the button below to choose a new password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#00C9A7;color:#000;padding:10px 20px;
                  text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
          Reset Password
        </a>
        <p style="word-break: break-all; color: #8888AA; font-size: 12px; margin-top: 16px;">
          If the button does not work, copy and paste this link into your browser:<br />
          <a href="${resetUrl}" style="color:#00C9A7;">${resetUrl}</a>
        </p>
        <p style="font-size:11px;color:#555570;margin-top:24px;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
