import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Introduce tu email.")
    .email("Introduce un email válido."),
  password: z.string().min(1, "Introduce tu contraseña."),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Introduce tu email.")
    .email("Introduce un email válido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

/** Solo rutas absolutas del mismo origen son destinos de redirect seguros. */
export function safeNextPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}
