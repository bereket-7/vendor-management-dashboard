#!/usr/bin/env node
/**
 * Seed member coverages on vendor-core when the list is empty.
 *
 * Requires create/seed endpoints:
 *   POST /api/v1/member-coverages/seed/
 *   (or create eligibility-file + member-coverage)
 *
 * Usage:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… node scripts/seed-member-coverages.mjs
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

function unwrap(body) {
	if (body && typeof body === "object" && "result" in body) return body.result;
	return body;
}

async function request(method, path, { token, json } = {}) {
	const headers = { Accept: "application/json" };
	if (token) headers.Authorization = `Bearer ${token}`;
	if (json !== undefined) headers["Content-Type"] = "application/json";
	const res = await fetch(`${BASE}${path}`, {
		method,
		headers,
		body: json !== undefined ? JSON.stringify(json) : undefined,
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
		console.error("Set VENDOR_CORE_USER / VENDOR_CORE_PASSWORD");
		process.exit(1);
	}
	const tokenBody = await request("POST", "/api/v1/authentication/token/", {
		json: { username: USER, password: PASS },
	});
	const token = tokenBody?.access || tokenBody?.token;
	if (!token) {
		console.error("No access token");
		process.exit(1);
	}

	const listed = await request("GET", "/api/v1/member-coverages/list/?limit=1", {
		token,
	});
	const count = listed?.count ?? listed?.results?.length ?? 0;
	console.log(`Existing coverages: ${count}`);
	if (count > 0) {
		console.log("Already seeded — nothing to do.");
		return;
	}

	try {
		const seeded = await request("POST", "/api/v1/member-coverages/seed/", {
			token,
			json: { count: 12 },
		});
		console.log("✓ seed endpoint:", seeded);
		return;
	} catch (err) {
		console.warn(`! seed endpoint unavailable (${err.message})`);
	}

	// Fallback: create eligibility file + coverages one-by-one
	const vendors = await request("GET", "/api/v1/vendors/list/?limit=1", {
		token,
	});
	const vendor = vendors?.results?.[0];
	if (!vendor?.id) {
		console.error("No vendor available to attach eligibility file");
		process.exit(1);
	}

	let eligibility;
	try {
		eligibility = await request("POST", "/api/v1/eligibility-files/create/", {
			token,
			json: {
				vendor_id: vendor.id,
				original_filename: "seed_member_coverages.edi",
				received_at: new Date().toISOString(),
				member_count: 0,
			},
		});
		console.log("✓ eligibility file", eligibility.id);
	} catch (err) {
		console.error(
			`Create endpoints not deployed yet (${err.message}).\n` +
				`Deploy vendor-core members create/seed APIs, then re-run.`
		);
		process.exit(1);
	}

	const names = [
		["Jane", "Doe"],
		["John", "Smith"],
		["Maria", "Garcia"],
		["James", "Williams"],
		["Aisha", "Hassan"],
		["Robert", "Johnson"],
		["Sofia", "Martinez"],
		["Daniel", "Brown"],
		["Fatima", "Ali"],
		["Michael", "Davis"],
		["Elena", "Nguyen"],
		["David", "Wilson"],
	];
	let created = 0;
	for (let i = 0; i < names.length; i++) {
		const [first, last] = names[i];
		await request("POST", "/api/v1/member-coverages/create/", {
			token,
			json: {
				eligibility_file_id: eligibility.id,
				subscriber_id: `SEED-SUB-${String(i + 1).padStart(4, "0")}`,
				group_or_policy_number: `GRP-${String((i % 4) + 1).padStart(3, "0")}`,
				member_first_name: first,
				member_last_name: last,
				maintenance_type_code: "030",
			},
		});
		created += 1;
	}
	console.log(`✓ created ${created} member coverages`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
