import { NextResponse, type NextRequest } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { AppError, httpStatusFor } from "@/server/errors";
import { searchAll } from "@/server/services/search";

/** Búsqueda global agrupada (RF-303 a RF-306). GET /api/search */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Inicia sesión." } },
      { status: 401 },
    );
  }

  if (!rateLimit(`search:${session.user.id}`, 120, 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Demasiadas búsquedas seguidas. Espera un momento.",
        },
      },
      { status: 429 },
    );
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const results = await searchAll(session.user.id, params);
    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: httpStatusFor(error.code) },
      );
    }
    console.error("[api] Error en la búsqueda:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "No se pudo buscar. Inténtalo de nuevo.",
        },
      },
      { status: 500 },
    );
  }
}
