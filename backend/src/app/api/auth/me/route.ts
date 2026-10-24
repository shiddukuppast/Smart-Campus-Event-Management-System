import { NextRequest } from "next/server";

import { errorResponse, success } from "@/lib/api-response";
import { getAuthenticatedUser, publicUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return errorResponse("Authentication required", 401);
  return success({ user: publicUser(user) });
}
