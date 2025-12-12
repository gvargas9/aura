"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("border-b border-gray-200", className)}>
      <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-aura-primary text-aura-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-2 px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab.id
                    ? "bg-aura-primary/10 text-aura-primary"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
