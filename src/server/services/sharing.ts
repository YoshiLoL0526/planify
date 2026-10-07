import { randomBytes } from "node:crypto";

import type { ProjectRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { AppError } from "@/server/errors";
import { requireProjectRole } from "@/server/permissions";
import { parseInput } from "@/server/validators/common";
import {
  addMemberSchema,
  createInvitationSchema,
  invitationActionSchema,
  invitationTokenSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
} from "@/server/validators/sharing";

/** 30 invitaciones/hora por proyecto (docs/09 · 9.5). */
const INVITATION_RATE_LIMIT = 30;
const INVITATION_RATE_WINDOW_MS = 60 * 60 * 1000;

export type MemberListItem = {
  memberId: string;
  userId: string;
  name: string;
  /** Solo visible para el propietario (gestiona altas por email). */
  email: string | null;
  role: ProjectRole;
  joinedAt: string;
  isSelf: boolean;
};

export type InvitationStatus = "pending" | "expired" | "used" | "revoked";

export type InvitationListItem = {
  id: string;
  token: string;
  role: ProjectRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
};

export type InvitationLink = {
  id: string;
  token: string;
  role: ProjectRole;
  expiresAt: string;
};

export type InvitationPreview = {
  status: InvitationStatus | "invalid";
  projectId: string | null;
  projectName: string | null;
  projectDescription: string | null;
  projectArchived: boolean;
  role: ProjectRole | null;
  expiresAt: string | null;
  memberCount: number | null;
  alreadyMember: boolean;
};

type InvitationState = {
  usedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
};

function invitationStatus(invitation: InvitationState): InvitationStatus {
  if (invitation.usedAt) return "used";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt.getTime() <= Date.now()) return "expired";
  return "pending";
}

/** Miembros del proyecto con su rol (RF-806, RF-807). */
export async function listMembers(
  userId: string,
  projectId: string,
): Promise<MemberListItem[]> {
  const membership = await requireProjectRole(userId, projectId, "VIEWER");
  const canSeeEmails = membership.role === "OWNER";

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return members.map((member) => ({
    memberId: member.id,
    userId: member.userId,
    name: member.user.name,
    email: canSeeEmails ? member.user.email : null,
    role: member.role,
    joinedAt: member.createdAt.toISOString(),
    isSelf: member.userId === userId,
  }));
}

/** Comprueba el rate limit de creación de invitaciones (docs/09 · 9.5). */
function assertInvitationRate(projectId: string) {
  if (
    !rateLimit(
      `invitations:${projectId}`,
      INVITATION_RATE_LIMIT,
      INVITATION_RATE_WINDOW_MS,
    )
  ) {
    throw new AppError(
      "RATE_LIMITED",
      "Demasiadas invitaciones seguidas. Espera un momento.",
    );
  }
}

/** Crea el enlace de un solo uso (RF-802). */
async function createInvitationLink(
  userId: string,
  projectId: string,
  role: "EDITOR" | "VIEWER",
  expiresInDays: number,
): Promise<InvitationLink> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: { projectId, role, token, createdById: userId, expiresAt },
    select: { id: true, token: true, role: true, expiresAt: true },
  });

  return {
    id: invitation.id,
    token: invitation.token,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

/**
 * Agregar miembro por email (RF-801, CU-09).
 * Si el email no corresponde a ninguna cuenta, devuelve una invitación
 * por enlace lista para copiar.
 */
export async function addMember(userId: string, input: unknown) {
  const { projectId, email, role } = parseInput(addMemberSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");

  const target = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (!target) {
    assertInvitationRate(projectId);
    const invitation = await createInvitationLink(userId, projectId, role, 7);
    return { kind: "invitation" as const, invitation };
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: target.id } },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("CONFLICT", "Ese usuario ya es miembro del proyecto.");
  }

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.projectMember.create({
      data: { projectId, userId: target.id, role },
      select: { id: true },
    });
    await tx.notification.create({
      data: {
        userId: target.id,
        type: "PROJECT_ADDED",
        payload: { projectId, actorId: userId },
      },
    });
    return created;
  });

  return { kind: "member" as const, memberId: member.id, name: target.name };
}

/** Cambiar el rol de un miembro (RF-806). Solo owner. */
export async function updateMemberRole(userId: string, input: unknown) {
  const { projectId, memberId, role } = parseInput(
    updateMemberRoleSchema,
    input,
  );
  await requireProjectRole(userId, projectId, "OWNER");

  const target = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
    select: { id: true, userId: true, role: true },
  });
  if (!target) {
    throw new AppError("NOT_FOUND", "El miembro no existe.");
  }
  if (target.role === "OWNER") {
    throw new AppError(
      "CONFLICT",
      "No puedes cambiar el rol del propietario del proyecto.",
    );
  }
  if (target.role === role) {
    return { memberId, role };
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.update({
      where: { id: memberId },
      data: { role },
    });
    await tx.notification.create({
      data: {
        userId: target.userId,
        type: "ROLE_CHANGED",
        payload: { projectId, actorId: userId, role },
      },
    });
  });

  return { memberId, role };
}

/** Quitar un miembro (RF-806). El propietario no puede quitarse. */
export async function removeMember(userId: string, input: unknown) {
  const { projectId, memberId } = parseInput(removeMemberSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");

  const target = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
    select: { id: true, role: true },
  });
  if (!target) {
    throw new AppError("NOT_FOUND", "El miembro no existe.");
  }
  if (target.role === "OWNER") {
    throw new AppError(
      "CONFLICT",
      "No puedes quitar al propietario del proyecto.",
    );
  }

  await prisma.projectMember.delete({ where: { id: memberId } });
  return { memberId };
}

/** Crear enlace de invitación (RF-802). Solo owner. */
export async function createInvitation(userId: string, input: unknown) {
  const { projectId, role, expiresInDays } = parseInput(
    createInvitationSchema,
    input,
  );
  await requireProjectRole(userId, projectId, "OWNER");
  assertInvitationRate(projectId);

  return createInvitationLink(userId, projectId, role, expiresInDays);
}

/** Revocar una invitación pendiente (RF-803). */
export async function revokeInvitation(userId: string, input: unknown) {
  const { projectId, invitationId } = parseInput(invitationActionSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, projectId },
    select: { id: true, usedAt: true, revokedAt: true },
  });
  if (!invitation) {
    throw new AppError("NOT_FOUND", "La invitación no existe.");
  }
  if (invitation.usedAt) {
    throw new AppError(
      "CONFLICT",
      "Esta invitación ya se usó; no se puede revocar.",
    );
  }
  if (invitation.revokedAt) {
    return { invitationId };
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { revokedAt: new Date() },
  });
  return { invitationId };
}

/** Regenerar: revoca la anterior y crea otra con la misma duración (RF-803). */
export async function regenerateInvitation(userId: string, input: unknown) {
  const { projectId, invitationId } = parseInput(invitationActionSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");
  assertInvitationRate(projectId);

  const previous = await prisma.invitation.findFirst({
    where: { id: invitationId, projectId },
    select: {
      id: true,
      role: true,
      usedAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });
  if (!previous) {
    throw new AppError("NOT_FOUND", "La invitación no existe.");
  }
  if (previous.usedAt) {
    throw new AppError(
      "CONFLICT",
      "Esta invitación ya se usó; crea una nueva en su lugar.",
    );
  }

  const durationDays = Math.max(
    1,
    Math.round(
      (previous.expiresAt.getTime() - previous.createdAt.getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );

  const invitation = await prisma.$transaction(async (tx) => {
    await tx.invitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    return tx.invitation.create({
      data: {
        projectId,
        role: previous.role === "OWNER" ? "EDITOR" : previous.role,
        token,
        createdById: userId,
        expiresAt,
      },
      select: { id: true, token: true, role: true, expiresAt: true },
    });
  });

  return {
    id: invitation.id,
    token: invitation.token,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

/** Invitaciones del proyecto con su estado (RF-803). Solo owner. */
export async function listInvitations(
  userId: string,
  projectId: string,
): Promise<InvitationListItem[]> {
  const membership = await requireProjectRole(userId, projectId, "VIEWER");
  if (membership.role !== "OWNER") {
    throw new AppError(
      "FORBIDDEN",
      "Solo el propietario puede gestionar las invitaciones.",
    );
  }

  const invitations = await prisma.invitation.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return invitations.map((invitation) => ({
    id: invitation.id,
    token: invitation.token,
    role: invitation.role,
    status: invitationStatus(invitation),
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  }));
}

/**
 * Vista previa de una invitación (RF-805). Pública: no revela más que el
 * nombre/descripción del proyecto y el rol ofrecido.
 */
export async function getInvitationByToken(
  token: string,
  userId?: string,
): Promise<InvitationPreview> {
  const empty: InvitationPreview = {
    status: "invalid",
    projectId: null,
    projectName: null,
    projectDescription: null,
    projectArchived: false,
    role: null,
    expiresAt: null,
    memberCount: null,
    alreadyMember: false,
  };

  const parsed = invitationTokenSchema.safeParse({ token });
  if (!parsed.success) {
    return empty;
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token: parsed.data.token },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          _count: { select: { members: true } },
        },
      },
    },
  });
  if (!invitation) {
    return empty;
  }

  const alreadyMember = userId
    ? Boolean(
        await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invitation.project.id,
              userId,
            },
          },
          select: { id: true },
        }),
      )
    : false;

  return {
    status: invitationStatus(invitation),
    projectId: invitation.project.id,
    projectName: invitation.project.name,
    projectDescription: invitation.project.description,
    projectArchived: invitation.project.status === "ARCHIVED",
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
    memberCount: invitation.project._count.members,
    alreadyMember,
  };
}

/** Aceptar la invitación e incorporarse al proyecto (RF-804, CU-11). */
export async function acceptInvitation(userId: string, input: unknown) {
  const { token } = parseInput(invitationTokenSchema, input);

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      projectId: true,
      role: true,
      usedAt: true,
      revokedAt: true,
      expiresAt: true,
    },
  });
  if (!invitation) {
    throw new AppError("NOT_FOUND", "La invitación no existe o no es válida.");
  }
  if (invitation.revokedAt) {
    throw new AppError("CONFLICT", "Esta invitación fue revocada.");
  }
  if (invitation.usedAt) {
    throw new AppError("CONFLICT", "Esta invitación ya se usó.");
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new AppError("CONFLICT", "Esta invitación ha caducado.");
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invitation.projectId, userId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.invitation.updateMany({
      where: { id: invitation.id, usedAt: null },
      data: { usedAt: new Date(), usedById: userId },
    });
    return { projectId: invitation.projectId, alreadyMember: true };
  }

  await prisma.$transaction(async (tx) => {
    // Consumo atómico: si otra persona la usó entre medias, no hay plaza.
    const consumed = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date(), usedById: userId },
    });
    if (consumed.count === 0) {
      throw new AppError("CONFLICT", "Esta invitación ya no está disponible.");
    }

    await tx.projectMember.create({
      data: {
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
      },
    });
  });

  return { projectId: invitation.projectId, alreadyMember: false };
}
