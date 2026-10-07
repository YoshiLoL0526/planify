import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/session";
import { AppError, httpStatusFor } from "@/server/errors";
import { listThreads } from "@/server/services/comments";

/** Hilos de comentarios del documento (RF-705). GET /api/documents/{id}/threads */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Inicia sesión." } },
      { status: 401 },
    );
  }

  const { documentId } = await params;
  const status = request.nextUrl.searchParams.get("status") ?? "open";

  try {
    const threads = await listThreads(session.user.id, documentId, { status });
    return NextResponse.json({ threads });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: httpStatusFor(error.code) },
      );
    }
    console.error("[api] Error al listar hilos:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "No se pudieron cargar los comentarios.",
        },
      },
      { status: 500 },
    );
  }
}
