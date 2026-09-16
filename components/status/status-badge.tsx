import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  COMPLIANCE_LABELS,
  LIFECYCLE_LABELS,
  OCCUPANCY_DIMENSION_LABELS,
  OCCUPANCY_STATE_LABELS,
  type BoardLifecycle,
  type ComplianceStatus,
  type OccupancyDimension,
  type OccupancyState,
} from "@/lib/types/enums";

const lifecycleClass: Record<BoardLifecycle, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  active: "border-border bg-accent text-accent-foreground",
  maintenance: "border-border bg-muted text-foreground",
  blocked: "border-destructive/30 bg-destructive/10 text-destructive",
  retired: "border-border bg-muted text-muted-foreground",
};

const complianceClass: Record<ComplianceStatus, string> = {
  valid: "border-border bg-accent text-accent-foreground",
  expiring: "border-border bg-muted text-foreground",
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
  missing: "border-border bg-muted text-muted-foreground",
};

const occupancyClass: Record<OccupancyDimension, string> = {
  vacant: "border-border bg-accent text-accent-foreground",
  occupied: "border-border bg-muted text-foreground",
  on_hold: "border-border bg-muted text-muted-foreground",
  booked_future: "border-border bg-accent text-accent-foreground",
  becoming_vacant: "border-border bg-muted text-foreground",
  blocked: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function LifecycleBadge({ value }: { value: BoardLifecycle }) {
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium", lifecycleClass[value])}>
      {LIFECYCLE_LABELS[value]}
    </Badge>
  );
}

export function ComplianceBadge({ value }: { value: ComplianceStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium", complianceClass[value])}>
      {COMPLIANCE_LABELS[value]}
    </Badge>
  );
}

export function OccupancyBadge({ value }: { value: OccupancyDimension }) {
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium", occupancyClass[value])}>
      {OCCUPANCY_DIMENSION_LABELS[value]}
    </Badge>
  );
}

const occupancyStateClass: Record<OccupancyState, string> = {
  occupied: occupancyClass.occupied,
  on_hold: occupancyClass.on_hold,
  booked_future: occupancyClass.booked_future,
  blocked: occupancyClass.blocked,
};

export function OccupancyStateBadge({ value }: { value: OccupancyState }) {
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium", occupancyStateClass[value])}>
      {OCCUPANCY_STATE_LABELS[value]}
    </Badge>
  );
}
