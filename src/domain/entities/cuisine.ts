/**
 * Cocina del catálogo (spec 06, REQ-02; PROMTP #84/#85).
 *
 * Es una entidad-catálogo EXTENSIBLE, nunca un enum rígido: las nuevas cocinas
 * se agregan solo con datos, sin tocar código. `country` y `region` son
 * independientes de la cocina (una misma cocina puede cruzar fronteras y un
 * país puede albergar varias cocinas).
 */
export interface Cuisine {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  region: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
