import { expect, type Page } from "@playwright/test";

let counter = 0;

/** Registra una cuenta nueva y espera a llegar al inicio (RF-101). */
export async function registerUser(
  page: Page,
  name = "Usuario E2E",
): Promise<string> {
  const email = `e2e-${Date.now()}-${counter++}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("planify123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL(/\/$/);

  return email;
}

/** Crea un proyecto desde el inicio y espera a su página (RF-201). */
export async function createProject(page: Page, name: string) {
  await page.getByRole("button", { name: "Nuevo proyecto" }).first().click();
  await page.getByLabel("Nombre").fill(name);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await page.waitForURL(/\/projects\/[^/]+$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

/** Crea un documento (nota o diagrama) y espera a su editor (RF-401). */
export async function createDocument(page: Page, type: "nota" | "diagrama") {
  await page.getByRole("button", { name: "Nuevo documento" }).first().click();
  await page
    .getByRole("menuitem", {
      name: type === "nota" ? "Nueva nota" : "Nuevo diagrama",
    })
    .click();
  await page.waitForURL(/\/documents\/[^/]+$/);
}
