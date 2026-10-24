import { NextRequest } from "next/server";

import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { eventSchema, eventUpdateSchema } from "@/schemas/event.schema";
import { eventView } from "@/lib/event-view";
import { forbidden, unauthorized, validObjectId } from "@/lib/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!validObjectId(id)) return errorResponse("Invalid event id", 400);
    await connectToDatabase();
    const event = await Event.findOne({ _id: id, status: "PUBLISHED" }).populate("organizer", "name");
    if (!event) return errorResponse("Event not found", 404);
    return success({ event: eventView(event), registrationCount: event.activeRegistrations, availableCapacity: Math.max(event.capacity - event.activeRegistrations, 0) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, "ORGANIZER");
    const { id } = await context.params;
    if (!validObjectId(id)) return errorResponse("Invalid event id", 400);
    const input = eventUpdateSchema.parse(await request.json());
    await connectToDatabase();
    const event = await Event.findOne({ _id: id, organizer: user._id });
    if (!event) return errorResponse("Event not found", 404);
    eventSchema.parse({ ...event.toObject(), ...input });
    if (input.capacity !== undefined) {
      if (input.capacity < event.activeRegistrations) return errorResponse("Capacity cannot be lower than current registrations", 409);
    }
    Object.assign(event, input);
    await event.save();
    return success({ event: eventView(event) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return unauthorized();
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, "ORGANIZER");
    const { id } = await context.params;
    if (!validObjectId(id)) return errorResponse("Invalid event id", 400);
    await connectToDatabase();
    const event = await Event.findOneAndDelete({ _id: id, organizer: user._id });
    if (!event) return errorResponse("Event not found", 404);
    await Registration.deleteMany({ event: id });
    return success({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return unauthorized();
    return handleError(error);
  }
}
