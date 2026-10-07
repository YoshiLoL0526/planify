import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { prisma } from "@/lib/prisma";

/**
 * Vista previa de enlaces (RF-505) con protección SSRF (docs/09 · 9.4).
 * Nota MVP: `imageKey` guarda la URL remota de la imagen (no se descarga).
 */

export type LinkPreviewData = {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  image: string | null;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días
const FETCH_TIMEOUT_MS = 5_000;
const MAX_HTML_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip: string): boolean {
  let address = ip;
  if (address.toLowerCase().startsWith("::ffff:")) {
    address = address.slice(7);
  }

  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80")
    );
  }

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }
  const [a = -1, b = -1] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Solo se permiten enlaces http o https.");
  }
  if (!url.hostname) {
    throw new Error("La URL no es válida.");
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (
    addresses.length === 0 ||
    addresses.some((entry) => isPrivateIp(entry.address))
  ) {
    throw new Error("Ese enlace no es accesible públicamente.");
  }
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
      if (total >= MAX_HTML_BYTES) {
        await reader.cancel();
        break;
      }
    }
  }

  return Buffer.concat(chunks).toString("utf8");
}

/** Descarga el HTML siguiendo redirecciones manualmente (cada salto se valida). */
async function fetchHtml(
  url: string,
): Promise<{ html: string; finalUrl: string }> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(current);
    await assertPublicUrl(parsed);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "PlanifyBot/0.1 (+aplicación self-hosted)",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("El enlace redirige a una dirección no válida.");
      }
      current = new URL(location, current).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error("El enlace no respondió correctamente.");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error("El enlace no es una página web.");
    }

    return { html: await readCapped(response), finalUrl: current };
  }

  throw new Error("El enlace tiene demasiadas redirecciones.");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

function findMeta(html: string, key: string): string | null {
  const metaTags = html.match(/<meta\s[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const property = /(?:property|name)=["']([^"']+)["']/i
      .exec(tag)?.[1]
      ?.toLowerCase();
    if (property !== key) continue;
    const content = /content=["']([^"']*)["']/i.exec(tag)?.[1];
    if (content) {
      return decodeEntities(content.trim());
    }
  }
  return null;
}

function parseHtml(
  html: string,
  baseUrl: string,
): Omit<LinkPreviewData, "url"> {
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const rawImage = findMeta(html, "og:image");
  const hostname = new URL(baseUrl).hostname.replace(/^www\./, "");

  let image: string | null = null;
  if (rawImage) {
    try {
      image = new URL(rawImage, baseUrl).toString();
    } catch {
      image = null;
    }
  }

  return {
    title:
      findMeta(html, "og:title") ??
      (titleTag ? decodeEntities(titleTag.trim()) : null),
    description:
      findMeta(html, "og:description") ?? findMeta(html, "description"),
    siteName: findMeta(html, "og:site_name") ?? hostname,
    image,
  };
}

function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl.trim());
  url.hash = "";
  return url.toString();
}

export async function getLinkPreview(rawUrl: string): Promise<LinkPreviewData> {
  const url = normalizeUrl(rawUrl);
  const urlHash = createHash("sha256").update(url).digest("hex");

  const cached = await prisma.linkPreview.findUnique({ where: { urlHash } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return {
      url: cached.url,
      title: cached.title,
      description: cached.description,
      siteName: cached.siteName,
      image: cached.imageKey,
    };
  }

  const { html, finalUrl } = await fetchHtml(url);
  const parsed = parseHtml(html, finalUrl);
  const data: LinkPreviewData = { url: finalUrl, ...parsed };

  await prisma.linkPreview.upsert({
    where: { urlHash },
    create: {
      urlHash,
      url: data.url,
      title: data.title,
      description: data.description,
      siteName: data.siteName,
      imageKey: data.image,
    },
    update: {
      url: data.url,
      title: data.title,
      description: data.description,
      siteName: data.siteName,
      imageKey: data.image,
      fetchedAt: new Date(),
    },
  });

  return data;
}
