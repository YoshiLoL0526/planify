import { describe, expect, it } from "vitest";
import { verifyPassword } from "better-auth/crypto";

import { hashPassword } from "./reset-password.mjs";

/**
 * El script de reset administrativo (RF-105) debe generar hashes que
 * better-auth pueda verificar; si no, el login fallaría tras el reset.
 */
describe("scripts/reset-password", () => {
  it("genera hashes compatibles con better-auth", async () => {
    const hash = await hashPassword("ClaveDePrueba123");

    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    await expect(
      verifyPassword({ hash, password: "ClaveDePrueba123" }),
    ).resolves.toBe(true);
    await expect(
      verifyPassword({ hash, password: "OtraClaveDistinta" }),
    ).resolves.toBe(false);
  });

  it("aplica la normalización NFKC igual que better-auth", async () => {
    // «contraseña» en NFD (e + combining tilde) debe verificar el hash en NFC.
    const nfd = "contrase\u006E\u0303a";
    const nfc = nfd.normalize("NFC");

    const hash = await hashPassword(nfd);
    await expect(verifyPassword({ hash, password: nfc })).resolves.toBe(true);
  });
});
