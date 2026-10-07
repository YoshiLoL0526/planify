import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? "20");
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Whitelist de tipos permitidos (RF-503, RF-504). SVG bloqueado por riesgo XSS. */
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "md",
  "application/json": "json",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType in MIME_EXTENSIONS;
}

function extensionFor(mimeType: string): string {
  return MIME_EXTENSIONS[mimeType] ?? "bin";
}

function resolveStoragePath(storageKey: string): string {
  const root = path.resolve(UPLOAD_DIR);
  const full = path.resolve(root, storageKey);
  // Defensa contra traversal: el archivo debe quedar dentro del volumen.
  if (!full.startsWith(root + path.sep)) {
    throw new Error("Ruta de almacenamiento inválida.");
  }
  return full;
}

/** Guarda el binario en el volumen y devuelve su `storageKey` (UUID + extensión). */
export async function saveUpload(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  await mkdir(path.resolve(UPLOAD_DIR), { recursive: true });
  const storageKey = `${randomUUID()}.${extensionFor(mimeType)}`;
  await writeFile(resolveStoragePath(storageKey), buffer);
  return storageKey;
}

export async function readUpload(storageKey: string): Promise<Buffer> {
  return readFile(resolveStoragePath(storageKey));
}

export async function deleteUpload(storageKey: string): Promise<void> {
  try {
    await unlink(resolveStoragePath(storageKey));
  } catch {
    // El archivo ya no existe: nada que hacer.
  }
}
