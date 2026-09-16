import { cn } from "@/lib/utils";
import {
  COMPLIANCE_LABELS,
  LIFECYCLE_LABELS,
  OCCUPANCY_DIMENSION_LABELS,
  type BoardLifecycle,
  type ComplianceStatus,
  type OccupancyDimension,
  type OccupancyState,
} from "@/lib/types/enums";

const tone = {
  muted: "border-border bg-muted text-muted-foreground",
  info: "border-primary/20 bg-accent text-accent-foreground",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  idle: "border-border bg-card text-foreground",
} as const;

const lifecycleTone: Record<BoardLifecycle, keyof typeof tone> = {
  draft: "muted",
  active: "success",
  maintenance: "warning",
  blocked: "danger",
  retired: "muted",
};

const complianceTone: Record<ComplianceStatus, keyof typeof tone> = {
  valid: "success",
  expiring: "warning",
  expired: "danger",
  missing: "muted",
};

const occupancyTone: Record<OccupancyDimension, keyof typeof tone> = {
  vacant: "success",
  occupied: "idle",
  on_hold: "warning",
  booked_future: "info",
  becoming_vacant: "warning",
  blocked: "danger",
};

function Chip({
  group,
  label,
  className,
}: {
  group: string;
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] leading-none whitespace-normal",
        className,
      )}
    >
      <span className="font-medium text-muted-foreground">{group}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

export function LifecycleBadge({ value, labeled = false }: { value: BoardLifecycle; labeled?: boolean }) {
  const className = tone[lifecycleTone[value]];
  if (!labeled) {
    return (
      <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none", className)}>
        {LIFECYCLE_LABELS[value]}
      </span>
    );
  }
  return <Chip group="Lifecycle" label={LIFECYCLE_LABELS[value]} className={className} />;
}

export function ComplianceBadge({ value, labeled = false }: { value: ComplianceStatus; labeled?: boolean }) {
  const className = tone[complianceTone[value]];
  if (!labeled) {
    return (
      <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none", className)}>
        {COMPLIANCE_LABELS[value]}
      </span>
    );
  }
  return <Chip group="Compliance" label={COMPLIANCE_LABELS[value]} className={className} />;
}

export function OccupancyBadge({ value, labeled = false }: { value: OccupancyDimension; labeled?: boolean }) {
  const className = tone[occupancyTone[value]];
  if (!labeled) {
    return (
      <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none", className)}>
        {OCCUPANCY_DIMENSION_LABELS[value]}
      </span>
    );
  }
  return <Chip group="Occupancy" label={OCCUPANCY_DIMENSION_LABELS[value]} className={className} />;
}

const occupancyStateTone: Record<OccupancyState, OccupancyDimension> = {
  occupied: "occupied",
  on_hold: "on_hold",
  booked_future: "booked_future",
  blocked: "blocked",
};

export function OccupancyStateBadge({ value }: { value: OccupancyState }) {
  return <OccupancyBadge value={occupancyStateTone[value]} />;
}

export function StatusCluster({
  lifecycle,
  compliance,
  occupancy,
}: {
  lifecycle?: BoardLifecycle;
  compliance?: ComplianceStatus;
  occupancy?: OccupancyDimension | string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lifecycle ? <LifecycleBadge value={lifecycle} labeled /> : null}
      {compliance ? <ComplianceBadge value={compliance} labeled /> : null}
      {occupancy ? (
        typeof occupancy === "string" && !(occupancy in occupancyTone) ? (
          <Chip group="Occupancy" label={occupancy} className={tone.idle} />
        ) : (
          <OccupancyBadge value={occupancy as OccupancyDimension} labeled />
        )
      ) : null}
    </div>
  );
}
