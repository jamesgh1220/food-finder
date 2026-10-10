import type { ReactNode } from "react";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Shared error state (spec 12, REQ-06; PROMTP #53).
 *
 * Server-safe. Exposed as an assertive alert region. The retry affordance is
 * supplied by the caller through `action`, since retrying needs interactivity.
 */
export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  const resolvedTitle = title ?? messages.states.error.title;
  const resolvedDescription = description ?? messages.states.error.description;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <div className="text-destructive" aria-hidden="true">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4" />
          <path d="M12 17.5h.01" />
        </svg>
      </div>
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
