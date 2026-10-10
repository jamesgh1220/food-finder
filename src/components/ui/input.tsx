import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Base text input (spec 12, REQ-07; PROMTP #45).
 *
 * Matches the restraint of the auth forms: 1px border, crisp radius, ring on
 * focus-visible and a destructive border when `aria-invalid` is set.
 */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-11 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
