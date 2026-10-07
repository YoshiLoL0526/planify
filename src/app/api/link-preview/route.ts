import { NextResponse } from "next/server";

import { getLinkPreview } from "@/lib/link-preview";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

/** Vista previa de enlaces (RF-505). GET /api/link-preview?url=… */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Inicia sesión." } },
      { status: 401 },
    );
  }

  if (!rateLimit(`link-preview:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Demasiadas vistas previas seguidas. Espera un momento.",
        },
      },
      { status: 429 },
    );
  }

  const rawUrl = new URL(request.url).searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Falta la URL." } },
      { status: 400 },
    );
  }

  try {
    const data = await getLinkPreview(rawUrl);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo obtener la vista previa.";
    return NextResponse.json(
      { error: { code: "PREVIEW_FAILED", message } },
      { status: 422 },
    );
  }
}
