import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

/** Static route excluded from middleware — avoids hanging on NestJS session checks during startup. */
const webServerReadyUrl = `${baseURL}/robots.txt`;

const e2eServerEnv = {
	SKIP_ENV_VALIDATION: "true",
	NEXT_PUBLIC_USE_MOCK: "true",
	NEXT_PUBLIC_DEV_ADMIN: "true",
	...process.env,
};

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	timeout: 60_000,
	use: {
		baseURL,
		trace: "on-first-retry",
		actionTimeout: 15_000,
		navigationTimeout: 60_000,
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
		? undefined
		: {
				command: process.env.CI
					? "pnpm start"
					: `pnpm exec next dev --turbopack -p ${port}`,
				url: webServerReadyUrl,
				reuseExistingServer:
					!process.env.CI && !process.env.PLAYWRIGHT_FORCE_WEBSERVER,
				timeout: 180_000,
				env: e2eServerEnv,
			},
});
