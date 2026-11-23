import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "./mock/db";

const scryptAsync = promisify(scrypt) as (
  pw: string,
  salt: Buffer,
  len: number,
) => Promise<Buffer>;
const COOKIE = "gt_session";
const WEEK = 7 * 24 * 3600;

export interface CurrentUser {
  id: string;
  email: string;
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scryptAsync(pw, salt, 64)).toString("hex")}`;
}
export async function verifyPassword(
  pw: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const actual = await scryptAsync(pw, Buffer.from(salt, "hex"), 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  db.sessions[token] = { userId, expires: Date.now() + WEEK * 1000 };
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
    secure: process.env.NODE_ENV === "production",
  });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) delete db.sessions[token];
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const s = token ? db.sessions[token] : undefined;
  if (!s || s.expires < Date.now()) return null;
  const u = db.users[s.userId];
  return u ? { id: u.id, email: u.email } : null;
}

// Only same-site relative paths are allowed as a post-login destination.
export const safeNext = (n: unknown): string =>
  typeof n === "string" &&
  n.startsWith("/") &&
  !n.startsWith("//") &&
  !n.includes("\\")
    ? n
    : "/";
export const loginUrl = (next: string) =>
  `/signin?next=${encodeURIComponent(next)}`;
