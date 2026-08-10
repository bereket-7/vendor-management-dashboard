/**
 * Run Playwright with env vars needed for local E2E (Windows-friendly).
 * Usage: pnpm test:e2e
 * If dev is already running: pnpm test:e2e:local
 */
import { spawn } from "node:child_process";

const playwrightArgs = process.argv.slice(2).filter((a) => a !== "--local");
const localOnly = process.argv.includes("--local");

const env = {
	...process.env,
	SKIP_ENV_VALIDATION: "true",
	NEXT_PUBLIC_USE_MOCK: "true",
	NEXT_PUBLIC_DEV_ADMIN: "true",
	NEXT_PUBLIC_E2E: "true",
};

if (localOnly) {
	env.PLAYWRIGHT_SKIP_WEBSERVER = "1";
} else {
	// Dedicated port so E2E does not conflict with an existing `pnpm dev` on 3000
	env.PLAYWRIGHT_FORCE_WEBSERVER = "1";
	env.PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? "3005";
}

const child = spawn("pnpm", ["exec", "playwright", "test", ...playwrightArgs], {
	stdio: "inherit",
	shell: true,
	env,
});

child.on("exit", (code) => process.exit(code ?? 1));
