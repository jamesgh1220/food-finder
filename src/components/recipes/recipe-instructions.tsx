import { cn } from "@/lib/utils";

/**
 * Recipe instructions (spec 12, REQ-03; PROMTP #10).
 *
 * The domain stores instructions as a single raw string. This splits them into
 * steps on newlines, drops blank lines and strips a leading "1." / "1)" marker
 * so the ordered list owns the numbering. Server-safe.
 */

/** Strip an optional leading enumeration ("1.", "1)", "1 -") from a step. */
function stripLeadingNumber(line: string): string {
  return line.replace(/^\d+\s*[.)-]\s*/, "");
}

/** Turn a raw instructions string into a clean, ordered list of steps. */
export function parseInstructionSteps(instructions: string): string[] {
  return instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(stripLeadingNumber)
    .filter((line) => line.length > 0);
}

export interface RecipeInstructionsProps {
  instructions: string;
  className?: string;
}

export function RecipeInstructions({
  instructions,
  className,
}: RecipeInstructionsProps) {
  const steps = parseInstructionSteps(instructions);

  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {steps.map((step, index) => (
        <li
          key={index}
          className="flex gap-3 text-sm leading-relaxed text-foreground"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
