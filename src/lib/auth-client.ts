"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Cliente de better-auth para componentes cliente.
 * Sin baseURL: usa el mismo origen de la app.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, changePassword } = authClient;
