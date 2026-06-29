"use client";

import type { PostType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { POST_TYPE_LABEL } from "@/lib/utils";

interface SearchFilterBarProps {
  active: PostType | "ALL";
  onChange: (type: PostType | "ALL") => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const filters: { value: PostType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "LOST", label: "Perdidos" },
  { value: "FOUND", label: "Encontrados" },
  { value: "ADOPTION", label: "Adoção" },
];

export function SearchFilterBar({
  active,
  onChange,
  search,
  onSearchChange,
}: SearchFilterBarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <input
        type="search"
        placeholder="Buscar por nome, raça ou local..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              active === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { POST_TYPE_LABEL };
