import type { LogContext, Logger, LogLevel } from "@/application/ports/logger";
import { LOG_LEVELS } from "@/application/ports/logger";

/**
 * Console logger adapter (single implementation, REQ-09).
 *
 * Never lets API keys, passwords, tokens, or other secrets reach the
 * output: every context value is walked and sensitive keys are redacted.
 */

const SENSITIVE_KEY_PATTERN =
  /(key|token|secret|password|passwd|authorization|cookie|credential|bearer)/i;

export const REDACTED = "[REDACTED]";

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value !== null && typeof value === "object") {
    return redactContext(value as LogContext);
  }
  return value;
}

/** Deep-copies a log context, replacing sensitive values with `[REDACTED]`. */
export function redactContext(context: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? REDACTED
      : redactValue(value);
  }
  return result;
}

function levelEnabled(minLevel: LogLevel, level: LogLevel): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(minLevel);
}

/**
 * Creates the project's only logger. `minLevel` filters everything below it
 * (default `info`, so `debug` stays out of production output unless asked for).
 */
export function createConsoleLogger(minLevel: LogLevel = "info"): Logger {
  const write = (level: LogLevel, message: string, context?: LogContext) => {
    if (!levelEnabled(minLevel, level)) return;
    const suffix = context ? ` ${JSON.stringify(redactContext(context))}` : "";
    console[level === "debug" ? "log" : level](
      `[${level.toUpperCase()}] ${message}${suffix}`,
    );
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
  };
}
