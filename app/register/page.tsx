"use client";

import { useState } from "react";
import Link from "next/link";

const BACKEND = "https://backend-bizos.onrender.com";

type Status = { kind: "idle" | "busy" | "ok" | "err"; text: string };

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "busy", text: "Creating your account…" });

    try {
      const res = await fetch(`${BACKEND}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus({
          kind: "ok",
          text:
            data.message ||
            "Account created! Check your email to verify, then log in.",
        });
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        setStatus({
          kind: "err",
          text: data.message || `Registration failed (${res.status})`,
        });
      }
    } catch {
      setStatus({
        kind: "err",
        text: "Network error — please try again.",
      });
    }
  };

  return (
    <main className="reg-page">
      <div className="reg-card">
        <div className="reg-eyebrow">BIZOS — BUSINESS DASHBOARD</div>
        <h1 className="reg-title">Create your account</h1>
        <p className="reg-sub">
          Register for BizOS, then verify your email to start selling.
        </p>

        <form className="reg-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={30}
            autoComplete="username"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <div className="reg-hint">
            6+ characters with uppercase, lowercase, number &amp; special
            character. You&apos;ll verify your email after signing up.
          </div>
          <button type="submit" disabled={status.kind === "busy"}>
            {status.kind === "busy" ? "Creating account…" : "Create account"}
          </button>
          {status.text && (
            <div
              className={`reg-status ${status.kind === "ok" ? "ok" : status.kind === "err" ? "err" : ""}`}
              role="status"
              aria-live="polite"
            >
              {status.text}
            </div>
          )}
        </form>

        <div className="reg-links">
          <Link href="/">← Back to portfolio</Link>
          <a
            href="https://bizos-web-ms3k.onrender.com/"
            target="_blank"
            rel="noopener"
          >
            Already registered? Login →
          </a>
        </div>
      </div>
    </main>
  );
}
