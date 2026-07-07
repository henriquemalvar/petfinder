import { PIN_CONFIG } from "@/lib/map-config";
import { PIN_ICONS } from "@/lib/map-icons";
import type { PostType } from "@/lib/types";

const types: PostType[] = ["LOST", "FOUND", "ADOPTION"];

export function MapLegend() {
  return (
    <div className="glass-card pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl border border-border/50 px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Legenda
      </p>
      <div className="flex flex-col gap-2">
        {types.map((type) => {
          const Icon = PIN_ICONS[type];
          return (
          <div key={type} className="flex items-center gap-2 text-xs">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: PIN_CONFIG[type].color }}
            >
              <Icon className="h-3 w-3" strokeWidth={2.5} />
            </span>
            <span>{PIN_CONFIG[type].label}</span>
          </div>
          );
        })}
      </div>
    </div>
  );
}
