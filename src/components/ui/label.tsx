import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Base form label (spec 12, REQ-07; PROMTP #45). */
export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));

Label.displayName = "Label";
