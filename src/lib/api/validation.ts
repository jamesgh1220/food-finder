import { z } from "zod";
import { ValidationError } from "@/domain/errors";

export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.map((p) => String(p)),
      message: issue.message,
    }));
    throw new ValidationError("Entrada inválida", { issues });
  }
  return result.data;
}
