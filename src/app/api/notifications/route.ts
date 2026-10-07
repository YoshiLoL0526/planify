import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/session";
import { AppError, httpStatusFor } from "@/server/errors";
import { listNotifications } from "@/server/services/notifications";

/** Notificaciones con contador de no leídas (RF-902, RF-904). GET /api/notifications */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Inicia sesión." } },
      { status: 401 },
    );
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const result = await listNotifications(session.user.id, params);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: httpStatusFor(error.code) },
      );
    }
    console.error("[api] Error al listar notificaciones:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "No se pudieron cargar las notificaciones.",
        },
      },
      { status: 500 },
    );
  }
}
