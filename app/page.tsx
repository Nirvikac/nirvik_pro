"use client";

import { useEffect, useRef } from "react";

// The 3D world (three.js scene, car physics, kiosk panels) lives verbatim in
// public/portfolio.js — it expects the markup below to already exist, so the
// scripts are appended after mount: three.js from its CDN first, then the
// world script once THREE is available.
export default function Home() {
  const startedRef = useRef(false);

  useEffect(() => {
    // React Strict Mode mounts effects twice in dev; the world script is an
    // IIFE that builds a whole scene, so guard against running it twice.
    if (startedRef.current) return;
    startedRef.current = true;

    const three = document.createElement("script");
    three.src =
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

    const world = document.createElement("script");
    world.src = "/portfolio.js";

    three.onload = () => {
      document.body.appendChild(world);
    };
    document.body.appendChild(three);

    return () => {
      three.remove();
      world.remove();
    };
  }, []);

  return (
    <>
      <div id="loader">
        <div className="mark">
          NIRVIK<span>.DRIVE</span>
        </div>
        <div className="bar">
          <i id="loadbar"></i>
        </div>
        <div className="hint">loading world…</div>
      </div>

      <div id="canvas-wrap"></div>

      <div className="hud hud-top">
        <div className="brand">
          NIRVIK<span>.</span>ACHARYA
        </div>
        <div className="instructions">
          <b>WASD</b> / arrows to drive
          <br />
          drive into a <b>pillar</b> to open it
        </div>
      </div>

      <div className="prompt" id="prompt">
        DRIVE CLOSER TO OPEN →
      </div>

      <div className="compass">
        <div className="compass-inner" id="compassInner">
          <div className="compass-car"></div>
        </div>
      </div>

      <div className="speed">
        <div className="val" id="speedVal">
          0
        </div>
        <div className="lbl">KM/H</div>
      </div>

      <div className="touch-controls" id="touchControls">
        <div className="tbtn" id="btn-up">
          ▲
        </div>
        <div className="tbtn" id="btn-left">
          ◀
        </div>
        <div className="tbtn" id="btn-down">
          ▼
        </div>
        <div className="tbtn" id="btn-right">
          ▶
        </div>
      </div>

      <div className="panel" id="panel">
        <div className="close" id="panelClose">
          ✕
        </div>
        <div id="panelContent"></div>
      </div>
    </>
  );
}
