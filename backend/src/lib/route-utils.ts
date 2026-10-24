import mongoose from "mongoose";
import { errorResponse } from "./api-response";

export function validObjectId(id: string) {
  return mongoose.isValidObjectId(id);
}

export function unauthorized() {
  return errorResponse("Authentication required", 401);
}

export function forbidden() {
  return errorResponse("You do not have permission to perform this action", 403);
}
