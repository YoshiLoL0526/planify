import { describe, expect, it } from "vitest";

import { isCommonPassword } from "@/lib/password-policy";

describe("isCommonPassword (RF-101)", () => {
  it("detecta contraseñas comunes sin distinguir mayúsculas", () => {
    expect(isCommonPassword("password")).toBe(true);
    expect(isCommonPassword("Password")).toBe(true);
    expect(isCommonPassword("PASSWORD")).toBe(true);
    expect(isCommonPassword("12345678")).toBe(true);
    expect(isCommonPassword("contraseña")).toBe(true);
    expect(isCommonPassword("qwerty123")).toBe(true);
  });

  it("deja pasar contraseñas que no están en la lista", () => {
    expect(isCommonPassword("planify123")).toBe(false);
    expect(isCommonPassword("Tr3s-Estr3llas!")).toBe(false);
    expect(isCommonPassword("casa-verde-2026")).toBe(false);
  });
});
