import { differenceInCalendarDays, isAfter, isBefore, isEqual, parseISO, startOfDay } from "date-fns";
import type { ComplianceStatus } from "@/lib/types/enums";
import { COMPLIANCE_ALERT_WINDOWS } from "@/lib/constants";

export function computeComplianceStatus(
  expiryDate: Date | string | null | undefined,
  asOf: Date = new Date(),
): ComplianceStatus {
  if (!expiryDate) return "missing";
  const expiry = startOfDay(typeof expiryDate === "string" ? parseISO(expiryDate) : expiryDate);
  const today = startOfDay(asOf);
  if (isBefore(expiry, today)) return "expired";
  const days = differenceInCalendarDays(expiry, today);
  if (days <= 90) return "expiring";
  return "valid";
}

export function complianceAlertWindow(
  expiryDate: Date | string | null | undefined,
  asOf: Date = new Date(),
): (typeof COMPLIANCE_ALERT_WINDOWS)[number] | "expired" | null {
  if (!expiryDate) return null;
  const expiry = startOfDay(typeof expiryDate === "string" ? parseISO(expiryDate) : expiryDate);
  const today = startOfDay(asOf);
  if (isBefore(expiry, today)) return "expired";
  const days = differenceInCalendarDays(expiry, today);
  if ((COMPLIANCE_ALERT_WINDOWS as readonly number[]).includes(days)) {
    return days as (typeof COMPLIANCE_ALERT_WINDOWS)[number];
  }
  return null;
}

export function rollupBoardCompliance(
  records: Array<{ is_mandatory: boolean; status: ComplianceStatus }>,
): ComplianceStatus {
  const mandatory = records.filter((r) => r.is_mandatory);
  if (mandatory.length === 0) return "missing";
  if (mandatory.some((r) => r.status === "expired")) return "expired";
  if (mandatory.some((r) => r.status === "missing")) return "missing";
  if (mandatory.some((r) => r.status === "expiring")) return "expiring";
  return "valid";
}

export function marketplaceBlockedByCompliance(status: ComplianceStatus): boolean {
  return status === "expired" || status === "missing";
}

export function isSameOrBefore(a: Date, b: Date) {
  return isBefore(a, b) || isEqual(a, b);
}

export function isSameOrAfter(a: Date, b: Date) {
  return isAfter(a, b) || isEqual(a, b);
}
