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
  await page.getByRole("textbox", { name: "Buscar" }).fill("Contenido E2E");
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

test("el menú del documento muestra la ruta y permite eliminarlo", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Menú documento E2E");
  await createDocument(page, "nota");

  const breadcrumbs = page.getByRole("navigation", {
    name: "Ruta de navegación",
  });
  await expect(
    breadcrumbs.getByRole("link", { name: "Menú documento E2E" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Acciones del documento" }).click();
  await page.getByRole("menuitem", { name: "Eliminar" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /Eliminar/ })
    .click();

  await page.waitForURL(/\/projects\/[^/]+$/);
  await expect(page.getByText("Nota sin título")).toBeHidden();
});

test("la lista de documentos filtra por tipo y cambia a cuadrícula", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Lista E2E");
  await createDocument(page, "nota");
  await page.getByRole("link", { name: "Lista E2E" }).click();
  await createDocument(page, "diagrama");
  await page.getByRole("link", { name: "Lista E2E" }).click();

  const filters = page.getByRole("group", { name: "Filtrar por tipo" });
  await filters.getByRole("button", { name: /Diagramas/ }).click();
  await expect(
    page.getByRole("link", { name: "Diagrama sin título" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nota sin título" }),
  ).toBeHidden();

  await page.getByRole("button", { name: "Vista de cuadrícula" }).click();
  await expect(
    page.getByRole("button", { name: "Vista de cuadrícula" }),
  ).toHaveAttribute("aria-pressed", "true");

  // La preferencia de vista persiste al recargar.
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Vista de cuadrícula" }),
  ).toHaveAttribute("aria-pressed", "true");
});
