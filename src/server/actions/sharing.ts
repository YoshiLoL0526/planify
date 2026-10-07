"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import {
  acceptInvitation,
  addMember,
  createInvitation,
  regenerateInvitation,
  removeMember,
  revokeInvitation,
  updateMemberRole,
} from "@/server/services/sharing";

/** La membresía afecta a la sidebar, a la cabecera del proyecto y a la configuración. */
function revalidateSharing() {
  revalidatePath("/", "layout");
}

export async function addMemberAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await addMember(user.id, input);
    revalidateSharing();
    return result;
  });
}

export async function updateMemberRoleAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await updateMemberRole(user.id, input);
    revalidateSharing();
    return result;
  });
}

export async function removeMemberAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await removeMember(user.id, input);
    revalidateSharing();
    return result;
  });
}

export async function createInvitationAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await createInvitation(user.id, input);
    revalidateSharing();
    return result;
  });
}

export async function revokeInvitationAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await revokeInvitation(user.id, input);
    revalidateSharing();
    return result;
  });
}

export async function regenerateInvitationAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await regenerateInvitation(user.id, input);
    revalidateSharing();
    return result;
  });
}

export async function acceptInvitationAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await acceptInvitation(user.id, input);
    revalidateSharing();
    return result;
  });
}
