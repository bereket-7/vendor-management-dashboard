#!/usr/bin/env node
/**
 * Seed deployed vendor-core (Django) from frontend mock fixtures.
 *
 * Live API style (verified against api.vm.tillahealth.com):
 *   POST /api/v1/<resource>/create/   + GET /api/v1/<resource>/list/
 *   Intake jobs / inbound files keep REST roots.
 *
 * Usage:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core
 *   … pnpm seed:vendor-core --skip-uploads
 *   … pnpm seed:vendor-core --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Blob } from "node:buffer";

import {
	ACCOUNT_NAMES,
	CONFIG_FILE_TYPES,
	DEFAULT_ROUTING_RULES,
	LOBS,
	MOCK_VENDORS,
	SAMPLE_FILES,
} from "./seed-data/mock-vendors.mjs";

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
const MAX_ACCOUNTS = Number(process.env.SEED_MAX_ACCOUNTS || 6);
const SKIP_UPLOADS = process.argv.includes("--skip-uploads");
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
		err.body = data;
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
		const qs = url.searchParams.toString();
		const pagePath = `${url.pathname}?${qs}`;
		const page = await request("GET", pagePath, { token });
		const chunk = Array.isArray(page) ? page : (page?.results ?? []);
		results.push(...chunk);
		const count = page?.count;
		offset += chunk.length;
		if (!chunk.length || (typeof count === "number" && offset >= count)) break;
		if (chunk.length < Number(url.searchParams.get("limit") || 100)) break;
	}
	return results;
}

function mapVendorStatus(status) {
	// API choices: prospect | onboarding | active | suspended | terminated
	if (status === "inactive") return "suspended";
	return "active";
}

function connectionStatus(health, vendorStatus) {
	if (vendorStatus === "inactive") return "inactive";
	if (health === "failed") return "failed";
	return "active";
}

function shortCode(name, tradingCode) {
	const base = (name || tradingCode || "VND")
		.replace(/[^a-zA-Z0-9]+/g, " ")
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((p) => p.slice(0, 3).toUpperCase())
		.join("");
	return base || "VND";
}

function cronForFrequency(frequency) {
	if (frequency === "Weekly") return "0 6 * * 1";
	if (frequency === "Hourly") return "0 * * * *";
	return "0 6 * * *";
}

function jobCountFor(vendor) {
	if (vendor.status === "inactive" || vendor.jobsCount === 0) return 0;
	return Math.min(Math.max(vendor.jobsCount || 4, 4), 4);
}

function vendorKey(v) {
	return v.vendor_code || v.code || v.reference_id || v.id;
}

function accountKey(a) {
	return a.account_code || a.code;
}

async function ensureRoutingRules(token) {
	// Note: deployed list endpoint may return empty even after create (API quirk).
	// Always attempt create; treat name conflicts as already-seeded.
	for (const rule of DEFAULT_ROUTING_RULES) {
		if (DRY_RUN) {
			console.log(`  [dry] routing-rule ${rule.name}`);
			continue;
		}
		try {
			const payload = {
				name: rule.name,
				priority: rule.priority,
				destination_module: rule.destination_module,
				parser: "x12",
				is_active: true,
			};
			if (rule.edi_type) payload.edi_type = rule.edi_type;
			await request("POST", "/api/v1/routing-rules/create/", {
				token,
				json: payload,
			});
			console.log(`✓ routing-rule ${rule.name}`);
		} catch (err) {
			const msg = String(err.message || "");
			if (/already|unique|exist|duplicate|400/i.test(msg)) {
				console.log(`· routing-rule exists/skipped ${rule.name}`);
			} else {
				console.warn(`! routing-rule ${rule.name}: ${err.message}`);
			}
		}
	}
}

async function main() {
	console.log(`Target: ${BASE}`);
	if (!USER || !PASS) {
		console.error(
			"Missing VENDOR_CORE_USER / VENDOR_CORE_PASSWORD.\n" +
				"Example:\n  VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core"
		);
		process.exit(1);
	}

	if (DRY_RUN) console.log("Dry run — no writes.");

	let tokenBody;
	try {
		tokenBody = await request("POST", "/api/v1/authentication/token/", {
			json: { username: USER, password: PASS },
		});
	} catch (err) {
		console.error(`Login failed: ${err.message}`);
		process.exit(1);
	}

	const token = tokenBody?.access || tokenBody?.token;
	if (!token) {
		console.error("Token response missing access field:", tokenBody);
		process.exit(1);
	}
	console.log("✓ authenticated");

	await ensureRoutingRules(token);

	const existingVendors = await listAll(token, "/api/v1/vendors/list/");
	const byCode = new Map(existingVendors.map((v) => [vendorKey(v), v]));

	const created = {
		vendors: 0,
		accounts: 0,
		credentials: 0,
		connections: 0,
		jobs: 0,
		uploads: 0,
		skipped: 0,
	};

	/** @type {Map<string, { vendorId: string, connectionId: string | null, manualId: string | null }>} */
	const vendorMap = new Map();

	for (const mock of MOCK_VENDORS) {
		let vendor = byCode.get(mock.code);
		if (vendor) {
			console.log(`· vendor exists ${mock.code} ${mock.name}`);
			created.skipped += 1;
		} else if (DRY_RUN) {
			console.log(`  [dry] vendor ${mock.code}`);
			vendor = { id: `dry-${mock.code}`, vendor_code: mock.code };
		} else {
			try {
				vendor = await request("POST", "/api/v1/vendors/create/", {
					token,
					json: {
						vendor_code: mock.code,
						legal_name: mock.name,
						trade_name: mock.name,
						country: mock.country || "US",
						city: mock.city || "Unknown",
						status: mapVendorStatus(mock.status),
						metadata: {
							mock_id: mock.mockId,
							vendor_type: mock.vendorType,
							health: mock.health,
							timezone: mock.timezone,
							seeded_from: "vendor-management-mocks",
						},
					},
				});
				console.log(`✓ vendor ${mock.code} ${mock.name}`);
				created.vendors += 1;
				byCode.set(mock.code, vendor);
			} catch (err) {
				console.warn(`! vendor ${mock.code}: ${err.message}`);
				continue;
			}
		}

		const vendorId = vendor.id;
		const accountCount = Math.min(mock.linkedAccounts || 4, MAX_ACCOUNTS);
		const existingAccounts = await listAll(
			token,
			`/api/v1/accounts/list/?vendor_id=${vendorId}`
		).catch(() => []);
		const accountCodes = new Set(existingAccounts.map((a) => accountKey(a)));

		for (let i = 0; i < accountCount; i++) {
			const code = `${mock.code}-ACC-${1001 + i}`;
			if (accountCodes.has(code)) continue;
			if (DRY_RUN) {
				console.log(`  [dry] account ${code}`);
				created.accounts += 1;
				continue;
			}
			try {
				await request("POST", "/api/v1/accounts/create/", {
					token,
					json: {
						vendor_id: vendorId,
						account_code: code,
						name: ACCOUNT_NAMES[i % ACCOUNT_NAMES.length],
						line_of_business: LOBS[i % LOBS.length],
						active: !(i === accountCount - 1 && accountCount > 4),
						metadata: { mock_vendor: mock.mockId },
					},
				});
				created.accounts += 1;
				console.log(`✓ account ${code}`);
			} catch (err) {
				console.warn(`! account ${code}: ${err.message}`);
			}
		}

		const short = shortCode(mock.name, mock.code);
		const secretRef = `sftp.${mock.code.toLowerCase().replace(/-/g, "_")}.password`;

		let credentialId = null;
		const existingCreds = await listAll(
			token,
			"/api/v1/credentials/list/"
		).catch(() => []);
		const existingCred = existingCreds.find((c) => c.secret_ref === secretRef);
		if (existingCred) {
			credentialId = existingCred.id;
		} else if (!DRY_RUN) {
			try {
				const cred = await request("POST", "/api/v1/credentials/create/", {
					token,
					json: {
						name: `${mock.name} SFTP password`,
						kind: "password",
						secret_ref: secretRef,
						description: "Seeded demo credential reference (not a real secret)",
						metadata: { mock_vendor: mock.mockId },
					},
				});
				credentialId = cred.id;
				created.credentials += 1;
			} catch (err) {
				console.warn(`! credential ${secretRef}: ${err.message}`);
			}
		}

		const connName = `${short} - SFTP Connection`;
		const existingConns = await listAll(
			token,
			`/api/v1/connections/list/?vendor_id=${vendorId}`
		).catch(() => []);
		let connection = existingConns.find((c) => c.name === connName);

		if (!connection && !DRY_RUN) {
			const payload = {
				name: connName,
				vendor_id: vendorId,
				method: "sftp_pull",
				direction: "inbound",
				environment: "production",
				status: connectionStatus(mock.health, mock.status),
				config: {
					host: mock.sftpHost.replace(/\.example$/, ".example.com"),
					port: 22,
					username: `${short.toLowerCase()}_mfc`,
					host_key_fingerprint: "sha256:seeded-demo-fingerprint-not-for-prod",
					inbound_path: `/${short}/incoming`,
					archive_path: `/${short}/archive`,
				},
				metadata: {
					mock_vendor: mock.mockId,
					auth_method: "Key Based",
				},
			};
			if (credentialId) payload.password_credential_id = credentialId;
			try {
				connection = await request("POST", "/api/v1/connections/create/", {
					token,
					json: payload,
				});
				created.connections += 1;
				console.log(`✓ connection ${connName}`);
			} catch (err) {
				console.warn(`! connection ${connName}: ${err.message}`);
			}
		}

		const manualName = `${short} - Manual Upload`;
		let manual = existingConns.find((c) => c.name === manualName);
		if (!manual && !DRY_RUN && mock.status !== "inactive") {
			try {
				manual = await request("POST", "/api/v1/connections/create/", {
					token,
					json: {
						name: manualName,
						vendor_id: vendorId,
						method: "manual_upload",
						direction: "inbound",
						environment: "production",
						status: "active",
						config: {},
						metadata: { mock_vendor: mock.mockId },
					},
				});
				created.connections += 1;
				console.log(`✓ connection ${manualName}`);
			} catch (err) {
				console.warn(`! connection ${manualName}: ${err.message}`);
			}
		}

		const primaryConnectionId = connection?.id || manual?.id || null;
		vendorMap.set(mock.code, {
			vendorId,
			connectionId: primaryConnectionId,
			manualId: manual?.id || null,
		});

		const nJobs = jobCountFor(mock);
		const existingJobs = await listAll(
			token,
			`/api/v1/intake-jobs/?vendor_id=${vendorId}`
		).catch(() => []);
		const jobNames = new Set(existingJobs.map((j) => j.name));

		for (let i = 0; i < nJobs; i++) {
			const ft = CONFIG_FILE_TYPES[i % CONFIG_FILE_TYPES.length];
			const frequency = i % 3 === 0 ? "Weekly" : "Daily";
			const label = mock.name.split(/\s+/).slice(0, 2).join(" ");
			const name = `${label} - ${ft.label.split(" (")[0]} Import`;
			if (jobNames.has(name)) continue;
			if (!primaryConnectionId) {
				console.warn(`! skip job ${name} (no connection)`);
				continue;
			}
			if (DRY_RUN) {
				console.log(`  [dry] job ${name}`);
				created.jobs += 1;
				continue;
			}
			try {
				await request("POST", "/api/v1/intake-jobs/", {
					token,
					json: {
						name,
						connection: primaryConnectionId,
						vendor: vendorId,
						file_type: ft.fileType,
						filename_pattern: ft.pattern,
						path_or_endpoint: `/${short}/incoming`,
						schedule_cron: cronForFrequency(frequency),
						schedule_timezone: mock.timezone || "America/New_York",
						status: "active",
						destination_module: ft.destination,
						parser: "x12",
						metadata: { mock_vendor: mock.mockId, frequency },
					},
				});
				created.jobs += 1;
				console.log(`✓ job ${name}`);
			} catch (err) {
				console.warn(`! job ${name}: ${err.message}`);
			}
		}
	}

	if (!SKIP_UPLOADS && !DRY_RUN) {
		console.log("Uploading sample inbound files…");
		for (const file of SAMPLE_FILES) {
			const mapped = vendorMap.get(file.vendorCode);
			if (!mapped?.manualId && !mapped?.connectionId) {
				console.warn(`! skip upload ${file.name} (no connection)`);
				continue;
			}
			const form = new FormData();
			form.append(
				"file",
				new Blob([file.content], { type: "application/octet-stream" }),
				file.name
			);
			const connId = mapped.manualId || mapped.connectionId;
			if (connId) form.append("connection_id", connId);
			try {
				await request("POST", "/api/v1/intake/uploads/", {
					token,
					formData: form,
				});
				created.uploads += 1;
				console.log(`✓ upload ${file.name}`);
			} catch (err) {
				console.warn(`! upload ${file.name}: ${err.message}`);
			}
		}
	}

	console.log("\nSeed summary");
	console.log(created);
	console.log(
		"\nDone. Refresh Integration / Vendors / Files in the UI — no redeploy needed."
	);
	console.log(
		"Next: VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:inbound-processing"
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
