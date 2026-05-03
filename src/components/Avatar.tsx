import { initials } from "@/lib/seed";
import { cn } from "@/lib/utils";

export function Avatar({ name, color, size = 28, className }: { name: string; color?: string; size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        className,
      )}
      style={{
        backgroundColor: color || "#334155",
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
