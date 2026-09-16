import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Enter the organization name."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
});

export const inviteSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(["ADMIN", "OPS_MANAGER", "SALES", "COMPLIANCE", "TECHNICIAN"]),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
