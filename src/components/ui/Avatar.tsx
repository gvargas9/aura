"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={cn(
        "relative rounded-full bg-aura-primary/10 flex items-center justify-center overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <span className="font-semibold text-aura-primary">{initials}</span>
      )}
    </div>
  );
}
