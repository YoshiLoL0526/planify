import { expect, test } from "@playwright/test";

import { registerUser } from "./helpers";

test("perfil: cambiar nombre, email y contraseña (RF-104, RF-1001)", async ({
  page,
}) => {
  await registerUser(page, "Perfil E2E");

  await page.goto("/settings/profile");
  await expect(
    page.getByRole("heading", { name: "Perfil y ajustes" }),
  ).toBeVisible();

  // Nombre
  await page.getByLabel("Nombre", { exact: true }).fill("Nombre Cambiado");
  await page.getByRole("button", { name: "Guardar nombre" }).click();
  await expect(page.getByText("Nombre actualizado.")).toBeVisible();

  // Email
  const newEmail = `perfil-${Date.now()}@example.com`;
  await page.getByLabel("Email").fill(newEmail);
  await page.getByRole("button", { name: "Cambiar email" }).click();
  await expect(
    page.getByText("Email actualizado", { exact: false }),
  ).toBeVisible();

  // Contraseña
  await page.getByLabel("Contraseña actual").fill("planify123");
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("ClaveNueva123");
  await page.getByLabel("Repite la nueva contraseña").fill("ClaveNueva123");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("Contraseña actualizada.")).toBeVisible();

  // Cerrar sesión y entrar con las credenciales nuevas
  await page.getByRole("button", { name: /Nombre Cambiado/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await page.waitForURL(/\/login$/);

  await page.getByLabel("Email").fill(newEmail);
  await page.getByLabel("Contraseña").fill("ClaveNueva123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/$/);
});

test("las contraseñas nuevas no pueden coincidir mal ni ser comunes", async ({
  page,
}) => {
  await registerUser(page, "Clave E2E");
  await page.goto("/settings/profile");

  await page.getByLabel("Contraseña actual").fill("planify123");
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("ClaveDistinta123");
  await page.getByLabel("Repite la nueva contraseña").fill("OtraClave456");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(
    page.getByText("Las contraseñas nuevas no coinciden."),
  ).toBeVisible();

  await page.getByLabel("Nueva contraseña", { exact: true }).fill("password");
  await page.getByLabel("Repite la nueva contraseña").fill("password");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(
    page.getByText("Esa contraseña es demasiado común. Elige una menos obvia."),
  ).toBeVisible();

  // El servidor también la rechaza aunque el aviso del cliente se saltara.
  const response = await page.request.post("/api/auth/change-password", {
    headers: { Origin: new URL(page.url()).origin },
    data: { currentPassword: "planify123", newPassword: "password" },
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { code?: string };
  expect(body.code).toBe("WEAK_PASSWORD");
});
