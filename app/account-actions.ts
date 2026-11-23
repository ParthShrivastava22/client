"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "../lib/mock/db";
import {
  endSession,
  hashPassword,
  safeNext,
  startSession,
  verifyPassword,
} from "../lib/auth";

export type AuthState = {
  error?: string;
  values?: { email?: string; displayName?: string };
};
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function signInAction(
  _prev: AuthState,
  fd: FormData,
): Promise<AuthState> {
  const email = str(fd, "email").trim().toLowerCase();
  const user = Object.values(db.users).find((u) => u.email === email);
  if (
    !user ||
    !(await verifyPassword(str(fd, "password"), user.passwordHash))
  ) {
    return { error: "Incorrect email or password.", values: { email } }; // same message either way
  }
  await startSession(user.id);
  redirect(safeNext(str(fd, "next")));
}

export async function signUpAction(
  _prev: AuthState,
  fd: FormData,
): Promise<AuthState> {
  const displayName = str(fd, "displayName").trim();
  const email = str(fd, "email").trim().toLowerCase();
  const password = str(fd, "password");
  const values = { email, displayName };
  if (displayName.length < 2 || displayName.length > 40)
    return { error: "Display name must be 2 to 40 characters.", values };
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email address.", values };
  if (password.length < 8 || password.length > 72)
    return { error: "Password must be 8 to 72 characters.", values };
  if (Object.values(db.users).some((u) => u.email === email))
    return { error: "That email is already registered.", values };

  const id = `u${randomBytes(6).toString("hex")}`;
  db.users[id] = { id, email, passwordHash: await hashPassword(password) };
  db.creators[id] = {
    id,
    displayName,
    bio: "",
    joinedAt: new Date().toISOString(),
  };
  await startSession(id);
  redirect(safeNext(str(fd, "next")));
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}
