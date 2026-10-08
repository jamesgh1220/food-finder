/**
 * Logging port (REQ-09 of spec 02).
 *
 * Application and infrastructure depend on this abstraction, never on
 * console or any third-party logger directly. Implementations live in
 * `src/infrastructure/logging/` and MUST redact secrets before writing.
 */

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}
