"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AutoFitOptions {
  isDragging?: boolean;
  questionId?: string | number;
  fontScale?: number; // Multiplier (0.9, 1.0, 1.2, 1.4)
}

const STORAGE_KEY = "edteach_font_multiplier";

export function useFontMultiplier(initial = 1.0): [number, (val: number) => void] {
  const [multiplier, setMultiplierState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = parseFloat(saved);
          if ([0.9, 1.0, 1.2, 1.4].includes(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return initial;
  });

  const setMultiplier = useCallback((val: number) => {
    setMultiplierState(val);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(val));
      } catch {
        // ignore
      }
    }
  }, []);

  return [multiplier, setMultiplier];
}

/**
 * useAutoFitText:
 * 1. Only runs on: (a) question change, (b) dragging end (pointerup), (c) font multiplier change.
 * 2. NEVER runs while dragging to eliminate layout thrashing.
 * 3. Measures both scrollWidth and scrollHeight vs clientWidth and clientHeight.
 * 4. Only REDUCES from CSS clamp (starts at 1.0 down to max 0.70).
 * 5. Applies result directly via CSS variable `--fit` on the container DOM element without React setState.
 * 6. Includes hysteresis (only updates if delta >= 0.03).
 */
export function useAutoFitText(
  containerRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  options: AutoFitOptions = {}
) {
  const { isDragging = false, questionId, fontScale = 1.0 } = options;
  const currentFitRef = useRef<number>(1.0);
  const isMeasuringRef = useRef<boolean>(false);

  const measureAndFit = useCallback(() => {
    // DO NOT run while dragging
    if (isDragging) return;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const clientH = container.clientHeight;
    const clientW = container.clientWidth;
    if (clientH <= 60 || clientW <= 100) return;

    isMeasuringRef.current = true;

    requestAnimationFrame(() => {
      // Step 1: Test at baseline fit = 1.0 (pure CSS clamp)
      container.style.setProperty("--fit", "1");
      const overflowH = content.scrollHeight > clientH;
      const overflowW = content.scrollWidth > clientW;

      let targetFit = 1.0;

      // If content overflows at 1.0, binary search reduction between 0.70 and 1.0
      if (overflowH || overflowW) {
        let low = 0.7; // Maximum reduction 30%
        let high = 1.0;
        let best = 0.7;

        for (let step = 0; step < 6; step++) {
          const mid = (low + high) / 2;
          container.style.setProperty("--fit", mid.toFixed(3));

          const fits = content.scrollHeight <= clientH && content.scrollWidth <= clientW;
          if (fits) {
            best = mid;
            low = mid + 0.02; // Try larger
          } else {
            high = mid - 0.02; // Try smaller
          }
        }
        targetFit = Math.max(0.7, Math.min(1.0, best));
      }

      // Hysteresis: only update if change >= 0.03
      if (Math.abs(currentFitRef.current - targetFit) >= 0.03 || targetFit === 1.0) {
        currentFitRef.current = targetFit;
        container.style.setProperty("--fit", targetFit.toFixed(2));
      } else {
        // Restore current
        container.style.setProperty("--fit", currentFitRef.current.toFixed(2));
      }

      isMeasuringRef.current = false;
    });
  }, [containerRef, contentRef, isDragging]);

  // Run on question change, fontScale change, or when isDragging transitions from true to false
  const prevDraggingRef = useRef(isDragging);
  useEffect(() => {
    const wasDragging = prevDraggingRef.current;
    prevDraggingRef.current = isDragging;

    // Trigger when dragging stops or when not dragging
    if (!isDragging) {
      if (wasDragging) {
        // Ended dragging: measure once after layout settles
        const raf = requestAnimationFrame(() => {
          measureAndFit();
        });
        return () => cancelAnimationFrame(raf);
      } else {
        measureAndFit();
      }
    }
  }, [isDragging, questionId, fontScale, measureAndFit]);

  return { recalculate: measureAndFit };
}
