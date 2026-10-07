import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  isAllowedMimeType,
  saveUpload,
} from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { AppError, httpStatusFor } from "@/server/errors";
import { requireProjectRole } from "@/server/permissions";

/** Subida de archivos (RF-503, RF-504). POST /api/files */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Inicia sesión." } },
      { status: 401 },
    );
  }

  if (!rateLimit(`files:${session.user.id}`, 30, 60_000)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Demasiadas subidas seguidas. Espera un momento.",
        },
      },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Formulario inválido." } },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const projectId = formData.get("projectId");
  const kind = formData.get("kind");

  if (!(file instanceof File) || typeof projectId !== "string") {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Faltan datos de la subida." } },
      { status: 400 },
    );
  }
  if (kind !== "IMAGE" && kind !== "ATTACHMENT" && kind !== "THUMBNAIL") {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Tipo de subida no válido." } },
      { status: 400 },
    );
  }

  if (kind === "THUMBNAIL" && file.type !== "image/png") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "La miniatura debe ser un PNG.",
        },
      },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "El archivo está vacío." } },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: `El archivo supera el límite de ${MAX_UPLOAD_MB} MB.`,
        },
      },
      { status: 413 },
    );
  }
  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "Tipo de archivo no permitido.",
        },
      },
      { status: 400 },
    );
  }

  try {
    await requireProjectRole(session.user.id, projectId, "EDITOR");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });
    if (!project || project.status !== "ACTIVE") {
      throw new AppError(
        "CONFLICT",
        "Este proyecto está archivado. Desarchívalo para poder editarlo.",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await saveUpload(buffer, file.type);

    const asset = await prisma.fileAsset.create({
      data: {
        projectId,
        uploaderId: session.user.id,
        kind,
        mimeType: file.type,
        sizeBytes: file.size,
        originalName: file.name.slice(0, 255),
        storageKey,
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        id: asset.id,
        url: `/api/files/${asset.id}`,
        mimeType: file.type,
        sizeBytes: file.size,
        originalName: file.name,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: httpStatusFor(error.code) },
      );
    }
    console.error("[api] Error al subir archivo:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "No se pudo subir el archivo. Inténtalo de nuevo.",
        },
      },
      { status: 500 },
    );
  }
}
