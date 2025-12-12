"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  error,
  className,
  disabled,
}: SelectProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2.5 pr-10 border rounded-xl appearance-none bg-white transition-all duration-200 outline-none",
            "focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200",
            disabled && "bg-gray-50 text-gray-500 cursor-not-allowed"
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
