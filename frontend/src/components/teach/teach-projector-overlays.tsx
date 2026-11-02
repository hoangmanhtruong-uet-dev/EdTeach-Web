"use client";

import React, { useState, useEffect, useRef } from "react";

export interface TeachProjectorOverlaysProps {
  isLaserActive: boolean;
  onToggleLaser: () => void;
  isSpotlightActive: boolean;
  onToggleSpotlight: () => void;
  isProjectorMode: boolean;
}

export function TeachProjectorOverlays({
  isLaserActive,
  onToggleLaser,
  isSpotlightActive,
  onToggleSpotlight,
  isProjectorMode,
}: TeachProjectorOverlaysProps) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isCursorHidden, setIsCursorHidden] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse move listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Trail delay
      setTimeout(() => {
        setTrailPos({ x: e.clientX, y: e.clientY });
      }, 50);

      // Projector mode: auto-hide cursor after 3 seconds of inactivity
      if (isProjectorMode) {
        setIsCursorHidden(false);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setIsCursorHidden(true);
        }, 3000);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isProjectorMode]);

  // Apply hidden cursor class to body when projector auto-hides or laser is on
  useEffect(() => {
    if (isCursorHidden) {
      document.body.classList.add("cursor-none");
    } else {
      document.body.classList.remove("cursor-none");
    }
    return () => {
      document.body.classList.remove("cursor-none");
    };
  }, [isCursorHidden]);

  // Keyboard shortcut: Esc to disable laser or spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLaserActive) onToggleLaser();
        if (isSpotlightActive) onToggleSpotlight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLaserActive, onToggleLaser, isSpotlightActive, onToggleSpotlight]);

  return (
    <>
      {/* 1. SPOTLIGHT OVERLAY (Focus circle around cursor, dark vignette outside) */}
      {isSpotlightActive && (
        <div
          className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle 160px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(2, 6, 23, 0.82) 100%)`,
          }}
        />
      )}

      {/* 2. LASER POINTER OVERLAY (Trailing red dot glowing on classroom screen) */}
      {isLaserActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Faint trailing glow */}
          <div
            className="absolute rounded-full bg-red-500/30 blur-xs transition-transform duration-75 ease-out"
            style={{
              width: "28px",
              height: "28px",
              left: `${trailPos.x - 14}px`,
              top: `${trailPos.y - 14}px`,
            }}
          />

          {/* Sharp bright laser pointer dot with neon aura */}
          <div
            className="absolute rounded-full bg-red-500 border border-white shadow-[0_0_16px_#ef4444,0_0_8px_#f87171]"
            style={{
              width: "16px",
              height: "16px",
              left: `${mousePos.x - 8}px`,
              top: `${mousePos.y - 8}px`,
            }}
          />
        </div>
      )}
    </>
  );
}
