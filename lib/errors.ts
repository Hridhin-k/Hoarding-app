export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "APP_ERROR", status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function translateDbError(error: { message?: string; code?: string } | null | undefined): string {
  const message = error?.message ?? "";
  const code = error?.code ?? "";

  if (
    message.includes("occupancy_periods_no_overlap") ||
    message.includes("exclusion constraint") ||
    code === "23P01"
  ) {
    return "This face already has an occupied or reserved period during these dates.";
  }

  if (message.includes("boards_active_require_location")) {
    return "An active board must have a map location.";
  }

  if (message.includes("duplicate key") && message.includes("board_code")) {
    return "A board with this code already exists in your organization.";
  }

  if (message.includes("duplicate key") && message.includes("face_label")) {
    return "This board already has a face with that label.";
  }

  if (message.includes("duplicate key") && message.includes("slug")) {
    return "That organization URL is already taken. Try another slug.";
  }

  if (message.includes("duplicate key") && message.includes("organization_id") && message.includes("user_id")) {
    return "This person is already a member of the organization.";
  }

  if (message.includes("not currently available for enquiry")) {
    return "This face is not currently available for enquiry.";
  }

  if (message.includes("Too many enquiries")) {
    return "Too many enquiries from this network. Please try again later.";
  }

  if (message.includes("Please enter")) {
    return message;
  }

  if (message.includes("Not platform staff") || message.includes("Only platform super admins") || message.includes("Platform staff cannot create")) {
    return "You do not have permission to do that.";
  }

  if (message.includes("support reason") || message.includes("A reason of at least")) {
    return "Enter a reason of at least 8 characters.";
  }

  if (message.includes("Inspect session expired")) {
    return "Inspect session expired or invalid. Start a new inspect with a reason.";
  }

  if (message.includes("row-level security") || code === "42501") {
    return "You do not have permission to do that.";
  }

  if (message.includes("tenant_id cannot be changed")) {
    return "Records cannot be moved between organizations.";
  }

  return "Something went wrong. Please try again.";
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return translateDbError(error as { message?: string; code?: string });
  }
  return "Something went wrong. Please try again.";
}
