import type { EventDocument } from "@/models/Event";

export function eventView(event: EventDocument & { organizer?: unknown }) {
  const organizer =
    event.organizer && typeof event.organizer === "object" && "name" in event.organizer
      ? (event.organizer as { _id: unknown; name: string })
      : undefined;
  return {
    id: event._id.toString(),
    title: event.title,
    description: event.description,
    category: event.category,
    venue: event.venue,
    startDate: event.startDate,
    endDate: event.endDate,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    imageUrl: event.imageUrl,
    status: event.status,
    organizer: organizer
      ? { id: String(organizer._id), name: organizer.name }
      : event.organizer
        ? String(event.organizer)
        : undefined,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}
