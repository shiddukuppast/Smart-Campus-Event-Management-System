import mongoose from "mongoose";

import { getEnv } from "./env";

const globalForMongoose = globalThis as unknown as {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

globalForMongoose.mongoose ??= { conn: null, promise: null };

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalForMongoose.mongoose.conn) return globalForMongoose.mongoose.conn;
  if (!globalForMongoose.mongoose.promise) {
    globalForMongoose.mongoose.promise = mongoose.connect(getEnv().MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
  }
  globalForMongoose.mongoose.conn = await globalForMongoose.mongoose.promise;
  return globalForMongoose.mongoose.conn;
}
