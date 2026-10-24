import { NextRequest } from "next/server";

import { Registration } from "@/models/Registration";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, "PARTICIPANT");
    await connectToDatabase();
    const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? 1) || 1, 1);
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10, 1), 100);
    const filter = { participant: user._id };
    const [registrations, total] = await Promise.all([
      Registration.find(filter).populate("event", "title category venue startDate endDate imageUrl status").sort({ registeredAt: -1 }).skip((page - 1) * limit).limit(limit),
      Registration.countDocuments(filter),
    ]);
    return success({
      registrations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Participant authentication required", 401);
    return handleError(error);
  }
}
