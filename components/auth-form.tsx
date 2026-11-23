"use client";

import { useState, type FormEvent } from "react";

interface AuthFormProps {
  title: string;
  description: string;
  buttonText: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  mode?: "signin" | "signup";
}

export default function AuthForm({
  title,
  description,
  buttonText,
  onSubmit,
  mode = "signin",
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await onSubmit(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-auth">
      <h1 className="px-title">{title}</h1>

      <p className="px-muted">{description}</p>

      <form onSubmit={handleSubmit} className="px-form">
        {error && (
          <p className="px-err" role="alert">
            {error}
          </p>
        )}

        <div className="px-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "signup" ? 8 : undefined}
            maxLength={72}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
          />
        </div>

        <button className="px-btn" type="submit" disabled={loading}>
          {loading ? "Please wait..." : buttonText}
        </button>
      </form>
    </div>
  );
}
