import mongoose from "mongoose";

import { getEnv } from "./env";

const globalForMongoose = globalThis as unknown as {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    loggedConnected: boolean;
  };
};

globalForMongoose.mongoose ??= { conn: null, promise: null, loggedConnected: false };

export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Database unavailable");
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

export function isDatabaseError(error: unknown) {
  if (error instanceof DatabaseUnavailableError) return true;
  if (!(error instanceof Error)) return false;
  return [
    "MongoServerSelectionError",
    "MongoNetworkError",
    "MongoNetworkTimeoutError",
    "MongoServerError",
    "MongooseServerSelectionError",
  ].includes(error.name);
}

function sanitizedMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "mongodb://[redacted]")
    .replace(/(password|passwd|pwd)=([^&\s]+)/gi, "$1=[redacted]");
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const state = globalForMongoose.mongoose;
  if (state.conn?.connection.readyState === 1) return state.conn;
  if (state.promise) {
    try {
      state.conn = await state.promise;
      return state.conn;
    } catch (error) {
      state.promise = null;
      state.conn = null;
      throw new DatabaseUnavailableError(error);
    }
  }

  try {
    const env = getEnv();
    state.promise = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 20_000,
      maxPoolSize: 10,
      maxIdleTimeMS: 30_000,
    });
    state.conn = await state.promise;
    state.promise = null;
    if (!state.loggedConnected) {
      console.info("MongoDB connection established");
      state.loggedConnected = true;
    }
    return state.conn;
  } catch (error) {
    state.promise = null;
    state.conn = null;
    state.loggedConnected = false;
    console.error("MongoDB connection failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: sanitizedMessage(error),
    });
    throw new DatabaseUnavailableError(error);
  }
}
