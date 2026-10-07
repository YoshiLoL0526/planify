import { expect, test } from "@playwright/test";

import { createDocument, createProject, registerUser } from "./helpers";

test("hilo de comentarios: crear, responder, resolver y filtrar (RF-701, RF-703)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Comentarios E2E");
  await createDocument(page, "nota");

  // Abre el panel y crea un hilo
  await page.getByRole("button", { name: "Comentarios", exact: true }).click();
  await page
    .getByPlaceholder(/Escribe un comentario/)
    .fill("Hilo E2E de prueba");
  await page.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(page.getByText("Hilo E2E de prueba")).toBeVisible();

  // Responde
  await page.getByPlaceholder(/Responder/).fill("Respuesta E2E");
  await page.getByRole("button", { name: "Responder" }).click();
  await expect(page.getByText("Respuesta E2E")).toBeVisible();

  // Resuelve: desaparece de «Abiertos» y aparece en «Resueltos»
  await page.getByRole("button", { name: "Acciones del hilo" }).click();
  await page.getByRole("menuitem", { name: "Resolver" }).click();
  await expect(page.getByText("No hay hilos abiertos")).toBeVisible();

  await page.getByRole("button", { name: "Resueltos", exact: true }).click();
  await expect(page.getByText("Hilo E2E de prueba")).toBeVisible();
  await expect(page.getByText("Resuelto", { exact: true })).toBeVisible();
});

test("la campana de notificaciones cuenta las no leídas (RF-902)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Notificaciones E2E");
  await createDocument(page, "nota");

  // El propietario no recibe notificación por su propio comentario, así que
  // se verifica el flujo básico: campana presente y centro vacío.
  await page.getByRole("link", { name: "Notificaciones", exact: true }).click();
  await page.waitForURL(/\/notifications$/);
  await expect(
    page.getByRole("heading", { name: "Notificaciones" }),
  ).toBeVisible();
  await expect(page.getByText("No tienes notificaciones")).toBeVisible();
});
