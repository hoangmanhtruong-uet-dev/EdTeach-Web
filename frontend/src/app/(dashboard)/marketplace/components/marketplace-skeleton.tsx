"use client";

import React from "react";

interface MarketplaceSkeletonProps {
  count?: number;
}

export function MarketplaceSkeleton({ count = 6 }: MarketplaceSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách đề thi..."
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between min-h-[260px] animate-pulse"
        >
          <div>
            {/* Subject/Grade badge & Rating skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-28 bg-muted/80 rounded-lg" />
              <div className="h-4 w-14 bg-muted/70 rounded" />
            </div>

            {/* Title (2 lines) */}
            <div className="space-y-1.5 mb-3">
              <div className="h-4 w-5/6 bg-muted/80 rounded" />
              <div className="h-4 w-1/2 bg-muted/70 rounded" />
            </div>

            {/* Description (2 lines) */}
            <div className="space-y-1 mb-3.5">
              <div className="h-3 w-full bg-muted/60 rounded" />
              <div className="h-3 w-3/4 bg-muted/60 rounded" />
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 mb-4">
              <div className="h-4 w-12 bg-muted/60 rounded-md" />
              <div className="h-4 w-16 bg-muted/60 rounded-md" />
              <div className="h-4 w-14 bg-muted/60 rounded-md" />
            </div>

            {/* Author & Exam Meta */}
            <div className="pb-3 border-b border-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3.5 w-24 bg-muted/80 rounded" />
                <div className="h-2.5 w-16 bg-muted/60 rounded" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-3.5 w-14 bg-muted/80 rounded ml-auto" />
                <div className="h-2.5 w-18 bg-muted/60 rounded ml-auto" />
              </div>
            </div>
          </div>

          {/* Footer Price & Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="h-5 w-20 bg-muted/80 rounded" />
            <div className="flex items-center gap-1.5">
              <div className="h-8 w-16 bg-muted/70 rounded-xl" />
              <div className="h-8 w-16 bg-muted/80 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải danh sách đề thi...</span>
    </div>
  );
}
