import type { DocumentType, ProjectRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { requireProjectRole } from "@/server/permissions";
import { extractPlainText } from "@/server/tiptap-text";
import { parseInput } from "@/server/validators/common";
import {
  createDocumentSchema,
  documentIdSchema,
  renameDocumentSchema,
  saveDiagramContentSchema,
  saveNoteContentSchema,
} from "@/server/validators/document";

const DEFAULT_TITLES: Record<DocumentType, string> = {
  NOTE: "Nota sin título",
  DIAGRAM: "Diagrama sin título",
};

/** Documento Tiptap vacío (RF-402). */
const EMPTY_NOTE_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Escena Excalidraw vacía; el editor real llega en la fase 1.4. */
const EMPTY_DIAGRAM_SCENE = {
  type: "excalidraw",
  version: 2,
  source: "planify",
  elements: [],
  appState: {},
};

export type DocumentListItem = {
  id: string;
  title: string;
  type: DocumentType;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  /** Miniatura del diagrama (fase 1.4); hoy siempre `null`. */
  thumbnailUrl: string | null;
};

export type DocumentDetail = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  type: DocumentType;
  role: ProjectRole;
  projectStatus: "ACTIVE" | "ARCHIVED";
  authorName: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  /** JSON de Tiptap para notas (fase 1.3); `null` en diagramas. */
  noteContent: unknown | null;
  /** Escena de Excalidraw para diagramas (fase 1.4); `null` en notas. */
  diagramContent: unknown | null;
  /** Miniatura actual del diagrama (RF-604); `null` si no hay. */
  thumbnailFileId: string | null;
};

/** Un proyecto archivado queda congelado hasta desarchivarlo (RF-204). */
async function assertProjectActive(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });
  if (!project) {
    throw new AppError("NOT_FOUND", "El proyecto no existe.");
  }
  if (project.status === "ARCHIVED") {
    throw new AppError(
      "CONFLICT",
      "Este proyecto está archivado. Desarchívalo para poder editarlo.",
    );
  }
}

/** Lista de documentos del proyecto ordenada por actualización (RF-401, RF-408). */
export async function listDocuments(
  userId: string,
  projectId: string,
): Promise<DocumentListItem[]> {
  await requireProjectRole(userId, projectId, "VIEWER");

  const documents = await prisma.document.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      diagram: { select: { thumbnailFileId: true } },
    },
  });

  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    type: document.type,
    authorName: document.createdBy?.name ?? null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    thumbnailUrl: document.diagram?.thumbnailFileId
      ? `/api/files/${document.diagram.thumbnailFileId}`
      : null,
  }));
}

/** Detalle de un documento con el rol del usuario (RF-405). */
export async function getDocumentView(
  userId: string,
  projectId: string,
  documentId: string,
): Promise<DocumentDetail> {
  const membership = await requireProjectRole(userId, projectId, "VIEWER");

  const document = await prisma.document.findFirst({
    where: { id: documentId, projectId },
    include: {
      createdBy: { select: { name: true } },
      project: { select: { id: true, name: true, status: true } },
      note: { select: { contentJson: true } },
      diagram: { select: { sceneJson: true, thumbnailFileId: true } },
    },
  });

  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }

  return {
    id: document.id,
    projectId: document.project.id,
    projectName: document.project.name,
    title: document.title,
    type: document.type,
    role: membership.role,
    projectStatus: document.project.status,
    authorName: document.createdBy?.name ?? null,
    revision: document.revision,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    noteContent: document.note?.contentJson ?? null,
    diagramContent: document.diagram?.sceneJson ?? null,
    thumbnailFileId: document.diagram?.thumbnailFileId ?? null,
  };
}

/** Crear nota o diagrama con título por defecto (RF-402, RF-403). */
export async function createDocument(userId: string, input: unknown) {
  const { projectId, type } = parseInput(createDocumentSchema, input);

  await requireProjectRole(userId, projectId, "EDITOR");
  await assertProjectActive(projectId);

  const document = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        projectId,
        type,
        title: DEFAULT_TITLES[type],
        createdById: userId,
        note:
          type === "NOTE"
            ? { create: { contentJson: EMPTY_NOTE_CONTENT } }
            : undefined,
        diagram:
          type === "DIAGRAM"
            ? { create: { sceneJson: EMPTY_DIAGRAM_SCENE } }
            : undefined,
      },
      select: { id: true },
    });

    // La actividad del documento cuenta como actividad del proyecto.
    await tx.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  return { documentId: document.id };
}

/** Renombrar título (RF-403). */
export async function renameDocument(userId: string, input: unknown) {
  const { documentId, title } = parseInput(renameDocumentSchema, input);

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true },
  });
  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }

  await requireProjectRole(userId, document.projectId, "EDITOR");
  await assertProjectActive(document.projectId);

  await prisma.$transaction([
    prisma.document.update({ where: { id: documentId }, data: { title } }),
    prisma.project.update({
      where: { id: document.projectId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return { documentId };
}

/** Eliminar documento con confirmación en la UI (RF-404). */
export async function deleteDocument(userId: string, input: unknown) {
  const { documentId } = parseInput(documentIdSchema, input);

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true },
  });
  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }

  await requireProjectRole(userId, document.projectId, "EDITOR");
  await assertProjectActive(document.projectId);

  await prisma.$transaction([
    prisma.document.delete({ where: { id: documentId } }),
    prisma.project.update({
      where: { id: document.projectId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

/** Autoguardado de nota con control de revisión (RF-406, RF-407, RF-506). */
export async function saveNoteContent(
  userId: string,
  documentId: string,
  input: unknown,
) {
  const { revision, contentJson } = parseInput(saveNoteContentSchema, input);

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true, type: true, revision: true },
  });
  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }
  if (document.type !== "NOTE") {
    throw new AppError("VALIDATION", "El documento no es una nota.");
  }

  await requireProjectRole(userId, document.projectId, "EDITOR");
  await assertProjectActive(document.projectId);

  const jsonString = JSON.stringify(contentJson);
  if (Buffer.byteLength(jsonString, "utf8") > 2 * 1024 * 1024) {
    throw new AppError("VALIDATION", "La nota es demasiado grande.");
  }
  const contentText = extractPlainText(contentJson);

  return prisma.$transaction(async (tx) => {
    // Actualización condicional por revisión: solo gana un guardado por revisión.
    const updated = await tx.document.updateMany({
      where: { id: documentId, revision },
      data: { revision: { increment: 1 } },
    });

    if (updated.count === 0) {
      const current = await tx.document.findUnique({
        where: { id: documentId },
        select: { revision: true, updatedAt: true },
      });
      throw new AppError(
        "CONFLICT",
        "Otra persona guardó cambios en este documento.",
        {
          currentRevision: current?.revision ?? document.revision,
          updatedAt: current?.updatedAt.toISOString() ?? null,
        },
      );
    }

    await tx.note.update({
      where: { documentId },
      data: { contentJson: contentJson as Prisma.InputJsonValue, contentText },
    });
    await tx.project.update({
      where: { id: document.projectId },
      data: { updatedAt: new Date() },
    });

    const result = await tx.document.findUnique({
      where: { id: documentId },
      select: { revision: true, updatedAt: true },
    });

    return {
      revision: result?.revision ?? revision + 1,
      updatedAt: result?.updatedAt.toISOString() ?? new Date().toISOString(),
    };
  });
}

const MAX_DIAGRAM_BYTES = 10 * 1024 * 1024;

/** Autoguardado de diagrama con assets externos y miniatura (RF-602 a RF-604). */
export async function saveDiagramScene(
  userId: string,
  documentId: string,
  input: unknown,
) {
  const { revision, scene, assets, thumbnailFileId } = parseInput(
    saveDiagramContentSchema,
    input,
  );

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true, type: true, revision: true },
  });
  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }
  if (document.type !== "DIAGRAM") {
    throw new AppError("VALIDATION", "El documento no es un diagrama.");
  }

  await requireProjectRole(userId, document.projectId, "EDITOR");
  await assertProjectActive(document.projectId);

  const assetMap = assets ?? {};
  const sceneJson = {
    type: "excalidraw",
    version: 2,
    source: "planify",
    elements: scene.elements,
    appState: scene.appState ?? {},
    assets: assetMap,
  };

  const jsonString = JSON.stringify(sceneJson);
  if (Buffer.byteLength(jsonString, "utf8") > MAX_DIAGRAM_BYTES) {
    throw new AppError("VALIDATION", "El diagrama es demasiado grande.");
  }

  const assetIds = [...new Set(Object.values(assetMap))];
  if (assetIds.length > 0) {
    const found = await prisma.fileAsset.count({
      where: { id: { in: assetIds }, projectId: document.projectId },
    });
    if (found !== assetIds.length) {
      throw new AppError("VALIDATION", "Algún archivo del diagrama no existe.");
    }
  }

  if (thumbnailFileId) {
    const thumbnail = await prisma.fileAsset.findFirst({
      where: {
        id: thumbnailFileId,
        projectId: document.projectId,
        kind: "THUMBNAIL",
      },
      select: { id: true },
    });
    if (!thumbnail) {
      throw new AppError("VALIDATION", "La miniatura no existe.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.document.updateMany({
      where: { id: documentId, revision },
      data: { revision: { increment: 1 } },
    });

    if (updated.count === 0) {
      const current = await tx.document.findUnique({
        where: { id: documentId },
        select: { revision: true, updatedAt: true },
      });
      throw new AppError(
        "CONFLICT",
        "Otra persona guardó cambios en este documento.",
        {
          currentRevision: current?.revision ?? document.revision,
          updatedAt: current?.updatedAt.toISOString() ?? null,
        },
      );
    }

    await tx.diagram.update({
      where: { documentId },
      data: {
        sceneJson: sceneJson as Prisma.InputJsonValue,
        ...(thumbnailFileId !== undefined ? { thumbnailFileId } : {}),
      },
    });
    await tx.project.update({
      where: { id: document.projectId },
      data: { updatedAt: new Date() },
    });

    const result = await tx.document.findUnique({
      where: { id: documentId },
      select: { revision: true, updatedAt: true },
    });

    return {
      revision: result?.revision ?? revision + 1,
      updatedAt: result?.updatedAt.toISOString() ?? new Date().toISOString(),
    };
  });
}

/** Despacha el autoguardado según el tipo de documento. */
export async function saveDocumentContent(
  userId: string,
  documentId: string,
  input: unknown,
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { type: true },
  });
  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }

  if (document.type === "NOTE") {
    return saveNoteContent(userId, documentId, input);
  }
  return saveDiagramScene(userId, documentId, input);
}
