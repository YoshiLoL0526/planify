"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { runAction } from "@/server/errors";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/services/notifications";

export async function markNotificationReadAction(input: unknown) {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await markNotificationRead(user.id, input);
    revalidatePath("/notifications");
    return result;
  });
}

export async function markAllNotificationsReadAction() {
  return runAction(async () => {
    const user = await getSessionUser();
    const result = await markAllNotificationsRead(user.id);
    revalidatePath("/notifications");
    return result;
  });
}
