import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

/**
 * Configuración de better-auth (email + contraseña, sin verificación por email).
 * Ver docs/09-seguridad-y-permisos.md.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Cerrar el registro con REGISTRATION_OPEN=false (docs/09 · 9.8)
    disableSignUp: process.env.REGISTRATION_OPEN === "false",
  },
  session: {
    // Sesión de 30 días con renovación diaria (RNF-08)
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  // nextCookies debe ser el último plugin: permite fijar cookies desde server actions.
  plugins: [nextCookies()],
});
