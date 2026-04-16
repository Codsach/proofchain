import { z } from "zod";

export const LOGIN_ROLE_VALUES = ["investigator", "analyst", "admin"] as const;

export type LoginRole = (typeof LOGIN_ROLE_VALUES)[number];

export const RegisterSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
