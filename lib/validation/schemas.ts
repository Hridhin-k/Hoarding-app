import { z } from "zod";
import { CLEARANCE_TYPES } from "@/lib/constants";

export const boardBasicsSchema = z.object({
  boardCode: z.string().trim().min(3, "Enter a board code.").max(40),
  name: z.string().trim().min(3, "Enter a board name."),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  structureType: z.enum([
    "hoarding",
    "unipole",
    "billboard",
    "gantry",
    "wall_wrap",
    "transit",
    "digital_led",
    "pole_kiosk",
    "other",
  ]),
  ownershipType: z.enum(["owned", "leased", "managed", "joint"]),
  lifecycleStatus: z.enum(["draft", "active", "maintenance", "blocked", "retired"]).default("draft"),
});

export const boardLocationFieldsSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().trim().optional().or(z.literal("")),
  locality: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(2, "Choose the city."),
  district: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().min(2, "Enter the state."),
  pincode: z.string().trim().optional().or(z.literal("")),
  landmark: z.string().trim().optional().or(z.literal("")),
});

export const boardLocationSchema = boardLocationFieldsSchema.superRefine((value, ctx) => {
  if (value.state.trim().toLowerCase() === "kerala" && !value.district?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a district.", path: ["district"] });
  }
});

export const faceSchema = z.object({
  id: z.string().uuid().optional(),
  faceLabel: z.string().trim().min(1, "Enter a face label."),
  direction: z.string().trim().optional().or(z.literal("")),
  width: z.coerce.number().positive("Width must be greater than 0."),
  height: z.coerce.number().positive("Height must be greater than 0."),
  unit: z.enum(["ft", "m"]).default("ft"),
  illumination: z.enum(["none", "front_lit", "back_lit", "led", "digital"]),
  visibilityNotes: z.string().trim().optional().or(z.literal("")),
  cardRate: z.coerce.number().min(0).optional().nullable(),
  floorRate: z.coerce.number().min(0).optional().nullable(),
  publishable: z.boolean().default(false),
  marketplaceVisible: z.boolean().default(false),
});

export const complianceSchema = z.object({
  clearanceType: z.enum(CLEARANCE_TYPES, { message: "Choose a clearance type." }),
  authority: z.string().trim().optional().or(z.literal("")),
  referenceNumber: z.string().trim().optional().or(z.literal("")),
  issueDate: z.string().optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  renewalCycle: z.string().trim().optional().or(z.literal("")),
  isMandatory: z.boolean().default(true),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const occupancySchema = z
  .object({
    faceId: z.string().uuid(),
    startDate: z.string().min(1, "Enter a start date."),
    endDate: z.string().min(1, "Enter an end date."),
    state: z.enum(["occupied", "on_hold", "booked_future", "blocked"]),
    source: z.enum(["manual", "campaign", "enquiry"]).default("manual"),
    customerId: z.string().uuid().optional().nullable(),
    campaignId: z.string().uuid().optional().nullable(),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export const updateOccupancySchema = z
  .object({
    id: z.string().uuid(),
    faceId: z.string().uuid(),
    startDate: z.string().min(1, "Enter a start date."),
    endDate: z.string().min(1, "Enter an end date."),
    state: z.enum(["occupied", "on_hold", "booked_future", "blocked"]),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  companyName: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  requestedStartDate: z.string().optional().or(z.literal("")),
  requestedEndDate: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")), // honeypot
});

export const fieldJobSchema = z.object({
  boardId: z.string().uuid(),
  faceId: z.string().uuid().optional().nullable(),
  jobType: z.enum(["installation", "removal", "inspection", "maintenance", "proof_capture"]),
  title: z.string().trim().min(3, "Enter a job title."),
  description: z.string().trim().optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional().nullable(),
  scheduledAt: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2),
  companyName: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  type: z.enum(["advertiser", "agency", "other"]).default("advertiser"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(2),
  customerId: z.string().uuid().optional().nullable(),
  faceIds: z.array(z.string().uuid()).optional().default([]),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
});
