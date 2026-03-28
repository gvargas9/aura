"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-xl", className)}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 overflow-hidden",
        className
      )}
      aria-label="Loading product"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-200 animate-pulse relative">
        <div className="absolute inset-0 shimmer" />
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Dietary badges */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        {/* Price row */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: number;
}) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      )}
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" aria-label="Loading table">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === 0 ? "w-1/4" : "w-1/6")}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="border-b border-gray-50 px-6 py-4 last:border-0"
        >
          <div className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className={cn(
                  "h-4",
                  colIdx === 0 ? "w-1/4" : "w-1/6"
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoxBuilderSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading box builder">
      {/* Tier Selector */}
      <div className="flex gap-4 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-40 rounded-2xl" />
        ))}
      </div>
      {/* Progress */}
      <div className="flex justify-center">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      {/* Product Grid */}
      <ProductGridSkeleton count={8} columns={4} />
    </div>
  );
}

export { Skeleton };
