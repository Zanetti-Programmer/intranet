import type { Space } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  space?: Space;
  size?: "sm" | "md";
}

export function SpaceBadge({ space, size = "sm" }: Props) {
  if (!space) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
      style={{ backgroundColor: `${space.color}20`, color: space.color }}
    >
      <span>{space.icon}</span>
      {space.name}
    </span>
  );
}
