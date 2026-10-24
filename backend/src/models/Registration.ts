import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const registrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    participant: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["REGISTERED", "CANCELLED"], required: true, default: "REGISTERED" },
    registeredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

registrationSchema.index(
  { event: 1, participant: 1 },
  { unique: true, partialFilterExpression: { status: "REGISTERED" } },
);

export type RegistrationDocument = InferSchemaType<typeof registrationSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Registration: Model<RegistrationDocument> =
  (mongoose.models.Registration as Model<RegistrationDocument>) ||
  mongoose.model<RegistrationDocument>("Registration", registrationSchema);
