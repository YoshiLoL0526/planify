import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readUpload } from "@/lib/storage";
import { requireProjectRole } from "@/server/permissions";

/** Sirve un archivo a los miembros del proyecto (RF-503, RF-504). GET /api/files/{id} */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const { fileId } = await params;

  const asset = await prisma.fileAsset.findUnique({
    where: { id: fileId },
  });
  if (!asset) {
    return new Response("No encontrado", { status: 404 });
  }

  try {
    await requireProjectRole(session.user.id, asset.projectId, "VIEWER");
  } catch {
    // No revelar la existencia del archivo a quien no es miembro.
    return new Response("No encontrado", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readUpload(asset.storageKey);
  } catch {
    return new Response("No encontrado", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": asset.mimeType,
    "Content-Length": String(buffer.length),
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });

  if (asset.kind !== "IMAGE") {
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
    );
  }

  return new Response(new Uint8Array(buffer), { headers });
}
