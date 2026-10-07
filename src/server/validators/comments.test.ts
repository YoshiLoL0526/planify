import { describe, expect, it } from "vitest";

import {
  commentBodySchema,
  listNotificationsSchema,
  listThreadsSchema,
  threadAnchorSchema,
} from "@/server/validators/comments";
import { searchQuerySchema } from "@/server/validators/search";

describe("commentBodySchema", () => {
  it("recorta espacios y exige contenido", () => {
    expect(commentBodySchema.parse("  hola  ")).toBe("hola");
    expect(commentBodySchema.safeParse("   ").success).toBe(false);
  });

  it("limita a 4000 caracteres (RNF-08)", () => {
    expect(commentBodySchema.safeParse("a".repeat(4000)).success).toBe(true);
    expect(commentBodySchema.safeParse("a".repeat(4001)).success).toBe(false);
  });
});

describe("threadAnchorSchema", () => {
  it("acepta nulo (hilo general) y citas de hasta 200 caracteres", () => {
    expect(threadAnchorSchema.parse(null)).toBeNull();
    expect(threadAnchorSchema.parse(undefined)).toBeUndefined();
    expect(
      threadAnchorSchema.parse({ type: "note", quote: "  texto  " }),
    ).toEqual({ type: "note", quote: "texto" });
    expect(
      threadAnchorSchema.safeParse({ type: "note", quote: "x".repeat(201) })
        .success,
    ).toBe(false);
  });
});

describe("listThreadsSchema", () => {
  it("normaliza estados desconocidos a «open»", () => {
    expect(listThreadsSchema.parse({ status: "resolved" })).toEqual({
      status: "resolved",
    });
    expect(listThreadsSchema.parse({ status: "otro" })).toEqual({
      status: "open",
    });
    expect(listThreadsSchema.parse({})).toEqual({ status: "open" });
  });
});

describe("listNotificationsSchema", () => {
  it("convierte el límite y lo acota a 50", () => {
    expect(listNotificationsSchema.parse({ limit: "10" }).limit).toBe(10);
    expect(listNotificationsSchema.parse({}).limit).toBe(20);
    expect(listNotificationsSchema.safeParse({ limit: "51" }).success).toBe(
      false,
    );
  });
});

describe("searchQuerySchema", () => {
  it("exige al menos 2 caracteres y normaliza filtros", () => {
    const parsed = searchQuerySchema.parse({ q: "  cancion  " });
    expect(parsed.q).toBe("cancion");
    expect(parsed.type).toBe("all");
    expect(parsed.status).toBe("all");
    expect(searchQuerySchema.safeParse({ q: "a" }).success).toBe(false);
  });

  it("valores inválidos de tipo/estado caen a «all»", () => {
    const parsed = searchQuerySchema.parse({ q: "web", type: "raro" });
    expect(parsed.type).toBe("all");
  });
});
