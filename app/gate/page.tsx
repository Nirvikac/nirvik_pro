import type { Metadata } from "next";
import { safeNextPath } from "@/lib/gate";
import GateForm from "./gate-form";

export const metadata: Metadata = {
  title: "Enter PIN — Nirvik Acharya",
  robots: { index: false, follow: false },
};

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params?.next);

  return (
    <main className="reg-page">
      <div className="reg-card gate-card">
        <div className="reg-eyebrow">RESTRICTED ACCESS</div>
        <h1 className="reg-title">Enter PIN</h1>
        <p className="reg-sub">
          This site is private. Enter the access PIN to continue.
        </p>
        <GateForm next={next} />
      </div>
    </main>
  );
}
