/**
 * Taxonomía base de errores de dominio (spec 06, REQ-09).
 *
 * El dominio NO conoce HTTP: estos errores no llevan códigos de estado. El
 * mapeo a status codes es responsabilidad de la spec 11 (capa de API).
 */

/** Error abstracto del que heredan todos los errores de dominio. */
export abstract class DomainError extends Error {
  /** Código estable e independiente del transporte (p. ej. "VALIDATION_ERROR"). */
  readonly code: string;
  /** Datos de contexto opcionales para diagnóstico (nunca para la UI). */
  readonly details?: Record<string, unknown>;

  protected constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    // Conserva el nombre real de la subclase (DomainError es abstracto).
    this.name = new.target.name;
    this.code = code;
    this.details = details;
    // Corrige el prototipo al transpilar a ES2017 para que `instanceof` funcione.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Entrada inválida en una operación de dominio. */
export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
  }
}

/** La operación requiere una identidad autenticada. */
export class UnauthorizedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("UNAUTHORIZED", message, details);
  }
}

/** La identidad existe pero no tiene permiso para la operación. */
export class ForbiddenError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("FORBIDDEN", message, details);
  }
}

/** El recurso solicitado no existe. */
export class NotFoundError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("NOT_FOUND", message, details);
  }
}

/** La operación choca con el estado actual (p. ej. recurso duplicado). */
export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICT", message, details);
  }
}

/** Un servicio externo (Gemini, IA, etc.) falló. */
export class ExternalServiceError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("EXTERNAL_SERVICE", message, details);
  }
}

/** La persistencia falló a nivel de repositorio. */
export class RepositoryError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("REPOSITORY_ERROR", message, details);
  }
}
