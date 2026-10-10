import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Shared loading state (spec 12, REQ-06; PROMTP #53).
 *
 * Server-safe. Announces a polite, busy status region and shows an inline
 * spinner rendered with SVG primitives (no icon library, no emoji).
 */
export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps) {
  const resolvedLabel = label ?? messages.states.loading;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground",
        className,
      )}
    >
      <svg
        className="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="3"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span>{resolvedLabel}</span>
    </div>
  );
}
