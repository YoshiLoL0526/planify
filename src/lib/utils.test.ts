import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/utils";

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/projects/abc")).toBe("/projects/abc");
    expect(safeNextPath("/invite/token?x=1")).toBe("/invite/token?x=1");
  });

  it("rechaza URLs externas y protocol-relative (open redirect)", () => {
    expect(safeNextPath("https://evil.example.com")).toBe("/");
    expect(safeNextPath("//evil.example.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
  });

  it("cae a la raíz sin valor", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });
});
