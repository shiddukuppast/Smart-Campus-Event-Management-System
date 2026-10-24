import { NextRequest } from "next/server";

import { Event } from "@/models/Event";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { eventView } from "@/lib/event-view";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, "ORGANIZER");
    await connectToDatabase();
    const events = await Event.find({ organizer: user._id }).sort({ startDate: 1 });
    return success({ events: events.map((event) => eventView(event)) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Organizer authentication required", 401);
    return handleError(error);
  }
}
