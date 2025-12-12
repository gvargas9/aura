"use client";

import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 border rounded-xl transition-all duration-200 outline-none resize-none",
          "focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-200",
          props.disabled && "bg-gray-50 text-gray-500 cursor-not-allowed",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
