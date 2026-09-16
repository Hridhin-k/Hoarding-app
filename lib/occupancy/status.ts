import { addDays, parseISO, startOfDay } from "date-fns";
import { VACANCY_PRELISTING_DAYS_DEFAULT } from "@/lib/constants";
import type { OccupancyDimension, OccupancyState } from "@/lib/types/enums";
import { isSameOrAfter, isSameOrBefore } from "@/lib/compliance/status";

export type OccupancyPeriodInput = {
  id?: string;
  start_date: string | Date;
  end_date: string | Date;
  state: OccupancyState;
};

const BLOCKING_STATES: OccupancyState[] = ["occupied", "on_hold", "booked_future", "blocked"];
const RESERVATION_STATES: OccupancyState[] = ["occupied", "booked_future"];

export function statesConflict(a: OccupancyState, b: OccupancyState): boolean {
  if (RESERVATION_STATES.includes(a) && RESERVATION_STATES.includes(b)) return true;
  return BLOCKING_STATES.includes(a) && BLOCKING_STATES.includes(b);
}

function toDate(value: string | Date) {
  return startOfDay(typeof value === "string" ? parseISO(value) : value);
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return isSameOrBefore(aStart, bEnd) && isSameOrAfter(aEnd, bStart);
}

export function occupancyConflicts(
  candidate: OccupancyPeriodInput,
  existing: OccupancyPeriodInput[],
): OccupancyPeriodInput[] {
  if (!BLOCKING_STATES.includes(candidate.state)) return [];
  const start = toDate(candidate.start_date);
  const end = toDate(candidate.end_date);
  return existing.filter((period) => {
    if (candidate.id && period.id === candidate.id) return false;
    if (!BLOCKING_STATES.includes(period.state)) return false;
    if (!statesConflict(candidate.state, period.state)) return false;
    return rangesOverlap(start, end, toDate(period.start_date), toDate(period.end_date));
  });
}

export function occupancyConflictMessage(
  candidate: OccupancyState,
  conflicts: OccupancyPeriodInput[],
): string {
  if (!conflicts.length) return "";
  const reservationHit = conflicts.some(
    (p) => RESERVATION_STATES.includes(candidate) && RESERVATION_STATES.includes(p.state),
  );
  if (reservationHit || RESERVATION_STATES.includes(candidate)) {
    return "This face already has an occupied or reserved period during these dates.";
  }
  return "This face already has a blocking period during these dates.";
}

export function faceOccupancyDimension(
  periods: OccupancyPeriodInput[],
  asOf: Date = new Date(),
  prelistingDays = VACANCY_PRELISTING_DAYS_DEFAULT,
): OccupancyDimension {
  const today = startOfDay(asOf);
  const covering = periods
    .filter((p) => BLOCKING_STATES.includes(p.state))
    .filter((p) => isSameOrBefore(toDate(p.start_date), today) && isSameOrAfter(toDate(p.end_date), today))
    .sort((a, b) => priority(a.state) - priority(b.state));

  const current = covering[0];
  if (current) {
    if (current.state === "blocked") return "blocked";
    if (current.state === "on_hold") return "on_hold";
    if (current.state === "occupied" || current.state === "booked_future") {
      const windowEnd = addDays(today, prelistingDays);
      if (isSameOrBefore(toDate(current.end_date), windowEnd)) {
        const hasFollowOn = periods.some(
          (p) =>
            p.id !== current.id &&
            (p.state === "occupied" || p.state === "booked_future") &&
            isSameOrBefore(toDate(p.start_date), addDays(toDate(current.end_date), 1)) &&
            toDate(p.end_date) > toDate(current.end_date),
        );
        if (!hasFollowOn) return "becoming_vacant";
      }
      return "occupied";
    }
  }

  const future = periods
    .filter((p) => p.state === "occupied" || p.state === "booked_future")
    .filter((p) => toDate(p.start_date) > today)
    .sort((a, b) => toDate(a.start_date).getTime() - toDate(b.start_date).getTime())[0];

  if (future) return "booked_future";
  return "vacant";
}

function priority(state: OccupancyState) {
  switch (state) {
    case "blocked":
      return 1;
    case "occupied":
      return 2;
    case "on_hold":
      return 3;
    case "booked_future":
      return 4;
    default:
      return 9;
  }
}

export function availableFromDate(
  periods: OccupancyPeriodInput[],
  asOf: Date = new Date(),
): Date {
  const today = startOfDay(asOf);
  const ends = periods
    .filter((p) => p.state === "occupied" || p.state === "booked_future")
    .map((p) => toDate(p.end_date))
    .filter((d) => isSameOrAfter(d, today));
  if (ends.length === 0) return today;
  const last = ends.reduce((a, b) => (a > b ? a : b));
  return addDays(last, 1);
}

export function vacancyMessage(faceLabel: string, vacantOn: Date) {
  const formatted = vacantOn.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${faceLabel} becomes vacant on ${formatted}.`;
}
