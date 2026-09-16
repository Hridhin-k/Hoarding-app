export const APP_NAME = "HOARDINGS360";
export const APP_SHORT_NAME = "H360";
export const TENANT_COOKIE = "h360_tenant";
export const PLATFORM_INSPECT_COOKIE = "h360_platform_inspect";
export const PLATFORM_INSPECT_MINUTES = 30;
export const VACANCY_PRELISTING_DAYS_DEFAULT = 30;
export const COMPLIANCE_ALERT_WINDOWS = [90, 60, 30, 15, 7] as const;
export const CLEARANCE_TYPES = [
  "municipal",
  "traffic",
  "structural",
  "electrical",
  "landowner",
  "highway",
  "fire",
  "other",
] as const;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const ENQUIRY_RATE_LIMIT_PER_HOUR = 5;
