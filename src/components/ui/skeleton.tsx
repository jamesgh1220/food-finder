import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder block (spec 12, REQ-07; PROMTP #45).
 *
 * Decorative by default, so it is hidden from assistive tech unless the caller
 * overrides `aria-hidden`. `LoadingState` carries the real status semantics.
 */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
