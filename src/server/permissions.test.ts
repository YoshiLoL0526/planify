import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    projectMember: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { hasRole, requireProjectRole } from "@/server/permissions";

const findUnique = vi.mocked(prisma.projectMember.findUnique);

function membership(role: "OWNER" | "EDITOR" | "VIEWER") {
  return {
    id: "member-1",
    projectId: "project-1",
    userId: "user-1",
    role,
    favorite: false,
    lastOpenedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
}

describe("hasRole", () => {
  it("respeta la jerarquía OWNER > EDITOR > VIEWER", () => {
    expect(hasRole("OWNER", "OWNER")).toBe(true);
    expect(hasRole("OWNER", "EDITOR")).toBe(true);
    expect(hasRole("OWNER", "VIEWER")).toBe(true);
    expect(hasRole("EDITOR", "EDITOR")).toBe(true);
    expect(hasRole("EDITOR", "VIEWER")).toBe(true);
    expect(hasRole("VIEWER", "VIEWER")).toBe(true);
  });

  it("niega los roles insuficientes", () => {
    expect(hasRole("EDITOR", "OWNER")).toBe(false);
    expect(hasRole("VIEWER", "OWNER")).toBe(false);
    expect(hasRole("VIEWER", "EDITOR")).toBe(false);
  });
});

describe("requireProjectRole", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("lanza NOT_FOUND si no hay membresía (no revela el proyecto)", async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      requireProjectRole("user-1", "project-1", "VIEWER"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lanza FORBIDDEN si el rol es insuficiente", async () => {
    findUnique.mockResolvedValue(membership("VIEWER"));

    await expect(
      requireProjectRole("user-1", "project-1", "EDITOR"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("devuelve la membresía cuando el rol alcanza el mínimo", async () => {
    const row = membership("EDITOR");
    findUnique.mockResolvedValue(row);

    await expect(
      requireProjectRole("user-1", "project-1", "EDITOR"),
    ).resolves.toBe(row);
  });
});
