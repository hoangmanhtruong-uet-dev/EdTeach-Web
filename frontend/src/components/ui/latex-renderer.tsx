"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  content: string;
  className?: string;
}

export function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  // Parse string and convert math tokens ($...$ or $$...$$) to rendered HTML
  // Bundles trailing punctuation (.,;:?!) with inline math in whitespace-nowrap span
  const renderedContent = useMemo(() => {
    if (!content) return "";

    // Regular expression to match $$...$$ (block) and $...$ with trailing punctuation
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$[.,;:?!]*)/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto max-w-full py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      } else if (part.startsWith("$")) {
        // Extract inline formula and any immediate punctuation
        const match = part.match(/^(\$[^\$\n]+?\$)([.,;:?!]*)$/);
        if (match) {
          const math = match[1].slice(1, -1).trim();
          const punctuation = match[2];
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span key={index} className="inline-math-wrapper whitespace-nowrap inline">
                <span
                  className="inline-math mx-0.5"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                {punctuation}
              </span>
            );
          } catch {
            return (
              <span key={index} className="inline-math-wrapper whitespace-nowrap inline">
                {part}
              </span>
            );
          }
        }
      }
      return <span key={index}>{part}</span>;
    });
  }, [content]);

  return (
    <div
      className={`latex-content leading-relaxed break-words [overflow-wrap:anywhere] [text-wrap:pretty] ${className}`}
    >
      {renderedContent}
    </div>
  );
}
