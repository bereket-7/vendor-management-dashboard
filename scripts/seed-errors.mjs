#!/usr/bin/env node
/**
 * Seed ErrorRecord rows on vendor-core for the Error Management page.
 *
 * Requires vendors + inbound files first:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:inbound-processing
 *
 * Then:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:errors
 *   … pnpm seed:errors --force
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filePath) {
	if (!existsSync(filePath)) return;
	for (const line of readFileSync(filePath, "utf8").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq < 0) continue;
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (!(key in process.env)) process.env[key] = value;
	}
}

loadEnvFile(resolve(root, ".env"));

const BASE = (
	process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL ||
	"https://api.vm.tillahealth.com"
).replace(/\/$/, "");
const USER = process.env.VENDOR_CORE_USER || process.env.DJANGO_USER || "";
const PASS =
	process.env.VENDOR_CORE_PASSWORD || process.env.DJANGO_PASSWORD || "";
const FORCE = process.argv.includes("--force");

function unwrap(body) {
	if (body && typeof body === "object" && "result" in body) return body.result;
	return body;
}

async function request(method, path, { token, json } = {}) {
	const headers = { Accept: "application/json" };
	if (token) headers.Authorization = `Bearer ${token}`;
	let body;
	if (json !== undefined) {
		headers["Content-Type"] = "application/json";
		body = JSON.stringify(json);
	}
	const res = await fetch(`${BASE}${path}`, {
		method,
		headers,
		body,
		signal: AbortSignal.timeout(60000),
	});
	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}
	if (!res.ok) {
		const detail =
			data?.result?.detail ||
			data?.result?.errors ||
			data?.detail ||
			data?.message ||
			(typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data));
		const err = new Error(
			`${method} ${path} → ${res.status}: ${
				typeof detail === "string" ? detail : JSON.stringify(detail)
			}`
		);
		err.status = res.status;
		throw err;
	}
	return unwrap(data);
}

async function main() {
	console.log(`Target: ${BASE}`);
	if (!USER || !PASS) {
		console.error(
			"Missing VENDOR_CORE_USER / VENDOR_CORE_PASSWORD.\n" +
				"Example:\n  VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=… pnpm seed:errors"
		);
		process.exit(1);
	}

	const tokenBody = await request("POST", "/api/v1/authentication/token/", {
		json: { username: USER, password: PASS },
	});
	const token = tokenBody?.access || tokenBody?.token;
	if (!token) {
		console.error("Token response missing access field:", tokenBody);
		process.exit(1);
	}
	console.log("✓ authenticated");

	const files = await request("GET", "/api/v1/inbound-files/?limit=1", { token });
	const fileCount = files?.count ?? files?.results?.length ?? 0;
	if (!fileCount) {
		console.warn(
			"No inbound files found — run pnpm seed:inbound-processing first for linked errors."
		);
	}

	let seeded;
	try {
		seeded = await request("POST", "/api/v1/errors/seed/", {
			token,
			json: { force: FORCE },
		});
		console.log("✓ error seed:", seeded);
	} catch (err) {
		if (err.status === 404) {
			console.warn(
				"POST /api/v1/errors/seed/ unavailable — trying inbound-files/seed/ (includes errors when deployed)…"
			);
			try {
				seeded = await request("POST", "/api/v1/inbound-files/seed/", {
					token,
					json: { force: FORCE },
				});
				console.log("✓ inbound processing seed:", seeded);
			} catch (inner) {
				console.error(
					"Could not seed errors.\n" +
						"Deploy vendor-core with POST /api/v1/errors/seed/ and ensure inbound demo files exist."
				);
				throw inner;
			}
		} else {
			throw err;
		}
	}

	const errors = await request("GET", "/api/v1/errors/list/?limit=5", { token });
	const errorCount = errors?.count ?? errors?.results?.length ?? 0;
	console.log(`Error records now: ${errorCount}`);

	console.log(
		"\nDone. Refresh Error Management in the UI (vendor-core JWT required)."
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
