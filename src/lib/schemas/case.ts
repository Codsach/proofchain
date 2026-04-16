import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "video/mp4",
  "text/plain",         // .log files
  "application/octet-stream", // .pcap and other binary
] as const;

export const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".pdf", ".mp4", ".log", ".pcap",
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_FILES_PER_CASE = 3;

export const CreateCaseSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title is too long"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description is too long"),
  incidentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid incident date",
  }),
  incidentType: z.enum([
    "data_breach",
    "insider_threat",
    "malware",
    "phishing",
    "other",
  ]),
  gpsLat: z.number().min(-90).max(90).optional().nullable(),
  gpsLng: z.number().min(-180).max(180).optional().nullable(),
});

export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;

export const VerdictSchema = z.object({
  verdict: z.enum(["verified", "rejected"]),
  reason: z
    .string()
    .min(20, "Reason must be at least 20 characters")
    .max(2000, "Reason is too long"),
});

export type VerdictInput = z.infer<typeof VerdictSchema>;

export const TransferSchema = z.object({
  toUserId: z.string().min(1, "Recipient is required"),
  reason: z
    .string()
    .min(20, "Reason must be at least 20 characters")
    .max(1000, "Reason is too long"),
  notes: z.string().max(1000).optional().nullable(),
});

export type TransferInput = z.infer<typeof TransferSchema>;