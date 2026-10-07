"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import { createTag, deleteTag, renameTag } from "@/server/services/tags";

function revalidateApp() {
  revalidatePath("/", "layout");
}

export async function createTagAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await createTag(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function renameTagAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await renameTag(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function deleteTagAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await deleteTag(user.id, input);
    revalidateApp();
  });
}
