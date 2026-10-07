"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import {
  createThread,
  deleteComment,
  deleteThread,
  editComment,
  replyToThread,
  setThreadStatus,
} from "@/server/services/comments";

/** La página del documento muestra el contador de hilos abiertos. */
function revalidateDocument(projectId: string, documentId: string) {
  revalidatePath(`/projects/${projectId}/documents/${documentId}`);
}

export async function createThreadAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await createThread(user.id, input);
    revalidateDocument(result.projectId, result.documentId);
    return result;
  });
}

export async function replyToThreadAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await replyToThread(user.id, input);
    revalidateDocument(result.projectId, result.documentId);
    return result;
  });
}

export async function editCommentAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await editComment(user.id, input);
    revalidateDocument(result.projectId, result.documentId);
    return result;
  });
}

export async function deleteCommentAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await deleteComment(user.id, input);
    revalidateDocument(result.projectId, result.documentId);
    return result;
  });
}

export async function setThreadStatusAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await setThreadStatus(user.id, input);
    revalidateDocument(result.projectId, result.documentId);
    return result;
  });
}

export async function deleteThreadAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await deleteThread(user.id, input);
    revalidateDocument(result.projectId, result.documentId);
    return result;
  });
}
