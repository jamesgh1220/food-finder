/**
 * Barril raíz de la capa de dominio (spec 06).
 *
 * Reexporta entidades, value objects, errores, puertos y normalización para
 * que las capas externas dependan de `@/domain` sin conocer la estructura
 * interna de carpetas.
 */
export * from "./entities";
export * from "./value-objects";
export * from "./errors";
export * from "./ports";
export * from "./normalization";
