import { z } from "zod";

const dateValue = z.coerce.date();

const eventFields = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10_000),
    category: z.string().trim().min(1).max(100),
    venue: z.string().trim().min(1).max(200),
    startDate: dateValue,
    endDate: dateValue,
    registrationDeadline: dateValue,
    capacity: z.number().int().positive(),
    imageUrl: z.string().url().max(2_000).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).default("DRAFT"),
});

function validateDates(value: { startDate?: Date; endDate?: Date; registrationDeadline?: Date }, ctx: z.RefinementCtx) {
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be later than start date" });
  }
  if (value.registrationDeadline && value.startDate && value.registrationDeadline > value.startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["registrationDeadline"],
      message: "Registration deadline must be on or before the start date",
    });
  }
}

export const eventSchema = eventFields.superRefine((value, ctx) => {
    validateDates(value, ctx);
  });

export const eventUpdateSchema = eventFields.partial().superRefine((value, ctx) => {
  validateDates(value, ctx);
});
