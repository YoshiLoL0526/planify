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

test("el atajo N crea una nota dentro del proyecto (docs/08 · 8.6)", async ({
  page,
}) => {
  await registerUser(page);
  await createProject(page, "Atajos E2E");

  await page.keyboard.press("n");
  await page.waitForURL(/\/documents\/[^/]+$/);
  await expect(page.locator(".tiptap")).toBeVisible();
});
