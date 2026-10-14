import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Base textarea (flujo de petición libre al chef).
 *
 * Comparte el lenguaje de `Input`: 1px de borde, radio crisp, anillo en
 * focus-visible y borde destructivo cuando `aria-invalid` está presente.
 * Server-safe: no guarda estado.
 */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 5, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "w-full resize-y rounded-md border border-input bg-card px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
