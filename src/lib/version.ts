/**
 * Versión de la aplicación para `/api/health` y diagnóstico.
 * Se define en tiempo de compilación desde `package.json` (next.config.ts).
 */
export const APP_VERSION = process.env.APP_VERSION ?? "0.1.0";
