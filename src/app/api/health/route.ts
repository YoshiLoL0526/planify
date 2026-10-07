import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

/**
 * Healthcheck para Docker (docs/07, docs/10).
 * GET /api/health → `{ status, db, version }` (sin autenticación).
 */
export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (error) {
    console.error("[health] Error de base de datos:", error);
  }

  return NextResponse.json(
    { status: db ? "ok" : "error", db, version: APP_VERSION },
    { status: db ? 200 : 503 },
  );
}
