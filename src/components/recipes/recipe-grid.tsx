import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Responsive recipe grid (spec 12, REQ-03; PROMTP #45).
 *
 * One column on mobile, two on small screens, three on large. Server-safe.
 */
const GRID_CLASSES = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

export interface RecipeGridProps {
  children: ReactNode;
  className?: string;
}

export function RecipeGrid({ children, className }: RecipeGridProps) {
  return <div className={cn(GRID_CLASSES, className)}>{children}</div>;
}

export interface RecipeGridSkeletonProps {
  count?: number;
  className?: string;
}

export function RecipeGridSkeleton({
  count = 6,
  className,
}: RecipeGridSkeletonProps) {
  return (
    <div className={cn(GRID_CLASSES, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
