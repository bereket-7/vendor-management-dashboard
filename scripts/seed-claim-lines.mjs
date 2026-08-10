#!/usr/bin/env node
/**
 * Seed claim-line rows on vendor-core for the Claims admin page.
 *
 * Requires vendors first:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core
 *
 * Then:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:claim-lines
 *   … pnpm seed:claim-lines --force
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
		signal: AbortSignal.timeout(120000),
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
				"Example:\n  VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=… pnpm seed:claim-lines"
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

	const vendors = await request("GET", "/api/v1/vendors/list/?limit=1", { token });
	const vendorCount = vendors?.count ?? vendors?.results?.length ?? 0;
	if (!vendorCount) {
		console.error(
			"No vendors found. Run first:\n  VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core"
		);
		process.exit(1);
	}

	let seeded;
	try {
		seeded = await request("POST", "/api/v1/claim-lines/seed/", {
			token,
			json: { force: FORCE },
		});
		console.log("✓ claim-line seed:", seeded);
	} catch (err) {
		if (err.status === 404) {
			console.error(
				"POST /api/v1/claim-lines/seed/ is not deployed on vendor-core yet.\n" +
					"Deploy the latest vendor-core (claim-lines seed API), then re-run this script."
			);
			process.exit(1);
		}
		throw err;
	}

	const lines = await request("GET", "/api/v1/claim-lines/list/?limit=5", {
		token,
	});
	const lineCount = lines?.count ?? lines?.results?.length ?? 0;
	console.log(`Claim lines now: ${lineCount}`);

	console.log(
		"\nDone. Refresh Claims in the UI (vendor-core JWT required)."
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
