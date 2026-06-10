import { Resend, type ErrorResponse } from "resend";
import User from "@/lib/models/User";

const DEFAULT_FROM_ADDRESS = "ProofChain <onboarding@resend.dev>";

export class EmailDeliveryError extends Error {
  code?: ErrorResponse["name"];
  statusCode?: number;

  constructor(
    message: string,
    options?: {
      code?: ErrorResponse["name"];
      statusCode?: number;
    }
  ) {
    super(message);
    this.name = "EmailDeliveryError";
    this.code = options?.code;
    this.statusCode = options?.statusCode;
  }
}

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new EmailDeliveryError(
      "RESEND_API_KEY is not configured. Verification emails cannot be sent."
    );
  }

  return new Resend(apiKey);
}

function getDefaultFromAddress() {
  const configuredFrom =
    process.env.RESEND_FROM ?? process.env.RESEND_FROM_EMAIL;

  if (!configuredFrom) {
    return DEFAULT_FROM_ADDRESS;
  }

  if (configuredFrom.includes("<")) {
    return configuredFrom;
  }

  const fromName = process.env.RESEND_FROM_NAME ?? "ProofChain";
  return `${fromName} <${configuredFrom}>`;
}

function getEmailErrorMessage(error: ErrorResponse) {
  switch (error.name) {
    case "invalid_from_address":
      return "Email delivery is not configured correctly. Set RESEND_FROM to a verified sender or use ProofChain <onboarding@resend.dev> while testing.";
    case "missing_api_key":
    case "invalid_api_key":
    case "restricted_api_key":
      return "Email delivery is not configured correctly. Check RESEND_API_KEY.";
    default:
      return error.message;
  }
}

export function getAppBaseUrl(request?: Request) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
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

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailParams) {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: from ?? getDefaultFromAddress(),
    to,
    subject,
    html,
    text,
    replyTo,
  });

  if (error) {
    throw new EmailDeliveryError(getEmailErrorMessage(error), {
      code: error.name,
      statusCode: error.statusCode ?? undefined,
    });
  }

  if (!data) {
    throw new EmailDeliveryError(
      "Email provider did not return a delivery id for this message."
    );
  }

  return data;
}

export async function notifyInvestigator(
  investigatorId: string,
  caseId: string,
  caseTitle: string,
  verdict: string,
  reason: string
) {
  const investigator = await User.findById(investigatorId).select("email fullName");
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

  const titleText = isMultiple ? `You have been assigned ${caseCount} new cases` : `A new case has been assigned to you`;
  const subjectText = isMultiple ? `New Assignment: ${caseCount} Cases` : `New Case Assignment: ${caseIds[0].substring(0, 8)}`;

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
          <p style="margin:0 0 16px;font-weight:bold;text-transform:capitalize;">${actionType.replace('_', ' ')}</p>
          
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Case ${isMultiple ? 'IDs' : 'ID'}</p>
          <ul style="margin:0;padding-left:16px;color:#00C9A7;font-family:monospace;">
            ${caseIds.map(id => `<li>${id.substring(0, 16)}...</li>`).join('')}
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
