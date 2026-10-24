import { NextRequest } from "next/server";

import { errorResponse, handleError, success } from "@/lib/api-response";
import { hashPassword, issueAuthCookie, publicUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/schemas/auth.schema";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(`register:${request.headers.get("x-forwarded-for") ?? "unknown"}`)) {
      return errorResponse("Too many requests. Try again later.", 429);
    }
    const input = registerSchema.parse(await request.json());
    await connectToDatabase();
    const existing = await User.exists({ email: input.email });
    if (existing) return errorResponse("An account with this email already exists", 409);
    const user = await User.create({ ...input, password: await hashPassword(input.password) });
    await issueAuthCookie(user);
    return success({ user: publicUser(user), authenticated: true }, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "MongoServerError" && (error as { code?: number }).code === 11000) {
      return errorResponse("An account with this email already exists", 409);
    }
    return handleError(error);
  }
}
