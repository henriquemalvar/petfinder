import type { PostType } from "@/lib/types";
import { cn, POST_TYPE_COLORS, POST_TYPE_LABEL } from "@/lib/utils";

interface StatusChipProps {
  type: PostType;
  className?: string;
  pulse?: boolean;
}

export function StatusChip({ type, className, pulse }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        POST_TYPE_COLORS[type],
        pulse && type === "LOST" && "map-pin-pulse",
        className,
      )}
    >
      {POST_TYPE_LABEL[type]}
    </span>
  );
}
