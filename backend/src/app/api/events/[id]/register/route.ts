import { NextRequest } from "next/server";

import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { errorResponse, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { validObjectId } from "@/lib/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, "PARTICIPANT");
    const { id } = await context.params;
    if (!validObjectId(id)) return errorResponse("Invalid event id", 400);
    await connectToDatabase();
    const event = await Event.findOneAndUpdate({
      _id: id,
      status: "PUBLISHED",
      registrationDeadline: { $gte: new Date() },
      $expr: { $lt: ["$activeRegistrations", "$capacity"] },
    }, { $inc: { activeRegistrations: 1 } }, { new: true });
    if (!event) return errorResponse("Event is not available for registration", 404);
    const existing = await Registration.findOne({ event: id, participant: user._id, status: "REGISTERED" });
    if (existing) {
      await Event.updateOne({ _id: id, activeRegistrations: { $gt: 0 } }, { $inc: { activeRegistrations: -1 } });
      return errorResponse("You are already registered for this event", 409);
    }

    let registration;
    try {
      registration = await Registration.create({ event: id, participant: user._id });
    } catch (error) {
      await Event.updateOne({ _id: id, activeRegistrations: { $gt: 0 } }, { $inc: { activeRegistrations: -1 } });
      throw error;
    }
    return success({ registration: { id: registration._id.toString(), event: id, status: registration.status } }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Participant authentication required", 401);
    if (error instanceof Error && error.name === "MongoServerError" && (error as { code?: number }).code === 11000) {
      return errorResponse("You are already registered for this event", 409);
    }
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, "PARTICIPANT");
    const { id } = await context.params;
    if (!validObjectId(id)) return errorResponse("Invalid event id", 400);
    await connectToDatabase();
    const registration = await Registration.findOneAndUpdate(
      { event: id, participant: user._id, status: "REGISTERED" },
      { $set: { status: "CANCELLED" } },
      { new: true },
    );
    if (!registration) return errorResponse("Active registration not found", 404);
    await Event.updateOne({ _id: id, activeRegistrations: { $gt: 0 } }, { $inc: { activeRegistrations: -1 } });
    return success({ registration: { id: registration._id.toString(), event: id, status: registration.status } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return errorResponse("Participant authentication required", 401);
    return handleError(error);
  }
}
