import type { ReactNode } from "react";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Shared empty state (spec 12, REQ-06; PROMTP #53).
 *
 * Server-safe presentational panel. Default copy comes from the centralized
 * i18n messages; callers may override title/description and inject an action.
 */
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const resolvedTitle = title ?? messages.states.empty.title;
  const resolvedDescription = description ?? messages.states.empty.description;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {resolvedTitle}
      </h3>
      {resolvedDescription ? (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {resolvedDescription}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
