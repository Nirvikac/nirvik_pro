"use client";

import { useRef, useState } from "react";

export default function GateForm({ next }: { next: string }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        window.location.assign(next);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Incorrect PIN.");
      setPin("");
      inputRef.current?.focus();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="reg-form" onSubmit={onSubmit}>
      <input
        ref={inputRef}
        type="password"
        name="pin"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        placeholder="PIN"
        aria-label="Access PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        disabled={busy}
      />
      <button type="submit" disabled={busy || pin.length === 0}>
        {busy ? "Checking…" : "Unlock"}
      </button>
      <div
        className={`reg-status ${error ? "err" : ""}`}
        role="status"
        aria-live="polite"
      >
        {error}
      </div>
    </form>
  );
}
