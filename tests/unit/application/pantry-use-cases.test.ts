import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { AddPantryIngredient } from "@/application/pantry/add-pantry-ingredient";
import { UpdatePantryIngredient } from "@/application/pantry/update-pantry-ingredient";
import { RemovePantryIngredient } from "@/application/pantry/remove-pantry-ingredient";
import { GetUserPantry } from "@/application/pantry/get-user-pantry";
import { ClearUserPantry } from "@/application/pantry/clear-user-pantry";
import { UnauthorizedError, NotFoundError } from "@/domain/errors";
import type { PantryRepository } from "@/domain/ports";
import { createFakeAuthPort, makePantryItem, sessionUser } from "./helpers";

function createFakePantry(): PantryRepository {
  return {
    listByUser: vi.fn(async () => []),
    findByUserAndIngredient: vi.fn(async () => null),
    upsert: vi.fn(async (item) => item),
    remove: vi.fn(async () => {}),
    clearByUser: vi.fn(async () => {}),
  } satisfies PantryRepository;
}

describe("AddPantryIngredient", () => {
  it("associates the row to the session user, never a client-supplied id", async () => {
    const pantry = createFakePantry();
    const useCase = new AddPantryIngredient(pantry, createFakeAuthPort());

    const result = await useCase.execute({
      ingredientId: "ing-1",
      quantity: 2,
      unit: "kg",
    });

    const persisted = (pantry.upsert as Mock).mock.calls[0][0];
    expect(persisted.userId).toBe(sessionUser.id);
    expect(persisted.ingredientId).toBe("ing-1");
    expect(typeof persisted.id).toBe("string");
    expect(persisted.id.length).toBeGreaterThan(0);
    expect(persisted.quantity.value).toBe(2);
    expect(persisted.unit.value).toBe("kg");
    expect(result.userId).toBe(sessionUser.id);
  });
});

describe("UpdatePantryIngredient", () => {
  it("throws NotFoundError when the ingredient is not in the pantry", async () => {
    const pantry = createFakePantry();
    const useCase = new UpdatePantryIngredient(pantry, createFakeAuthPort());

    await expect(
      useCase.execute({ ingredientId: "ing-x", quantity: 1, unit: "g" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(pantry.upsert).not.toHaveBeenCalled();
  });

  it("updates quantity and unit while preserving the session owner", async () => {
    const pantry = createFakePantry();
    const existing = makePantryItem();
    (pantry.findByUserAndIngredient as Mock).mockResolvedValueOnce(existing);
    const useCase = new UpdatePantryIngredient(pantry, createFakeAuthPort());

    await useCase.execute({ ingredientId: "ing-1", quantity: 5, unit: "kg" });

    const persisted = (pantry.upsert as Mock).mock.calls[0][0];
    expect(pantry.findByUserAndIngredient).toHaveBeenCalledWith(
      sessionUser.id,
      "ing-1",
    );
    expect(persisted.userId).toBe(sessionUser.id);
    expect(persisted.quantity.value).toBe(5);
    expect(persisted.unit.value).toBe("kg");
    expect(persisted.updatedAt).toBeInstanceOf(Date);
  });
});

describe("RemovePantryIngredient", () => {
  it("removes the row for the session user", async () => {
    const pantry = createFakePantry();
    const useCase = new RemovePantryIngredient(pantry, createFakeAuthPort());

    await useCase.execute({ ingredientId: "ing-1" });

    expect(pantry.remove).toHaveBeenCalledWith(sessionUser.id, "ing-1");
  });
});

describe("GetUserPantry", () => {
  it("returns only the session user's pantry", async () => {
    const pantry = createFakePantry();
    const items = [makePantryItem()];
    (pantry.listByUser as Mock).mockResolvedValueOnce(items);
    const useCase = new GetUserPantry(pantry, createFakeAuthPort());

    const result = await useCase.execute();

    expect(pantry.listByUser).toHaveBeenCalledWith(sessionUser.id);
    expect(result).toBe(items);
  });
});

describe("ClearUserPantry", () => {
  it("clears only the session user's pantry", async () => {
    const pantry = createFakePantry();
    const useCase = new ClearUserPantry(pantry, createFakeAuthPort());

    await useCase.execute();

    expect(pantry.clearByUser).toHaveBeenCalledWith(sessionUser.id);
  });
});

describe("pantry use cases — unauthorized", () => {
  const noSession = () => createFakeAuthPort(null);

  it("AddPantryIngredient throws and never touches the repository", async () => {
    const pantry = createFakePantry();
    const useCase = new AddPantryIngredient(pantry, noSession());
    await expect(
      useCase.execute({ ingredientId: "ing-1", quantity: 1, unit: "g" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(pantry.upsert).not.toHaveBeenCalled();
  });

  it("UpdatePantryIngredient throws and never touches the repository", async () => {
    const pantry = createFakePantry();
    const useCase = new UpdatePantryIngredient(pantry, noSession());
    await expect(
      useCase.execute({ ingredientId: "ing-1", quantity: 1, unit: "g" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(pantry.findByUserAndIngredient).not.toHaveBeenCalled();
    expect(pantry.upsert).not.toHaveBeenCalled();
  });

  it("RemovePantryIngredient throws and never touches the repository", async () => {
    const pantry = createFakePantry();
    const useCase = new RemovePantryIngredient(pantry, noSession());
    await expect(
      useCase.execute({ ingredientId: "ing-1" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(pantry.remove).not.toHaveBeenCalled();
  });

  it("GetUserPantry throws and never touches the repository", async () => {
    const pantry = createFakePantry();
    const useCase = new GetUserPantry(pantry, noSession());
    await expect(useCase.execute()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(pantry.listByUser).not.toHaveBeenCalled();
  });

  it("ClearUserPantry throws and never touches the repository", async () => {
    const pantry = createFakePantry();
    const useCase = new ClearUserPantry(pantry, noSession());
    await expect(useCase.execute()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(pantry.clearByUser).not.toHaveBeenCalled();
  });
});
