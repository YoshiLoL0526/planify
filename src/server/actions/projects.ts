"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import {
  archiveProject,
  createProject,
  deleteProject,
  listProjects,
  setFavorite,
  touchProject,
  unarchiveProject,
  updateProject,
} from "@/server/services/projects";

/** El layout incluye la sidebar (carpetas/etiquetas) y las listas de proyectos. */
function revalidateApp() {
  revalidatePath("/", "layout");
}

export async function createProjectAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await createProject(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function updateProjectAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await updateProject(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function setFavoriteAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await setFavorite(user.id, input);
    revalidateApp();
    return result;
  });
}

export async function archiveProjectAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await archiveProject(user.id, input);
    revalidateApp();
  });
}

export async function unarchiveProjectAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await unarchiveProject(user.id, input);
    revalidateApp();
  });
}

export async function deleteProjectAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await deleteProject(user.id, input);
    revalidateApp();
  });
}

export async function touchProjectAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    await touchProject(user.id, input);
  });
}

export async function loadMoreProjectsAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    return listProjects(user.id, input);
  });
}
