import { ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { AppError } from "@/lib/errors";

export function assertImageFile(file: File) {
  assertFilename(file.name);
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new AppError("Use a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppError("Images must be 15 MB or smaller.");
  }
}

const SAFE_FILENAME = /^[\w.\- ()]+$/;
const MAX_FILENAME_LENGTH = 200;

export function assertFilename(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_FILENAME_LENGTH) {
    throw new AppError("Use a shorter file name (200 characters or fewer).");
  }
  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    throw new AppError("File name cannot contain path separators.");
  }
  if (!SAFE_FILENAME.test(trimmed)) {
    throw new AppError("File name contains unsupported characters.");
  }
}

export function assertDocumentFile(file: File) {
  assertFilename(file.name);
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    throw new AppError("Use a PDF, Word document, or image.");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new AppError("Documents must be 20 MB or smaller.");
  }
}

export function storagePath(tenantId: string, ...parts: string[]) {
  return [tenantId, ...parts.map((p) => p.replace(/[^a-zA-Z0-9._-]/g, "_"))].join("/");
}
