import { expect, test } from "@playwright/test";

/**
 * Spec 05 — flujo live contra Supabase (ISSUE test cases 1-5).
 *
 * La cuenta está creada y confirmada vía admin API para que el flujo de
 * sesión sea determinista. El proyecto tiene `mailer_autoconfirm: false`, así
 * que el registro con esta cuenta existente NO crea sesión. La salida debe ser
 * controlada y en español: o un aviso en /register, o el redirect a /confirm
 * para tipear el código de 6 dígitos. Nunca un error crudo ni /dashboard.
 *
 * No cubre el camino feliz de la confirmación en sí: eso requiere un código
 * real de la bandeja de entrada.
 */
const EMAIL = "ff-e2e-auth@example.com";
const PASSWORD = "E2eTest123!";

test("auth live: session guard, controlled register, login, logout, login", async ({
  page,
}) => {
  test.setTimeout(120_000);

  // --- 1. /dashboard sin sesión redirige a /login con next (REQ-05) ---
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

  // --- 2. Registro sobre cuenta existente: salida controlada en español ---
  await test.step("register returns a controlled Spanish outcome", async () => {
    await page.goto("/register");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    const form = page.locator("form");

    // Dos salidas válidas según cómo responda Supabase para una cuenta ya
    // existente: aviso controlado en /register, o redirect a /confirm para
    // tipear el código. Ambos waitFor se capturan para que el que pierde la
    // carrera no deje un rejection pendiente.
    await Promise.race([
      form
        .getByRole("alert")
        .waitFor({ timeout: 30_000 })
        .catch(() => null),
      page.waitForURL(/\/confirm(\?|$)/, { timeout: 30_000 }).catch(() => null),
    ]);

    if (/\/confirm/.test(page.url())) {
      // El registro sin sesión lleva a la pantalla del código, con el email
      // ya precargado desde la query.
      await expect(page).toHaveURL(/\/confirm\?email=/);
      await expect(
        page.getByRole("heading", { name: "Confirma tu cuenta" }),
      ).toBeVisible();
      await expect(page.locator("#email")).toHaveValue(EMAIL);
      return;
    }

    const feedback = await form.getByRole("alert").first().innerText();
    // "Ya existe" (si el proyecto desactiva la confirmación) o rate-limit
    // mapeado. Nunca un mensaje crudo en inglés.
    expect(feedback).toMatch(/Ya existe una cuenta|Demasiados intentos/);
    // No debe iniciar sesión ni redirigir a /dashboard.
    await expect(page).toHaveURL(/\/register$/);
  });

  // --- 3. Sigue sin sesión: el guard sigue activo ---
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

  // --- 4. Credenciales incorrectas → alert controlado en español ---
  await test.step("wrong password shows Spanish error", async () => {
    await page.goto("/login");
    await page.fill("#email", EMAIL);
    await page.fill("#password", "wrong-password-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(
      page.locator("form").getByRole("alert").filter({ hasText: "incorrectos" }),
    ).toBeVisible({ timeout: 30_000 });
  });

  // --- 5. Login OK → /dashboard muestra el usuario de la sesión ---
  await test.step("login starts a session", async () => {
    await page.fill("#password", PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByText(EMAIL)).toBeVisible();
  });

  // --- 6. Logout limpia la sesión; el guard vuelve a redirigir ---
  await test.step("logout clears the session", async () => {
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  // --- 7. Login de nuevo; autenticado rebotado fuera de /login ---
  await test.step("relogin and authenticated bounce", async () => {
    await page.goto("/login");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByText(EMAIL)).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
