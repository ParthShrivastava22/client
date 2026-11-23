"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AuthState,
} from "../app/account-actions";

export default function AuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next: string;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "signin" ? signInAction : signUpAction,
    {},
  );

  const v = state.values ?? {};
  const q = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <form key={JSON.stringify(v)} action={action} className="px-form">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <p className="px-err" role="alert">
          {state.error}
        </p>
      )}

      {mode === "signup" && (
        <div className="px-field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={v.displayName}
            autoComplete="nickname"
            maxLength={40}
            required
          />
        </div>
      )}

      <div className="px-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={v.email}
          autoComplete="email"
          required
        />
      </div>

      <div className="px-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={mode === "signup" ? 8 : undefined}
          maxLength={72}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </div>

      <button className="px-btn" type="submit" disabled={pending}>
        {pending
          ? "Please wait…"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="px-muted">
        {mode === "signin" ? "New here? " : "Already have an account? "}
        <Link
          href={`${mode === "signin" ? "/signup" : "/signin"}${q}`}
          className="px-link"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
