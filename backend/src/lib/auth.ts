import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { User, type UserDocument } from "@/models/User";
import { getEnv } from "./env";
import { connectToDatabase } from "./mongodb";
import type { Role } from "@/types";

export const AUTH_COOKIE = "sc_auth";

function signToken(user: UserDocument) {
  const env = getEnv();
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function publicUser(user: UserDocument) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

export async function issueAuthCookie(user: UserDocument) {
  const env = getEnv();
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, signToken(user), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

function tokenFromRequest(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE)?.value;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<UserDocument | null> {
  const token = tokenFromRequest(request);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET) as JwtPayload;
    if (typeof decoded.sub !== "string") return null;
    await connectToDatabase();
    return await User.findById(decoded.sub).select("+password");
  } catch {
    return null;
  }
}

export async function requireRole(request: NextRequest, role: Role): Promise<UserDocument> {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== role) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
