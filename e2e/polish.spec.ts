import { expect, test } from "@playwright/test";

import { createProject, registerUser } from "./helpers";

test("el drawer móvil navega y se cierra al elegir una vista", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerUser(page);

  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("dialog", { name: "Abrir menú" })).toBeVisible();

  await page.getByRole("link", { name: "Favoritos" }).click();
  await page.waitForURL(/\/favorites$/);
  await expect(
    page.getByRole("heading", { name: "Favoritos", exact: true }),
  ).toBeVisible();
});

test("la barra lateral se colapsa, se expande y recuerda su estado", async ({
  page,
}) => {
  await registerUser(page);

  const sidebar = page.locator("aside");
  await expect(sidebar).toHaveCSS("width", "256px");

  await page.getByRole("button", { name: "Colapsar menú" }).click();

  await expect(
    page.getByRole("button", { name: "Expandir menú" }),
  ).toBeVisible();
  await expect(sidebar).toHaveCSS("width", "64px");
  // Los enlaces conservan su nombre accesible aunque no muestren el texto.
  await expect(
    sidebar.getByRole("link", { name: "Inicio", exact: true }),
  ).toBeVisible();
  await expect(sidebar.getByText("Inicio", { exact: true })).toHaveCount(0);

  // Los iconos muestran su etiqueta al pasar el ratón.
  const tooltip = (text: string) =>
    page
      .locator('[data-slot="tooltip-content"]')
      .getByText(text, { exact: true });
  await sidebar.getByRole("link", { name: "Inicio", exact: true }).hover();
  await expect(tooltip("Inicio")).toBeVisible();

  // Carpetas y etiquetas siguen accesibles desde menús flotantes.
  const foldersButton = sidebar.getByRole("button", { name: "Carpetas" });
  await foldersButton.hover();
  await expect(tooltip("Carpetas")).toBeVisible();
  await foldersButton.click();
  await expect(
    page.getByRole("menuitem", { name: "Nueva carpeta" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("menuitem", { name: "Nueva carpeta" }),
  ).toBeHidden();

  // La preferencia persiste al recargar.
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expandir menú" }),
  ).toBeVisible();
  await expect(sidebar).toHaveCSS("width", "64px");

  await page.getByRole("button", { name: "Expandir menú" }).click();
  await expect(
    page.getByRole("button", { name: "Colapsar menú" }),
  ).toBeVisible();
  await expect(sidebar).toHaveCSS("width", "256px");
});

test("el atajo N crea una nota dentro del proyecto (docs/08 · 8.6)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Atajos E2E");

  await page.keyboard.press("n");
  await page.waitForURL(/\/documents\/[^/]+$/);
  await expect(page.locator(".tiptap")).toBeVisible();
});

test("Ctrl+K abre el buscador global en un modal", async ({ page }) => {
  await registerUser(page);
  await createProject(page, "Buscador modal E2E");

  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Buscar" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Buscar")).toBeFocused();

  await dialog.getByLabel("Buscar").fill("Buscador modal");
  await expect(dialog.getByText("Buscador modal E2E")).toBeVisible({
    timeout: 10_000,
  });

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("el tema oscuro se elige desde el menú de usuario y persiste", async ({
  page,
}) => {
  await registerUser(page);

  await page.getByRole("button", { name: /Usuario E2E/ }).click();
  await page.getByRole("menuitem", { name: "Tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("una URL inexistente muestra la página 404", async ({ page }) => {
  await registerUser(page);
  await page.goto("/projects/no-existe");
  await expect(
    page.getByRole("heading", { name: "No encontramos esta página" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await page.waitForURL(/\/$/);
});
