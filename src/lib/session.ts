import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppError } from "@/server/errors";

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

/** Usuario actual o error UNAUTHENTICATED (para Server Actions). */
export async function getSessionUser() {
  const session = await getSession();
  if (!session) {
    throw new AppError(
      "UNAUTHENTICATED",
      "Tu sesión ha caducado. Vuelve a iniciar sesión.",
    );
  }
  return session.user;
}
