#!/usr/bin/env node
/**
 * Seed inbound files, processing events, and validation results on vendor-core.
 *
 * Requires vendors/connections first:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core
 *
 * Then:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:inbound-processing
 *   … pnpm seed:inbound-processing --force
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Blob } from "node:buffer";

import { SAMPLE_FILES } from "./seed-data/mock-vendors.mjs";

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

async function request(method, path, { token, json, formData } = {}) {
	const headers = { Accept: "application/json" };
	if (token) headers.Authorization = `Bearer ${token}`;
	let body;
	if (formData) {
		body = formData;
	} else if (json !== undefined) {
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

async function listAll(token, path) {
	const url = new URL(path, "http://local");
	if (!url.searchParams.has("limit")) url.searchParams.set("limit", "100");
	const results = [];
	let offset = 0;
	for (;;) {
		url.searchParams.set("offset", String(offset));
		const page = await request("GET", `${url.pathname}?${url.searchParams}`, {
			token,
		});
		const chunk = Array.isArray(page) ? page : (page?.results ?? []);
		results.push(...chunk);
		const count = page?.count;
		offset += chunk.length;
		if (!chunk.length || (typeof count === "number" && offset >= count)) break;
		if (chunk.length < Number(url.searchParams.get("limit") || 100)) break;
	}
	return results;
}

async function uploadFallback(token) {
	console.log("Seed API unavailable — uploading sample inbound files only…");
	const vendors = await listAll(token, "/api/v1/vendors/list/");
	const byCode = new Map(vendors.map((v) => [v.vendor_code || v.code, v]));
	const connections = await listAll(token, "/api/v1/connections/list/");
	let uploads = 0;
	for (const file of SAMPLE_FILES) {
		const vendor = byCode.get(file.vendorCode);
		if (!vendor) continue;
		const manual = connections.find(
			(c) =>
				(c.vendor_id || c.vendor) === vendor.id &&
				String(c.method).includes("manual")
		);
		const anyConn = connections.find(
			(c) => (c.vendor_id || c.vendor) === vendor.id
		);
		const connId = manual?.id || anyConn?.id;
		if (!connId) continue;
		const form = new FormData();
		form.append(
			"file",
			new Blob([file.content], { type: "application/octet-stream" }),
			file.name
		);
		form.append("connection_id", connId);
		try {
			await request("POST", "/api/v1/intake/uploads/", { token, formData: form });
			uploads += 1;
			console.log(`✓ upload ${file.name}`);
		} catch (err) {
			console.warn(`! upload ${file.name}: ${err.message}`);
		}
	}
	return uploads;
}

async function main() {
	console.log(`Target: ${BASE}`);
	if (!USER || !PASS) {
		console.error(
			"Missing VENDOR_CORE_USER / VENDOR_CORE_PASSWORD.\n" +
				"Example:\n  VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=… pnpm seed:inbound-processing"
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

	let seeded;
	try {
		seeded = await request("POST", "/api/v1/inbound-files/seed/", {
			token,
			json: { force: FORCE },
		});
		console.log("✓ inbound processing seed:", seeded);
	} catch (err) {
		if (err.status === 404) {
			const uploads = await uploadFallback(token);
			if (!uploads) {
				console.error(
					"Could not seed inbound data.\n" +
						"Deploy vendor-core with POST /api/v1/inbound-files/seed/ " +
						"or ensure manual upload connections exist (pnpm seed:vendor-core)."
				);
				process.exit(1);
			}
			console.warn(
				"Uploaded files only — processing events / validation results need " +
					"the inbound-files/seed/ API deployed on vendor-core."
			);
		} else {
			throw err;
		}
	}

	const files = await request("GET", "/api/v1/inbound-files/?limit=5", { token });
	const fileCount = files?.count ?? files?.results?.length ?? 0;
	console.log(`Inbound files now: ${fileCount}`);

	if (files?.results?.[0]?.id) {
		const sampleId = files.results[0].id;
		const events = await request(
			"GET",
			`/api/v1/inbound-files/${sampleId}/events/`,
			{ token }
		);
		const eventCount = Array.isArray(events)
			? events.length
			: (events?.results?.length ?? 0);
		console.log(`Sample file events (${sampleId.slice(0, 8)}…): ${eventCount}`);
	}

	const validation = await request(
		"GET",
		"/api/v1/validation-results/list/?limit=5",
		{ token }
	);
	const validationCount = validation?.count ?? validation?.results?.length ?? 0;
	console.log(`Validation results: ${validationCount}`);

	try {
		const errorSeed = await request("POST", "/api/v1/errors/seed/", {
			token,
			json: { force: FORCE },
		});
		console.log("✓ error seed:", errorSeed);
	} catch (err) {
		if (err.status !== 404) {
			console.warn(`! error seed: ${err.message}`);
		}
	}

	const errors = await request("GET", "/api/v1/errors/list/?limit=5", { token });
	const errorCount = errors?.count ?? errors?.results?.length ?? 0;
	console.log(`Error records: ${errorCount}`);

	console.log(
		"\nDone. Refresh File Monitoring, Processing Logs, and Error Management in the UI (vendor-core JWT required)."
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
