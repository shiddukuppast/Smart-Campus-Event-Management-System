import { NextRequest } from "next/server";

import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { validObjectId } from "@/lib/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, "ORGANIZER");
    const { id } = await context.params;
    if (!validObjectId(id)) return errorResponse("Invalid event id", 400);
    await connectToDatabase();
    const event = await Event.exists({ _id: id, organizer: user._id });
    if (!event) return errorResponse("Event not found", 404);
    const registrations = await Registration.find({ event: id })
      .sort({ registeredAt: -1 })
      .populate("participant", "name email");
    return success({
      participants: registrations.map((registration) => {
        const participant = registration.participant as unknown as { _id: unknown; name: string; email: string };
        return {
          id: registration._id.toString(),
          name: participant.name,
          email: participant.email,
          registrationDate: registration.registeredAt,
          status: registration.status,
        };
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Organizer authentication required", 401);
    return handleError(error);
  }
}
