"use client";

import { Suspense, useEffect, useState } from "react";

const BACKEND = "https://backend-bizos.onrender.com";

// Verification emails are built from the origin that handled registration —
// this site — so /verify must exist here. It proxies the emailed token to the
// backend directly (the API allows cross-origin GETs), styled with the same
// reg-* classes as the register form.
function VerifyContent() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    // The token is single-use, so a refresh after success reports "invalid" —
    // keep showing the success state already reached instead of the error.
    let done = false;

    const verify = async () => {
      try {
        const res = await fetch(
          `${BACKEND}/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));
        if (done) return;
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(
            data.message || "This verification link is invalid or has expired."
          );
        }
      } catch {
        if (done) return;
        // Cold starts on the free-tier backend surface as network failures.
        setStatus("error");
        setMessage(
          "Network error — the server may be waking up. Please try again in a few seconds."
        );
      }
    };

    verify();

    return () => {
      done = true;
    };
  }, [token]);

  return (
    <main className="reg-page">
      <div className="reg-card">
        <div className="reg-eyebrow">BIZOS — EMAIL VERIFICATION</div>
        <h1 className="reg-title">
          {status === "verifying" && "Verifying your email…"}
          {status === "success" && "Email verified!"}
          {status === "error" && "Verification failed"}
        </h1>
        <p className="reg-sub">
          {status === "verifying" &&
            "Hang tight — this only takes a moment."}
          {status === "success" &&
            "Your email has been verified. You can now log in to BizOS."}
          {status === "error" && message}
        </p>

        {status !== "verifying" && (
          <div className="reg-links">
            <a
              href="https://bizos-web-ms3k.onrender.com/"
              target="_blank"
              rel="noopener"
            >
              Go to Login →
            </a>
            <a href="/">Back to register</a>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
