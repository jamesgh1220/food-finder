/**
 * Usuario soportado por el dominio (spec 06, REQ-08).
 *
 * No vive en `entities/` porque el SPEC fija exactamente 6 entidades allí;
 * es un tipo de apoyo para el puerto de usuarios.
 */
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

/** Puerto de persistencia de usuarios (spec 06, REQ-08). */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
