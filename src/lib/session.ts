import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/** Sesión actual (o `null`). Para usar en servidor: RSC, layouts y route handlers. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Sesión actual o redirección a `/login`. */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
