import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isDatabaseError } from "./mongodb";
import { EnvironmentConfigurationError } from "./env";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { message, ...(details ? { details } : {}) } },
    { status },
  );
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse("Validation failed", 400, error.flatten().fieldErrors);
  }
  if (isDatabaseError(error)) {
    return errorResponse("Database temporarily unavailable. Please try again later.", 503);
  }
  if (error instanceof EnvironmentConfigurationError) {
    return errorResponse("Server configuration is unavailable. Please contact the administrator.", 503);
  }
  console.error("Unhandled API error", error instanceof Error ? error.message : "Unknown error");
  return errorResponse("Internal server error", 500);
}
