import { expect, test } from "@playwright/test";

import { registerUser } from "./helpers";

test("registro, inicio vacío y cierre de sesión", async ({ page }) => {
  await registerUser(page, "Registro E2E");

  await expect(
    page.getByRole("heading", { name: "Proyectos", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Todavía no tienes proyectos")).toBeVisible();

  // Cierre de sesión desde el menú de usuario
  await page.getByRole("button", { name: /Usuario E2E|Registro E2E/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await page.waitForURL(/\/login$/);
  await expect(page.getByText("Entrar en Planify")).toBeVisible();
});

test("la ayuda de atajos se abre desde el menú de usuario", async ({
  page,
}) => {
  await registerUser(page);

  await page.getByRole("button", { name: /Usuario E2E/ }).click();
  await page.getByRole("menuitem", { name: "Atajos de teclado" }).click();
  await expect(
    page.getByRole("heading", { name: "Atajos de teclado" }),
  ).toBeVisible();
  await expect(page.getByText("Ctrl/⌘ + K")).toBeVisible();
});
