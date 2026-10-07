import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Compartir: miembros e invitaciones (RF-801 a RF-807)
// ─────────────────────────────────────────────────────────────

/** Roles asignables: la propiedad solo se transfiere (RF-808, F2). */
export const assignableRoleSchema = z.enum(["EDITOR", "VIEWER"]);

export const addMemberSchema = z.object({
  projectId: z.string().min(1),
  email: z.email("Escribe un email válido.").max(254),
  role: assignableRoleSchema,
});

export const updateMemberRoleSchema = z.object({
  projectId: z.string().min(1),
  memberId: z.string().min(1),
  role: assignableRoleSchema,
});

export const removeMemberSchema = z.object({
  projectId: z.string().min(1),
  memberId: z.string().min(1),
});

export const invitationExpirySchema = z.union([
  z.literal(1),
  z.literal(7),
  z.literal(30),
]);

export const createInvitationSchema = z.object({
  projectId: z.string().min(1),
  role: assignableRoleSchema,
  expiresInDays: invitationExpirySchema,
});

export const invitationActionSchema = z.object({
  projectId: z.string().min(1),
  invitationId: z.string().min(1),
});

export const invitationTokenSchema = z.object({
  token: z.string().min(16).max(64),
});
