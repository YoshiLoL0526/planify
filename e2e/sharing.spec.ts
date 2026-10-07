import { expect, test } from "@playwright/test";

import { createProject, registerUser } from "./helpers";

test("agregar un email sin cuenta genera un enlace de invitación (RF-801)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Compartir E2E");

  await page.getByRole("link", { name: "Compartir" }).click();
  await page.waitForURL(/\/settings$/);

  await page.getByLabel("Email").fill("nadie-e2e@example.com");
  await page.getByRole("button", { name: "Agregar miembro" }).click();

  await expect(page.getByText("no tiene cuenta todavía").first()).toBeVisible();
  await expect(page.locator('input[aria-label="Enlace"]')).toHaveValue(
    /\/invite\//,
  );
});

test("el enlace de invitación acepta a un usuario nuevo (RF-802, RF-804)", async ({
  browser,
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Invitación E2E");

  await page.getByRole("link", { name: "Compartir" }).click();
  await page.waitForURL(/\/settings$/);

  // Crea un enlace desde la pestaña de invitaciones
  await page.getByRole("tab", { name: "Invitaciones" }).click();
  await page.getByRole("button", { name: "Crear enlace" }).click();
  const linkInput = page.locator('input[aria-label="Enlace"]');
  await expect(linkInput).toHaveValue(/\/invite\//);
  const inviteUrl = await linkInput.inputValue();

  // Un visitante sin sesión abre el enlace y se registra desde ahí
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(inviteUrl);
  await expect(guestPage.getByText(/Te han invitado/)).toBeVisible();

  await guestPage
    .getByRole("link", { name: "Crear cuenta para unirme" })
    .click();
  await guestPage.waitForURL(/\/register\?next=/);
  await guestPage.getByLabel("Nombre").fill("Invitada E2E");
  await guestPage
    .getByLabel("Email")
    .fill(`invitada-${Date.now()}@example.com`);
  await guestPage.getByLabel("Contraseña").fill("planify123");
  await guestPage.getByRole("button", { name: "Crear cuenta" }).click();

  // Vuelve a la invitación y se une
  await guestPage.waitForURL(/\/invite\//);
  await guestPage.getByRole("button", { name: "Unirme al proyecto" }).click();
  await guestPage.waitForURL(/\/projects\/[^/]+$/);
  await expect(
    guestPage.getByRole("heading", { name: "Invitación E2E" }),
  ).toBeVisible();

  await guestContext.close();
});
