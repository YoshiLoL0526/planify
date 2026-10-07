import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://planify:planify@localhost:5433/planify_test";

/**
 * E2E contra un servidor Next en el puerto 3100 con base de datos propia
 * (`planify_test`) y su propio directorio de build (NEXT_DIST_DIR=.next-e2e),
 * para no interferir con el servidor de desarrollo (docs/03 · RNF-07).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-1234",
      UPLOAD_DIR: "./uploads-e2e",
      REGISTRATION_OPEN: "true",
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
