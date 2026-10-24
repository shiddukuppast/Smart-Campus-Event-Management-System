import { NextRequest } from "next/server";

import { errorResponse, handleError, success } from "@/lib/api-response";
import { issueAuthCookie, publicUser, verifyPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/schemas/auth.schema";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(`login:${request.headers.get("x-forwarded-for") ?? "unknown"}`)) {
      return errorResponse("Too many requests. Try again later.", 429);
    }
    const input = loginSchema.parse(await request.json());
    await connectToDatabase();
    const user = await User.findOne({ email: input.email }).select("+password");
    if (!user || !(await verifyPassword(input.password, user.password))) {
      return errorResponse("Invalid email or password", 401);
    }
    await issueAuthCookie(user);
    return success({ user: publicUser(user), authenticated: true });
  } catch (error) {
    return handleError(error);
  }
}
