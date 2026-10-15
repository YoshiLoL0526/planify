import { describe, expect, it } from "vitest";

import { extractPlainText, MAX_CONTENT_TEXT_LENGTH } from "./tiptap-text";

describe("extractPlainText", () => {
  it("extrae texto de párrafos, códigos y bloques de código (RF-506)", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hola" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "usa" },
            { type: "text", text: "npm run check" },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "typescript" },
          content: [{ type: "text", text: "const suma = 1 + 2;" }],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe(
      "Hola usa npm run check const suma = 1 + 2;",
    );
  });

  it("normaliza espacios y saltos de línea", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "codeBlock",
          content: [{ type: "text", text: "linea 1\n  linea 2\tlinea 3" }],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("linea 1 linea 2 linea 3");
  });

  it("ignora valores no válidos y trunca al límite", () => {
    expect(extractPlainText(null)).toBe("");
    expect(extractPlainText("texto")).toBe("");

    const large = "a".repeat(MAX_CONTENT_TEXT_LENGTH + 100);
    expect(
      extractPlainText({
        type: "doc",
        content: [
          { type: "codeBlock", content: [{ type: "text", text: large }] },
        ],
      }),
    ).toHaveLength(MAX_CONTENT_TEXT_LENGTH);
  });
});
