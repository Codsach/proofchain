import { Resend, type ErrorResponse } from "resend";

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
