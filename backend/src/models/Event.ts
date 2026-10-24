import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 10_000 },
    category: { type: String, required: true, trim: true, maxlength: 100, index: true },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    venue: { type: String, required: true, trim: true, maxlength: 200 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    activeRegistrations: { type: Number, required: true, default: 0, min: 0, immutable: true },
    imageUrl: { type: String, trim: true, maxlength: 2_000 },
    status: { type: String, enum: ["DRAFT", "PUBLISHED", "CANCELLED"], default: "DRAFT", index: true },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ title: "text", description: "text" });
eventSchema.pre("validate", function (next) {
  if (this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be later than start date");
  }
  if (this.registrationDeadline > this.startDate) {
    this.invalidate("registrationDeadline", "Registration deadline must be on or before the start date");
  }
  next();
});

export type EventDocument = InferSchemaType<typeof eventSchema> & { _id: mongoose.Types.ObjectId };
export const Event: Model<EventDocument> =
  (mongoose.models.Event as Model<EventDocument>) || mongoose.model<EventDocument>("Event", eventSchema);
