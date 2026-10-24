import { NextRequest } from "next/server";

import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, "ORGANIZER");
    await connectToDatabase();
    const events = await Event.find({ organizer: user._id }).sort({ startDate: 1 }).lean();
    const eventIds = events.map((event) => event._id);
    const recentRegistrations = await Registration.find({ event: { $in: eventIds }, status: "REGISTERED" })
      .sort({ registeredAt: -1 }).limit(10).populate("event", "title").populate("participant", "name");
    const now = new Date();
    return success({
      totalEvents: events.length,
      publishedEvents: events.filter((event) => event.status === "PUBLISHED").length,
      cancelledEvents: events.filter((event) => event.status === "CANCELLED").length,
      totalActiveRegistrations: events.reduce((sum, event) => sum + event.activeRegistrations, 0),
      totalAvailableSeats: events.reduce((sum, event) => sum + Math.max(event.capacity - event.activeRegistrations, 0), 0),
      events: events.map((event) => ({
        id: event._id.toString(), title: event.title, capacity: event.capacity,
        registrationCount: event.activeRegistrations,
        capacityUtilization: event.capacity ? event.activeRegistrations / event.capacity : 0,
      })),
      upcomingEvents: events.filter((event) => event.startDate >= now && event.status === "PUBLISHED"),
      recentRegistrations,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Organizer authentication required", 401);
    return handleError(error);
  }
}
