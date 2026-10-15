import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { isCommonPassword } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { texts } from "@/lib/texts";

/** Extrae la contraseña nueva de las peticiones que la traen (RF-101). */
function passwordFromContext(ctx: { path?: string; body?: unknown }): unknown {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  if (ctx.path === "/sign-up/email") return body.password;
  if (ctx.path === "/change-password") return body.newPassword;
  return undefined;
}

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
  user: {
    // RF-1001: cambiar de email sin verificación (no hay SMTP en el MVP).
    // Los usuarios nunca tienen emailVerified, así que el cambio es directo.
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  session: {
    // Sesión de 30 días con renovación diaria (RNF-08)
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  rateLimit: {
    // Solo en producción (docs/09 · 9.5): en desarrollo y e2e estorba.
    enabled: process.env.NODE_ENV === "production",
    window: 10,
    max: 100,
    customRules: {
      // RF-101, RNF-08: 10 intentos de registro/login por minuto y por IP.
      "/sign-in/*": { window: 60, max: 10 },
      "/sign-up/*": { window: 60, max: 10 },
      // El resto de rutas sensibles (cambio de contraseña/email) conservan
      // el límite por defecto de better-auth: 3 intentos cada 10 segundos.
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // RF-101: se rechazan las contraseñas de la lista de las más comunes.
      const password = passwordFromContext(ctx);
      if (typeof password === "string" && isCommonPassword(password)) {
        throw new APIError("BAD_REQUEST", {
          message: texts.auth.weakPassword,
          code: "WEAK_PASSWORD",
        });
      }
    }),
  },
  // nextCookies debe ser el último plugin: permite fijar cookies desde server actions.
  plugins: [nextCookies()],
});
