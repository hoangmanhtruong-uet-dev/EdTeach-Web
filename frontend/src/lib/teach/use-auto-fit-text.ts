"use client";

import { useState, useEffect, useCallback } from "react";

interface AutoFitOptions {
  minFontSize?: number; // Minimum font size in px (default 18)
  maxFontSize?: number; // Maximum font size in px (default 40)
  multiplier?: number; // Font size multiplier (0.9, 1.0, 1.2, 1.4)
  dependencies?: unknown[]; // Triggers re-calculation when changed
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

export function useAutoFitText(
  containerRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  options: AutoFitOptions = {}
): {
  fontSize: number;
  recalculate: () => void;
} {
  const { minFontSize = 18, maxFontSize = 40, multiplier = 1.0, dependencies = [] } = options;

  const [fontSize, setFontSize] = useState<number>(() =>
    Math.round(24 * multiplier)
  );

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const availableHeight = container.clientHeight;
    if (availableHeight <= 50) return;

    // Save previous inline styles to restore after binary search
    const prevFontSize = content.style.fontSize;
    const prevLineHeight = content.style.lineHeight;

    let low = minFontSize;
    let high = maxFontSize;
    let best = minFontSize;

    // Binary search 5-6 steps to find largest font size fitting within container
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testSize = mid * multiplier;

      content.style.fontSize = `${testSize}px`;
      content.style.lineHeight = "1.5";

      // Check if content exceeds container height or width
      const overflowsHeight = content.scrollHeight > availableHeight;
      const overflowsWidth = content.scrollWidth > container.clientWidth + 10;

      if (!overflowsHeight && !overflowsWidth) {
        best = mid;
        low = mid + 1; // Try larger
      } else {
        high = mid - 1; // Try smaller
      }
    }

    // Restore style
    content.style.fontSize = prevFontSize;
    content.style.lineHeight = prevLineHeight;

    const finalPx = Math.round(
      Math.max(minFontSize, Math.min(maxFontSize, best)) * multiplier
    );
    setFontSize(finalPx);
  }, [containerRef, contentRef, minFontSize, maxFontSize, multiplier]);

  // Run calculation on dependencies change or ResizeObserver
  const depsKey = JSON.stringify(dependencies);
  useEffect(() => {
    // Initial calculate after render
    const raf = requestAnimationFrame(() => {
      recalculate();
    });

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(raf);
    }

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        recalculate();
      });
    });

    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [containerRef, recalculate, depsKey]);

  return { fontSize, recalculate };
}
