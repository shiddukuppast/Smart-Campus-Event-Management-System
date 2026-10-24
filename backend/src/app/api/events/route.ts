import { NextRequest } from "next/server";

import { Event } from "@/models/Event";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { eventSchema } from "@/schemas/event.schema";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { eventView } from "@/lib/event-view";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, "ORGANIZER");
    const input = eventSchema.parse(await request.json());
    await connectToDatabase();
    const event = await Event.create({ ...input, organizer: user._id });
    return success({ event: eventView(event) }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Organizer authentication required", 401);
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const params = request.nextUrl.searchParams;
    const page = Math.max(Number(params.get("page") ?? 1) || 1, 1);
    const limit = Math.min(Math.max(Number(params.get("limit") ?? 10) || 10, 1), 100);
    const query: Record<string, unknown> = { status: "PUBLISHED" };
    const search = params.get("search")?.trim();
    if (search) query.$text = { $search: search };
    if (params.get("category")) query.category = params.get("category");
    if (params.get("organizer")) query.organizer = params.get("organizer");
    if (params.get("startDate")) query.startDate = { $gte: new Date(params.get("startDate") as string) };
    if (params.get("endDate")) query.startDate = { ...(query.startDate as object ?? {}), $lte: new Date(params.get("endDate") as string) };
    const sort: Record<string, 1 | -1> = params.get("sort") === "recently-created" ? { createdAt: -1 } : { startDate: 1 };
    const [events, total] = await Promise.all([
      Event.find(query).populate("organizer", "name").sort(sort).skip((page - 1) * limit).limit(limit),
      Event.countDocuments(query),
    ]);
    return success({ events: events.map((event) => eventView(event)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
