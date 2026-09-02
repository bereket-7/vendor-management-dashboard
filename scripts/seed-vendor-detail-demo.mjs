#!/usr/bin/env node
/**
 * Seed vendor detail demo data on remote vendor-core — mirrors
 * `manage.py seed_demo_vendor_detail` in vendor-management-core.
 *
 * Populates Overview + Operations + Accounts: contacts, notes, contracts, documents,
 * vendor accounts (4 LOBs with feed statuses), and multiple inbound files.
 *
 * Usage:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-detail
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… VENDOR_CODE=ust pnpm seed:vendor-detail
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… VENDOR_ID=<uuid> pnpm seed:vendor-detail
 */
import { Blob } from "node:buffer";
import { createHash } from "node:crypto";
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
loadEnvFile(resolve(root, ".env.local"));

const BASE = (
	process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL ||
	"https://api.vm.tillahealth.com"
).replace(/\/$/, "");
const USER = process.env.VENDOR_CORE_USER || process.env.DJANGO_USER || "";
const PASS =
	process.env.VENDOR_CORE_PASSWORD || process.env.DJANGO_PASSWORD || "";
const ACCESS_TOKEN = process.env.VENDOR_CORE_ACCESS_TOKEN || "";
const VENDOR_ID = process.env.VENDOR_ID || "";
const VENDOR_CODE = process.env.VENDOR_CODE || "ust";
const DRY_RUN = process.argv.includes("--dry-run");

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

async function resolveVendor(token) {
	if (VENDOR_ID) {
		try {
			return await request("GET", `/api/v1/vendors/${VENDOR_ID}/`, { token });
		} catch {
			console.warn(`! vendor id ${VENDOR_ID} not found — falling back to list`);
		}
	}
	const vendors = await listAll(token, "/api/v1/vendors/list/");
	const byCode = vendors.find(
		(v) =>
			(v.vendor_code || v.code || "").toLowerCase() ===
			VENDOR_CODE.toLowerCase()
	);
	if (byCode) return byCode;
	if (vendors.length === 1) return vendors[0];
	throw new Error(
		`Vendor not found (code=${VENDOR_CODE}). Set VENDOR_ID or VENDOR_CODE.`
	);
}

async function seedContacts(token, vendor) {
	const specs = [
		{
			name: "Alex Rivera",
			email: "alex.rivera@example.com",
			phone: "+1-555-0101",
			role: "primary",
			is_primary: true,
		},
		{
			name: "Jordan Lee",
			email: "jordan.lee@example.com",
			phone: "+1-555-0102",
			role: "technical",
			is_primary: false,
		},
	];
	const existing = await listAll(
		token,
		`/api/v1/vendor-contacts/list/?vendor_id=${vendor.id}`
	);
	const existingEmails = new Set(existing.map((c) => c.email?.toLowerCase()));
	let created = 0;
	for (const spec of specs) {
		if (existingEmails.has(spec.email.toLowerCase())) continue;
		if (DRY_RUN) {
			console.log(`[dry] contact ${spec.email}`);
			continue;
		}
		await request("POST", "/api/v1/vendor-contacts/create/", {
			token,
			json: { vendor_id: vendor.id, ...spec },
		});
		created += 1;
	}
	console.log(
		created
			? `✓ ${created} contact(s)`
			: `· contacts already seeded (${existing.length})`
	);
}

async function seedNotes(token, vendor) {
	const specs = [
		{ body: "Primary onboarding contact confirmed.", is_pinned: true },
		{
			body: "Eligibility feed validated in test environment.",
			is_pinned: false,
		},
		{ body: "Contract renewal review scheduled for Q4.", is_pinned: false },
	];
	const existing = await listAll(
		token,
		`/api/v1/vendor-notes/list/?vendor_id=${vendor.id}`
	);
	const existingBodies = new Set(existing.map((n) => n.body));
	let created = 0;
	for (const spec of specs) {
		if (existingBodies.has(spec.body)) continue;
		if (DRY_RUN) {
			console.log(`[dry] note`);
			continue;
		}
		await request("POST", "/api/v1/vendor-notes/create/", {
			token,
			json: { vendor_id: vendor.id, ...spec },
		});
		created += 1;
	}
	console.log(
		created
			? `✓ ${created} note(s)`
			: `· notes already seeded (${existing.length})`
	);
}

async function seedDocuments(token, vendor) {
	const code = (vendor.vendor_code || "demo").toLowerCase();
	const specs = [
		{
			document_type: "msa",
			title: `${vendor.legal_name || code} MSA 2026`,
			storage_key: `docs/${code}/msa-2026.pdf`,
			checksum: "d".repeat(64),
		},
		{
			document_type: "sow",
			title: `${vendor.legal_name || code} Eligibility SOW`,
			storage_key: `docs/${code}/sow-eligibility.pdf`,
			checksum: "e".repeat(64),
		},
	];
	const existing = await listAll(
		token,
		`/api/v1/documents/list/?vendor_id=${vendor.id}`
	);
	const existingKeys = new Set(existing.map((d) => d.storage_key));
	let created = 0;
	for (const spec of specs) {
		if (existingKeys.has(spec.storage_key)) continue;
		if (DRY_RUN) {
			console.log(`[dry] document ${spec.title}`);
			continue;
		}
		await request("POST", "/api/v1/documents/create/", {
			token,
			json: {
				vendor_id: vendor.id,
				document_type: spec.document_type,
				title: spec.title,
				storage_key: spec.storage_key,
				checksum_sha256: spec.checksum,
				mime_type: "application/pdf",
				size_bytes: 4096,
				status: "approved",
			},
		});
		created += 1;
	}
	console.log(
		created
			? `✓ ${created} document(s)`
			: `· documents already seeded (${existing.length})`
	);
}

async function seedContracts(token, vendor) {
	const code = (vendor.vendor_code || "demo").toUpperCase();
	const today = new Date();
	const nextYear = new Date(today);
	nextYear.setFullYear(today.getFullYear() + 1);
	const specs = [
		{
			contract_number: `${code}-MSA-2026`,
			title: "Master Services Agreement",
			contract_type: "msa",
			total_contract_value: "250000.00",
		},
		{
			contract_number: `${code}-SOW-ELIG-2026`,
			title: "Eligibility Feed Statement of Work",
			contract_type: "sow",
			total_contract_value: "75000.00",
		},
	];
	const existing = await listAll(
		token,
		`/api/v1/contracts/list/?vendor_id=${vendor.id}`
	);
	const existingNumbers = new Set(existing.map((c) => c.contract_number));
	let created = 0;
	for (const spec of specs) {
		if (existingNumbers.has(spec.contract_number)) continue;
		if (DRY_RUN) {
			console.log(`[dry] contract ${spec.contract_number}`);
			continue;
		}
		await request("POST", "/api/v1/contracts/create/", {
			token,
			json: {
				vendor_id: vendor.id,
				contract_number: spec.contract_number,
				title: spec.title,
				contract_type: spec.contract_type,
				status: "active",
				effective_date: "2026-01-01",
				expiration_date: nextYear.toISOString().slice(0, 10),
				total_contract_value: spec.total_contract_value,
				currency: "USD",
				payment_terms_days: 30,
			},
		});
		created += 1;
	}
	console.log(
		created
			? `✓ ${created} contract(s)`
			: `· contracts already seeded (${existing.length})`
	);
}

function accountSpecs(vendor) {
	const code = (vendor.vendor_code || "demo").toUpperCase();
	return [
		{
			account_code: `${code}-1001`,
			name: "Alpha Benefits Group",
			line_of_business: "commercial",
			active: true,
			health_score: 92,
			eligibility_feed_status: "success",
			medical_feed_status: "success",
			pharmacy_feed_status: "success",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-1002`,
			name: "Beta Health Partners",
			line_of_business: "medicare",
			active: true,
			health_score: 90,
			eligibility_feed_status: "success",
			medical_feed_status: "success",
			pharmacy_feed_status: "none",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-1003`,
			name: "Cascade Care Network",
			line_of_business: "medicaid",
			active: true,
			health_score: 72,
			eligibility_feed_status: "warning",
			medical_feed_status: "success",
			pharmacy_feed_status: "warning",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-1004`,
			name: "Delta Employer Trust",
			line_of_business: "marketplace",
			active: false,
			health_score: 40,
			eligibility_feed_status: "error",
			medical_feed_status: "none",
			pharmacy_feed_status: "none",
			accumulator_feed_status: "none",
		},
	];
}

async function listVendorAccounts(token, vendorId, { isVisible } = {}) {
	const params = new URLSearchParams({ vendor_id: vendorId, limit: "100" });
	if (isVisible != null) params.set("is_visible", String(isVisible));
	return listAll(token, `/api/v1/accounts/list/?${params}`);
}

async function findAccountByCode(token, vendorId, accountCode) {
	for (const isVisible of [true, false]) {
		const rows = await listVendorAccounts(token, vendorId, { isVisible });
		const hit = rows.find((row) => row.account_code === accountCode);
		if (hit) return hit;
	}
	return null;
}

async function upsertAccount(token, vendor, spec) {
	const payload = {
		vendor_id: vendor.id,
		is_visible: true,
		...spec,
	};
	if (DRY_RUN) {
		console.log(`[dry] account ${spec.account_code}`);
		return null;
	}

	const existing = await findAccountByCode(token, vendor.id, spec.account_code);
	if (existing) {
		const updated = await request(
			"PATCH",
			`/api/v1/accounts/${existing.id}/update/`,
			{
				token,
				json: {
					name: spec.name,
					line_of_business: spec.line_of_business,
					active: spec.active,
					is_visible: true,
					health_score: spec.health_score,
					eligibility_feed_status: spec.eligibility_feed_status,
					medical_feed_status: spec.medical_feed_status,
					pharmacy_feed_status: spec.pharmacy_feed_status,
					accumulator_feed_status: spec.accumulator_feed_status,
				},
			}
		);
		return updated;
	}

	try {
		return await request("POST", "/api/v1/accounts/create/", {
			token,
			json: payload,
		});
	} catch (error) {
		if (error.status !== 400) throw error;
		const fallback = await findAccountByCode(
			token,
			vendor.id,
			spec.account_code
		);
		if (!fallback) throw error;
		return request("PATCH", `/api/v1/accounts/${fallback.id}/update/`, {
			token,
			json: {
				name: spec.name,
				line_of_business: spec.line_of_business,
				active: spec.active,
				is_visible: true,
				health_score: spec.health_score,
				eligibility_feed_status: spec.eligibility_feed_status,
				medical_feed_status: spec.medical_feed_status,
				pharmacy_feed_status: spec.pharmacy_feed_status,
				accumulator_feed_status: spec.accumulator_feed_status,
			},
		});
	}
}

async function seedAccounts(token, vendor) {
	const code = (vendor.vendor_code || "demo").toUpperCase();
	const specs = [
		...accountSpecs(vendor),
		{
			account_code: "mfc",
			name: "MedStar Family Choice",
			line_of_business: "commercial",
			active: true,
			health_score: 88,
			eligibility_feed_status: "success",
			medical_feed_status: "success",
			pharmacy_feed_status: "none",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-001`,
			name: `${vendor.trade_name || vendor.legal_name || code} Demo Account`,
			line_of_business: "commercial",
			active: true,
			health_score: 85,
			eligibility_feed_status: "success",
			medical_feed_status: "success",
			pharmacy_feed_status: "none",
			accumulator_feed_status: "none",
		},
	];
	const before = await listVendorAccounts(token, vendor.id, {
		isVisible: true,
	});
	let created = 0;
	let updated = 0;
	const accountsByCode = new Map(before.map((row) => [row.account_code, row]));

	for (const spec of specs) {
		const had = accountsByCode.has(spec.account_code);
		const account = await upsertAccount(token, vendor, spec);
		if (!account) continue;
		accountsByCode.set(account.account_code, account);
		if (had) updated += 1;
		else created += 1;
	}

	const accounts = [...accountsByCode.values()];
	const visible = await listVendorAccounts(token, vendor.id, {
		isVisible: true,
	});

	const primary =
		visible.find(
			(row) => row.active !== false && row.account_code?.endsWith("-1001")
		) ??
		visible.find((row) => row.active !== false) ??
		visible[0] ??
		null;

	if (primary?.id) {
		await linkConnectionsToAccount(token, vendor.id, primary.id);
	}

	console.log(
		created || updated
			? `✓ accounts: ${created} created, ${updated} updated (${visible.length} visible for vendor)`
			: `· accounts already seeded (${visible.length} visible)`
	);
	if (!visible.length) {
		console.warn(
			"! accounts list still empty after seed — check API permissions or vendor_id"
		);
	}
	return visible;
}

async function linkConnectionsToAccount(token, vendorId, accountId) {
	const connections = await listAll(
		token,
		`/api/v1/connections/list/?vendor_id=${vendorId}`
	);
	let linked = 0;
	for (const conn of connections) {
		if (conn.account_id === accountId) continue;
		if (DRY_RUN) {
			console.log(`[dry] link connection ${conn.name ?? conn.id} → account`);
			continue;
		}
		try {
			await request("PATCH", `/api/v1/connections/${conn.id}/update/`, {
				token,
				json: { account_id: accountId },
			});
			linked += 1;
		} catch (error) {
			console.warn(
				`! connection ${conn.id} not linked to account: ${error.message}`
			);
		}
	}
	if (linked) {
		console.log(`✓ linked ${linked} connection(s) to primary account`);
	}
}

async function seedIntegrationProfile(token, vendor) {
	try {
		const profile = await request(
			"GET",
			`/api/v1/vendors/${vendor.id}/integration-profile/`,
			{ token }
		);
		if (profile.health === "healthy") {
			console.log("· integration profile already healthy");
			return;
		}
		if (DRY_RUN) {
			console.log("[dry] integration profile patch");
			return;
		}
		await request(
			"PATCH",
			`/api/v1/vendors/${vendor.id}/integration-profile/update/`,
			{
				token,
				json: {
					health: "healthy",
					timezone: profile.timezone || "UTC",
					transmission_method: profile.transmission_method || "sftp",
				},
			}
		);
		console.log("✓ integration profile health → healthy");
	} catch (err) {
		console.warn(`! integration profile skipped: ${err.message}`);
	}
}

async function seedInboundFiles(token, vendor) {
	const targetCount = 5;
	const existing = await listAll(
		token,
		`/api/v1/inbound-files/?vendor_id=${vendor.id}`
	);
	if (existing.length >= targetCount) {
		console.log(`· inbound files already exist (${existing.length})`);
		return existing.length;
	}

	const connections = await listAll(
		token,
		`/api/v1/connections/list/?vendor_id=${vendor.id}`
	);
	const conn = connections[0];
	if (!conn) {
		console.warn(
			"! no connection for vendor — skip inbound uploads (run seed:vendor-core first)"
		);
		return existing.length;
	}

	const code = (vendor.vendor_code || "vendor").toUpperCase();
	const fileSpecs = [
		{ suffix: "20260801", records: 512 },
		{ suffix: "20260802", records: 248 },
		{ suffix: "20260803", records: 0 },
		{ suffix: "20260804", records: 180 },
		{ suffix: "20260805", records: 96 },
	];
	const existingNames = new Set(existing.map((f) => f.original_filename));
	let created = 0;

	for (const spec of fileSpecs) {
		const filename = `${code}_Eligibility_${spec.suffix}.txt`;
		if (existingNames.has(filename)) continue;
		if (DRY_RUN) {
			console.log(`[dry] inbound ${filename}`);
			continue;
		}
		const content = `MEMBER_ID|PLAN|EFF_DATE\n${Array.from(
			{ length: Math.max(spec.records, 1) },
			(_, i) => `${10000 + i}|HMO|2026-01-01`
		).join("\n")}\n`;
		const form = new FormData();
		form.append("file", new Blob([content], { type: "text/plain" }), filename);
		form.append("connection_id", conn.id);
		await request("POST", "/api/v1/intake/uploads/", { token, formData: form });
		created += 1;
	}

	console.log(
		created
			? `✓ ${created} inbound file upload(s)`
			: `· inbound files present (${existing.length})`
	);
	return existing.length + created;
}

async function main() {
	console.log(`Target: ${BASE}`);
	if (!USER || !PASS) {
		if (!ACCESS_TOKEN) {
			console.error(
				"Missing credentials. Set one of:\n" +
					"  VENDOR_CORE_USER + VENDOR_CORE_PASSWORD\n" +
					"  VENDOR_CORE_ACCESS_TOKEN (JWT from browser localStorage)\n" +
					"Add them to .env or .env.local, then re-run pnpm seed:vendor-detail"
			);
			process.exit(1);
		}
	}

	const tokenBody = ACCESS_TOKEN
		? { access: ACCESS_TOKEN }
		: await request("POST", "/api/v1/authentication/token/", {
				json: { username: USER, password: PASS },
			});
	const token = tokenBody?.access || tokenBody?.token;
	if (!token) {
		console.error("Token response missing access field:", tokenBody);
		process.exit(1);
	}
	console.log("✓ authenticated");

	const vendor = await resolveVendor(token);
	const label = vendor.trade_name || vendor.legal_name || vendor.vendor_code;
	console.log(`→ vendor ${vendor.vendor_code || vendor.id} (${label})\n`);

	await seedContacts(token, vendor);
	await seedNotes(token, vendor);
	await seedDocuments(token, vendor);
	await seedContracts(token, vendor);
	await seedAccounts(token, vendor);
	await seedIntegrationProfile(token, vendor);
	await seedInboundFiles(token, vendor);

	console.log(
		"\nDone. Reload vendor detail → Overview + Accounts tabs should be populated."
	);
	console.log(
		"Tip: on deployed backend you can also run: python manage.py seed_demo_vendor_detail --vendor-code=" +
			(vendor.vendor_code || VENDOR_CODE)
	);
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
