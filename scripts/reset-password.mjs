#!/usr/bin/env node
/**
 * Reset administrativo de contraseña (RF-105, docs/09 · 9.10).
 *
 * Solicita el email de la cuenta y la nueva contraseña por consola y actualiza
 * `account.password` con el mismo algoritmo que usa better-auth (scrypt con
 * formato `salt:hash`). Pensado para el administrador del servidor:
 *
 *   docker compose exec app node scripts/reset-password.mjs
 *   # Desarrollo local:
 *   npm run db:reset-password
 *   # (equivale a: node --env-file=.env scripts/reset-password.mjs)
 *
 * Requiere acceso a la máquina/contenedores: por eso solo puede hacerlo quien
 * administra el despliegue.
 */
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { argv, exit, stdin, stdout } from "node:process";
import { pathToFileURL } from "node:url";

import pg from "pg";

/** Mismos parámetros que better-auth (@better-auth/utils/password, variante Node). */
const SCRYPT = { N: 16384, r: 16, p: 1, dkLen: 64 };
const MIN_PASSWORD_LENGTH = 8;

function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      SCRYPT.dkLen,
      {
        N: SCRYPT.N,
        r: SCRYPT.r,
        p: SCRYPT.p,
        maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** Hash en el formato `salt:hash` que verifica better-auth. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await generateKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}

let readline = null;
let pipedLines = null;

function getReadline() {
  readline ??= createInterface({ input: stdin, output: stdout });
  return readline;
}

/** Con entrada por tubería no hay TTY: se leen todas las líneas de una vez. */
async function nextPipedLine() {
  pipedLines ??= await new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolve(data.split(/\r?\n/)));
    stdin.on("error", reject);
    stdin.resume();
  });
  return pipedLines.shift() ?? "";
}

async function ask(question) {
  stdout.write(question);
  if (!stdin.isTTY) {
    const answer = await nextPipedLine();
    stdout.write("\n");
    return answer.trim();
  }
  const answer = await getReadline().question("");
  return answer.trim();
}

/** Pide un texto sin mostrarlo por pantalla (si hay terminal interactiva). */
async function askHidden(question) {
  stdout.write(question);
  if (!stdin.isTTY) {
    // Entrada por tubería (automatización): sin máscara.
    const answer = await nextPipedLine();
    stdout.write("\n");
    return answer.trim();
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          finish();
          reject(new Error("Cancelado."));
          return;
        }
        if (char === "\b" || char === "\u007f") {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= " ") value += char;
      }
    };
    const finish = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function readNewPassword() {
  const first = await askHidden(
    `Nueva contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres): `,
  );
  if (first.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  const second = await askHidden("Repite la nueva contraseña: ");
  if (first !== second) {
    throw new Error("Las contraseñas no coinciden.");
  }
  return first;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "Falta DATABASE_URL. En el contenedor llega desde .env; en local usa " +
        "`npm run db:reset-password` o `node --env-file=.env scripts/reset-password.mjs`.",
    );
  }

  const email = (await ask("Email de la cuenta: ")).toLowerCase();
  if (!email) {
    throw new Error("El email es obligatorio.");
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const userResult = await client.query(
      'SELECT id, email FROM "user" WHERE lower(email) = $1',
      [email],
    );
    if (userResult.rowCount === 0) {
      throw new Error(`No existe ninguna cuenta con el email «${email}».`);
    }
    const user = userResult.rows[0];

    const accountResult = await client.query(
      "SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential'",
      [user.id],
    );
    if (accountResult.rowCount === 0) {
      throw new Error(
        "Esa cuenta no tiene contraseña local (no hay credencial «credential»).",
      );
    }

    const password = await readNewPassword();
    const hash = await hashPassword(password);
    await client.query(
      "UPDATE account SET password = $1, updated_at = now() WHERE id = $2",
      [hash, accountResult.rows[0].id],
    );

    console.log(`Contraseña actualizada para ${user.email}.`);
  } finally {
    await client.end();
    readline?.close();
  }
}

const isMain = argv[1] && import.meta.url === pathToFileURL(argv[1]).href;
if (isMain) {
  main().catch((error) => {
    readline?.close();
    console.error(`\nError: ${error?.message ?? error}`);
    exit(1);
  });
}
