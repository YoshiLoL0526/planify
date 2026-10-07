import type { ProjectRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";

const ROLE_LEVEL: Record<ProjectRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

export function hasRole(role: ProjectRole, minRole: ProjectRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

/**
 * Devuelve la membresía del usuario exigiendo un rol mínimo.
 * - Sin membresía → NOT_FOUND (no se revela la existencia del proyecto).
 * - Rol insuficiente → FORBIDDEN.
 */
export async function requireProjectRole(
  userId: string,
  projectId: string,
  minRole: ProjectRole,
) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!membership) {
    throw new AppError(
      "NOT_FOUND",
      "El proyecto no existe o no tienes acceso.",
    );
  }
  if (!hasRole(membership.role, minRole)) {
    throw new AppError("FORBIDDEN", "No tienes permiso para esta acción.");
  }
  return membership;
}
