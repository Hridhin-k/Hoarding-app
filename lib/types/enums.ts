export type BoardLifecycle = "draft" | "active" | "maintenance" | "blocked" | "retired";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type StructureType =
  | "hoarding"
  | "unipole"
  | "billboard"
  | "gantry"
  | "wall_wrap"
  | "transit"
  | "digital_led"
  | "pole_kiosk"
  | "other";
export type OwnershipType = "owned" | "leased" | "managed" | "joint";
export type IlluminationType = "none" | "front_lit" | "back_lit" | "led" | "digital";
export type DimensionUnit = "ft" | "m";
export type ComplianceStatus = "valid" | "expiring" | "expired" | "missing";
export type ClearanceType =
  | "municipal"
  | "traffic"
  | "structural"
  | "electrical"
  | "landowner"
  | "highway"
  | "fire"
  | "other";
export type OccupancyState = "occupied" | "on_hold" | "booked_future" | "blocked";
export type OccupancyDimension =
  | "vacant"
  | "occupied"
  | "on_hold"
  | "booked_future"
  | "becoming_vacant"
  | "blocked";
export type OccupancySource = "manual" | "campaign" | "enquiry";
export type CustomerType = "advertiser" | "agency" | "other";
export type EnquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost"
  | "closed";
export type EnquirySource = "marketplace" | "direct" | "referral" | "other";
export type CampaignStatus = "draft" | "active" | "completed" | "cancelled";
export type FieldJobPriority = "low" | "medium" | "high" | "urgent";
export type FieldJobStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
export type FieldJobType =
  | "installation"
  | "removal"
  | "inspection"
  | "maintenance"
  | "proof_capture";
export type MemberStatus = "invited" | "active" | "suspended";
export type AgreementStatus = "draft" | "active" | "expired" | "terminated";

export const STRUCTURE_TYPE_LABELS: Record<StructureType, string> = {
  hoarding: "Hoarding",
  unipole: "Unipole",
  billboard: "Billboard",
  gantry: "Gantry",
  wall_wrap: "Wall wrap",
  transit: "Transit",
  digital_led: "Digital LED",
  pole_kiosk: "Pole kiosk",
  other: "Other",
};

export const LIFECYCLE_LABELS: Record<BoardLifecycle, string> = {
  draft: "Draft",
  active: "Active",
  maintenance: "Maintenance",
  blocked: "Blocked",
  retired: "Retired",
};

export const COMPLIANCE_LABELS: Record<ComplianceStatus, string> = {
  valid: "Valid",
  expiring: "Expiring soon",
  expired: "Expired",
  missing: "Missing",
};

export const CLEARANCE_TYPE_LABELS: Record<ClearanceType, string> = {
  municipal: "Municipal",
  traffic: "Traffic",
  structural: "Structural",
  electrical: "Electrical",
  landowner: "Landowner",
  highway: "Highway",
  fire: "Fire",
  other: "Other",
};

export const OCCUPANCY_STATE_LABELS: Record<OccupancyState, string> = {
  occupied: "Occupied",
  on_hold: "On hold",
  booked_future: "Booked future",
  blocked: "Blocked",
};

export const OCCUPANCY_DIMENSION_LABELS: Record<OccupancyDimension, string> = {
  vacant: "Vacant",
  occupied: "Occupied",
  on_hold: "On hold",
  booked_future: "Booked",
  becoming_vacant: "Becoming vacant",
  blocked: "Blocked",
};

export const ILLUMINATION_LABELS: Record<IlluminationType, string> = {
  none: "None",
  front_lit: "Front-lit",
  back_lit: "Back-lit",
  led: "LED",
  digital: "Digital",
};

export const FIELD_JOB_TYPE_LABELS: Record<FieldJobType, string> = {
  installation: "Installation",
  removal: "Removal",
  inspection: "Inspection",
  maintenance: "Maintenance",
  proof_capture: "Proof of display",
};

export const FIELD_JOB_STATUS_LABELS: Record<FieldJobStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const FIELD_JOB_PRIORITY_LABELS: Record<FieldJobPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
  closed: "Closed",
};
