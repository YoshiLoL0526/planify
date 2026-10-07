import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { AppError, httpStatusFor } from "@/server/errors";
import { saveDocumentContent } from "@/server/services/documents";

/** Autoguardado de documentos (RF-406, RF-407, RF-602, RF-603). PATCH /api/documents/{id}/content */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
        },
      },
      { status: 401 },
    );
  }

  const { documentId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "Cuerpo de la petición inválido.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await saveDocumentContent(session.user.id, documentId, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details ?? {},
          },
        },
        { status: httpStatusFor(error.code) },
      );
    }
    console.error("[api] Error al guardar la nota:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "No se pudo guardar la nota. Inténtalo de nuevo.",
        },
      },
      { status: 500 },
    );
  }
}
