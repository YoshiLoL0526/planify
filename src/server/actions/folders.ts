"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import {
  createFolder,
  deleteFolder,
  renameFolder,
} from "@/server/services/folders";

function revalidateApp() {
  revalidatePath("/", "layout");
}

export async function createFolderAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await createFolder(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function renameFolderAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await renameFolder(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function deleteFolderAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await deleteFolder(user.id, input);
    revalidateApp();
  });
}
