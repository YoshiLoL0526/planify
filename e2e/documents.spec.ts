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

test("bloques de código: crear, guardar con lenguaje y buscar (RF-507)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Código E2E");
  await createDocument(page, "nota");

  // Crea el bloque desde la barra y elige el lenguaje.
  await page.locator(".tiptap").click();
  await page.getByRole("button", { name: "Bloque de código" }).click();
  await page.getByRole("combobox", { name: "Lenguaje del bloque" }).click();
  await page.getByRole("option", { name: "TypeScript" }).click();

  const code = "const suma = (a: number, b: number) => a + b;";
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("/content") &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await page.locator(".tiptap pre").click();
  await page.keyboard.type(code);
  await saved;

  // Persiste al recargar, con el lenguaje elegido.
  await page.reload();
  const block = page.locator(".tiptap pre code");
  await expect(block).toContainText(code);
  await expect(block).toHaveClass(/language-typescript/);

  // La búsqueda global también indexa el texto del bloque (RF-506).
  await page.goto("/search");
  await page.getByRole("textbox", { name: "Buscar" }).fill("suma");
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

test("carpetas del proyecto: crear, documento dentro, mover y eliminar (RF-301)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Carpetas E2E");

  // Crear una carpeta desde la página del proyecto.
  await page.getByRole("button", { name: "Nueva carpeta" }).click();
  await page.getByLabel("Nombre de la carpeta").fill("Diseño");
  await page.getByRole("button", { name: "Crear carpeta" }).click();
  await expect(
    page.getByRole("link", { name: "Diseño", exact: true }),
  ).toBeVisible();

  // Entrar en la carpeta y crear una nota dentro.
  await page.getByRole("link", { name: "Diseño", exact: true }).click();
  await page.waitForURL(/\/folders\/[^/]+$/);
  await page.getByRole("button", { name: "Nuevo documento" }).first().click();
  await page.getByRole("menuitem", { name: "Nueva nota" }).click();
  await page.waitForURL(/\/documents\/[^/]+$/);

  // La ruta muestra proyecto › carpeta › documento.
  const breadcrumbs = page.getByRole("navigation", {
    name: "Ruta de navegación",
  });
  await expect(breadcrumbs.getByRole("link", { name: "Diseño" })).toBeVisible();

  // Mover la nota a la raíz desde el menú del documento.
  await page.getByRole("button", { name: "Acciones del documento" }).click();
  await page.getByRole("menuitem", { name: "Mover a carpeta" }).click();
  await page.getByRole("combobox", { name: "Carpeta de destino" }).click();
  await page.getByRole("option", { name: "Raíz del proyecto" }).click();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(breadcrumbs.getByRole("link", { name: "Diseño" })).toBeHidden();

  // Eliminar la carpeta vacía desde su página.
  await breadcrumbs.getByRole("link", { name: "Carpetas E2E" }).click();
  await page.waitForURL(/\/projects\/[^/]+$/);
  await page.getByRole("link", { name: "Diseño", exact: true }).click();
  await page.waitForURL(/\/folders\/[^/]+$/);
  await page.getByRole("button", { name: "Acciones" }).click();
  await page.getByRole("menuitem", { name: "Eliminar" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Eliminar" })
    .click();

  // De vuelta en el proyecto: la carpeta desaparece y la nota queda en la raíz.
  await page.waitForURL(/\/projects\/[^/]+$/);
  await expect(
    page.getByRole("link", { name: "Diseño", exact: true }),
  ).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Nota sin título" }),
  ).toBeVisible();
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
