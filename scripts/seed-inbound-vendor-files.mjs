#!/usr/bin/env node
/**
 * Seed inbound review queue data on vendor-core.
 *
 * Prefers POST /claim-vendor-files/seed/ (full demo pack), then
 * /claim-lines/seed/, then /providers/seed/ (creates ClaimVendorFile rows).
 *
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:inbound-vendor-files
 *   … pnpm seed:inbound-vendor-files --force
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
				"Or click Seed demo on Inbound Vendor Files while logged in.\n" +
				"Example:\n  VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=… pnpm seed:inbound-vendor-files --force"
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

	const vendors = await request("GET", "/api/v1/vendors/list/?limit=1", {
		token,
	});
	const vendorCount = vendors?.count ?? vendors?.results?.length ?? 0;
	if (!vendorCount) {
		console.error(
			"No vendors found. Run first:\n  VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core"
		);
		process.exit(1);
	}

	const attempts = [
		["/api/v1/claim-vendor-files/seed/", "claim-vendor-files"],
		["/api/v1/claim-lines/seed/", "claim-lines"],
		["/api/v1/providers/seed/", "providers"],
	];

	let seeded = null;
	let source = null;
	for (const [path, name] of attempts) {
		try {
			const body =
				name === "providers" ? { force: FORCE, count: 12 } : { force: FORCE };
			seeded = await request("POST", path, { token, json: body });
			source = name;
			console.log(`✓ ${name} seed:`, seeded);
			break;
		} catch (err) {
			if (err.status === 404) {
				console.warn(`! ${name} seed not deployed (${path})`);
				continue;
			}
			throw err;
		}
	}

	if (!seeded) {
		console.error("No seed endpoint available on this vendor-core deploy.");
		process.exit(1);
	}

	const files = await request(
		"GET",
		"/api/v1/claim-vendor-files/list/?limit=5",
		{ token }
	);
	const fileCount = files?.count ?? files?.results?.length ?? 0;
	console.log(`Claim vendor files now: ${fileCount} (via ${source})`);

	const lines = await request("GET", "/api/v1/claim-lines/list/?limit=5", {
		token,
	});
	const lineCount = lines?.count ?? lines?.results?.length ?? 0;
	console.log(`Claim lines now: ${lineCount}`);

	console.log(
		"\nDone. Refresh Inbound Vendor Files in the UI (vendor-core JWT required)."
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
