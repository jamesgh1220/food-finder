import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { GetCuisines } from "@/application/cuisine/get-cuisines";
import { GetCuisineById } from "@/application/cuisine/get-cuisine-by-id";
import type { Cuisine } from "@/domain/entities";
import { NotFoundError } from "@/domain/errors";
import type { CuisineRepository } from "@/domain/ports";

function createFakeCuisines(): CuisineRepository {
  return {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
  } satisfies CuisineRepository;
}

function makeCuisine(overrides: Partial<Cuisine> = {}): Cuisine {
  return {
    id: "cuisine-es",
    name: "Española",
    slug: "espanola",
    country: "España",
    region: null,
    description: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("GetCuisines", () => {
  it("returns the full cuisine catalog", async () => {
    const cuisines = createFakeCuisines();
    const catalog = [makeCuisine(), makeCuisine({ id: "cuisine-it" })];
    (cuisines.findAll as Mock).mockResolvedValueOnce(catalog);
    const useCase = new GetCuisines(cuisines);

    const result = await useCase.execute();

    expect(cuisines.findAll).toHaveBeenCalledTimes(1);
    expect(result).toBe(catalog);
  });
});

describe("GetCuisineById", () => {
  it("returns the cuisine when it exists", async () => {
    const cuisines = createFakeCuisines();
    const cuisine = makeCuisine();
    (cuisines.findById as Mock).mockResolvedValueOnce(cuisine);
    const useCase = new GetCuisineById(cuisines);

    await expect(useCase.execute({ id: "cuisine-es" })).resolves.toBe(cuisine);
    expect(cuisines.findById).toHaveBeenCalledWith("cuisine-es");
  });

  it("throws NotFoundError when it does not exist", async () => {
    const cuisines = createFakeCuisines();
    const useCase = new GetCuisineById(cuisines);

    await expect(
      useCase.execute({ id: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});