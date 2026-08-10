#!/usr/bin/env node
/**
 * Smoke-test Vendor Core (Django) against NEXT_PUBLIC_VENDOR_CORE_API_URL.
 *
 * Usage:
 *   node scripts/smoke-vendor-core.mjs
 *   VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=secret node scripts/smoke-vendor-core.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

loadEnvFile(resolve(process.cwd(), ".env"));

const BASE = (
	process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL || "http://localhost:8010"
).replace(/\/$/, "");
const USER = process.env.VENDOR_CORE_USER || process.env.DJANGO_USER || "";
const PASS =
	process.env.VENDOR_CORE_PASSWORD || process.env.DJANGO_PASSWORD || "";

const results = [];

async function check(name, fn) {
	try {
		const detail = await fn();
		results.push({ name, ok: true, detail });
		console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
	} catch (err) {
		results.push({ name, ok: false, detail: err.message });
		console.error(`✗ ${name} — ${err.message}`);
	}
}

async function get(path, headers = {}) {
	const res = await fetch(`${BASE}${path}`, {
		headers: { Accept: "application/json", ...headers },
		signal: AbortSignal.timeout(20000),
	});
	const text = await res.text();
	let body;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = text;
	}
	return { res, body };
}

async function post(path, body, headers = {}) {
	const res = await fetch(`${BASE}${path}`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			...headers,
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(20000),
	});
	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}
	return { res, body: data };
}

console.log(`Vendor-core base: ${BASE}\n`);

await check("health reachable", async () => {
	const { res, body } = await get("/health/");
	const db = body?.result?.database ?? "?";
	return `HTTP ${res.status}, database=${db}`;
});

await check("JWT token endpoint exists", async () => {
	const { res, body } = await post("/api/v1/authentication/token/", {});
	if (res.status !== 400) {
		throw new Error(`expected 400 validation, got ${res.status}`);
	}
	const fields = Object.keys(body?.result?.errors ?? {});
	if (!fields.includes("username") || !fields.includes("password")) {
		throw new Error(`unexpected validation fields: ${fields.join(",")}`);
	}
	return "username/password required";
});

await check("monitoring requires auth", async () => {
	const { res } = await get("/api/v1/monitoring/");
	if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
	return "401 without token";
});

await check("intake-jobs requires auth", async () => {
	const { res } = await get("/api/v1/intake-jobs/");
	if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
	return "401 without token";
});

await check("inbound-files requires auth", async () => {
	const { res } = await get("/api/v1/inbound-files/");
	if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
	return "401 without token";
});

let access = null;
let sampleInboundFileId = null;
if (USER && PASS) {
	await check("JWT login", async () => {
		const { res, body } = await post("/api/v1/authentication/token/", {
			username: USER,
			password: PASS,
		});
		if (!res.ok) {
			throw new Error(
				`HTTP ${res.status}: ${body?.message ?? body?.result?.detail ?? "login failed"}`
			);
		}
		access = body?.access ?? body?.result?.access;
		if (!access) throw new Error("response missing access token");
		return "access token received";
	});

	if (access) {
		const auth = { Authorization: `Bearer ${access}` };
		await check("monitoring with token", async () => {
			const { res, body } = await get("/api/v1/monitoring/", auth);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${body?.message ?? "failed"}`);
			}
			return `HTTP ${res.status}`;
		});
		await check("intake-jobs with token", async () => {
			const { res, body } = await get("/api/v1/intake-jobs/", auth);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${body?.message ?? "failed"}`);
			}
			const count = body?.result?.count ?? body?.count ?? "?";
			return `HTTP ${res.status}, count=${count}`;
		});
		await check("inbound-files with token", async () => {
			const { res, body } = await get("/api/v1/inbound-files/", auth);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${body?.message ?? "failed"}`);
			}
			sampleInboundFileId = body?.result?.results?.[0]?.id ?? null;
			const count = body?.result?.count ?? body?.count ?? "?";
			return `HTTP ${res.status}, count=${count}`;
		});
		await check("validation-results requires auth", async () => {
			const { res } = await get("/api/v1/validation-results/list/");
			if (res.status !== 401) {
				throw new Error(`expected 401, got ${res.status}`);
			}
			return "401 without token";
		});
		await check("validation-results with token", async () => {
			const { res, body } = await get("/api/v1/validation-results/list/", auth);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${body?.message ?? "failed"}`);
			}
			const count = body?.result?.count ?? body?.count ?? "?";
			return `HTTP ${res.status}, count=${count}`;
		});
		if (sampleInboundFileId) {
			await check("inbound-file events with token", async () => {
				const { res, body } = await get(
					`/api/v1/inbound-files/${sampleInboundFileId}/events/`,
					auth
				);
				if (!res.ok) {
					throw new Error(`HTTP ${res.status}: ${body?.message ?? "failed"}`);
				}
				const rows = Array.isArray(body?.result)
					? body.result.length
					: (body?.result?.results?.length ?? body?.result?.count ?? 0);
				return `HTTP ${res.status}, events=${rows}`;
			});
		}
	}
} else {
	console.log(
		"\n(skip authenticated checks — set VENDOR_CORE_USER + VENDOR_CORE_PASSWORD)"
	);
}

const failed = results.filter((r) => !r.ok);
console.log(
	`\n${results.length - failed.length}/${results.length} checks passed`
);
process.exit(failed.length ? 1 : 0);
