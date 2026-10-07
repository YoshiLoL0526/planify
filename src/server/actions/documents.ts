"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import {
  createDocument,
  deleteDocument,
  renameDocument,
} from "@/server/services/documents";

/** El layout incluye la sidebar y los contadores de documentos. */
function revalidateApp() {
  revalidatePath("/", "layout");
}

export async function createDocumentAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await createDocument(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function renameDocumentAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await renameDocument(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function deleteDocumentAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await deleteDocument(user.id, input);
    revalidateApp();
  });
}
