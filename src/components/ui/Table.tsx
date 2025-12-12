"use client";

import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full", className)}>{children}</table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn("bg-gray-50 border-b border-gray-200", className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={cn("divide-y divide-gray-100", className)}>{children}</tbody>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        "hover:bg-gray-50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSort?: () => void;
}

export function TableHead({
  children,
  className,
  sortable,
  sorted,
  onSort,
}: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider",
        sortable && "cursor-pointer select-none hover:text-gray-900",
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && sorted && (
          <span className="text-aura-primary">
            {sorted === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={cn("px-4 py-4 text-sm text-gray-700", className)}>
      {children}
    </td>
  );
}
