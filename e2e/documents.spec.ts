import { expect, test } from "@playwright/test";

import { createDocument, createProject, registerUser } from "./helpers";

test("proyecto + nota con autoguardado, recarga y búsqueda", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Proyecto E2E");

  await createDocument(page, "nota");

  // Escribe y espera el autoguardado (PATCH /content)
  const content = "Contenido E2E de la nota";
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("/content") &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await page.locator(".tiptap").click();
  await page.keyboard.type(content);
  await saved;

  // Al recargar, el contenido persiste
  await page.reload();
  await expect(page.locator(".tiptap")).toContainText(content);

  // La búsqueda global encuentra la nota por su contenido (RF-303)
  await page.goto("/search");
  await page.getByLabel("Buscar").fill("Contenido E2E");
  await expect(page.getByRole("heading", { name: /Notas/ })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("Nota sin título")).toBeVisible();
});

test("crear un diagrama carga Excalidraw", async ({ page }) => {
  await registerUser(page);
  await createProject(page, "Diagramas E2E");

  await createDocument(page, "diagrama");

  await expect(page.locator(".excalidraw canvas").first()).toBeVisible({
    timeout: 30_000,
  });
});
