#!/usr/bin/env node
/**
 * Seed Medicare/Medicaid program reporting + compliance calendar on vendor-core.
 *
 * Period strings match FE filters after normalizeReportingPeriod (Q2 2027, …).
 *
 * Usage:
 *   VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:program-reporting
 *   … pnpm seed:program-reporting --dry-run
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
const DRY_RUN = process.argv.includes("--dry-run");

const PERIOD_Q2 = "Q2 2027";
const PERIOD_Q1 = "Q1 2027";
const PERIOD_Q4 = "Q4 2026";

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

function daysAgoIso(days) {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString();
}

function dueDateOffset(days) {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

async function createIfMissing({
	token,
	label,
	listPath,
	createPath,
	matchKey,
	matchValue,
	payload,
	existingIndex,
}) {
	if (existingIndex.has(matchValue)) {
		console.log(`· ${label} exists ${matchValue}`);
		return existingIndex.get(matchValue);
	}
	if (DRY_RUN) {
		console.log(`  [dry] ${label} ${matchValue}`);
		return null;
	}
	try {
		const created = await request("POST", createPath, { token, json: payload });
		existingIndex.set(matchValue, created);
		console.log(`✓ ${label} ${matchValue}`);
		return created;
	} catch (err) {
		const msg = String(err.message || "");
		if (/already|unique|exist|duplicate|400/i.test(msg)) {
			console.log(`· ${label} skipped ${matchValue}`);
			return null;
		}
		console.warn(`! ${label} ${matchValue}: ${err.message}`);
		return null;
	}
}

function buildObligations() {
	return [
		{
			title: "Medicare Part D PDE monthly submission",
			program: "medicare",
			obligationType: "PDE",
			frequency: "Monthly",
			dueOffset: 8,
			owner: "Pharmacy Ops",
			regulatoryAgency: "CMS",
			priority: "High",
			regulatoryReference: "42 CFR §423.360",
			reportingPeriod: PERIOD_Q2,
			description: "Submit Prescription Drug Event files for the active PBPs.",
			documents: [
				{ name: "PDE_submission_checklist.pdf", kind: "pdf" },
				{ name: "PBP_001_PDE.xml", kind: "xml" },
			],
			activity: [
				{
					at: "2027-06-10",
					actor: "Pharmacy Ops",
					note: "Draft file packaged",
				},
				{
					at: "2027-06-12",
					actor: "Compliance",
					note: "Pre-submission QA passed",
				},
			],
		},
		{
			title: "Medicare encounter data (EDS) quarterly",
			program: "medicare",
			obligationType: "Encounter",
			frequency: "Quarterly",
			dueOffset: 22,
			owner: "Claims Ops",
			regulatoryAgency: "CMS",
			priority: "High",
			regulatoryReference: "42 CFR §422.504",
			reportingPeriod: PERIOD_Q2,
			description: "Quarterly Medicare Advantage encounter submission window.",
			documents: [{ name: "EDS_Q2_2027_plan.pdf", kind: "pdf" }],
			activity: [
				{ at: "2027-06-01", actor: "Claims Ops", note: "Batch build started" },
			],
		},
		{
			title: "Risk adjustment data submission (RAPS/EDS)",
			program: "medicare",
			obligationType: "Risk Adjustment",
			frequency: "Quarterly",
			dueOffset: 35,
			owner: "Risk Adjustment",
			regulatoryAgency: "CMS",
			priority: "High",
			regulatoryReference: "42 CFR §422.310",
			reportingPeriod: PERIOD_Q2,
			description: "Submit risk adjustment diagnoses for payment year.",
		},
		{
			title: "Medicare Part C/D compliance attestation",
			program: "medicare",
			obligationType: "Attestation",
			frequency: "Quarterly",
			dueOffset: -5,
			owner: "Compliance Team",
			regulatoryAgency: "CMS",
			priority: "Critical",
			regulatoryReference: "CMS Program Audit Protocol",
			reportingPeriod: PERIOD_Q2,
			description: "Quarterly data quality attestation for Medicare reporting.",
			openIssues: 2,
			documents: [{ name: "attestation_draft.docx", kind: "docx" }],
			activity: [
				{
					at: "2027-06-18",
					actor: "Compliance",
					note: "Waiting on PDE variance sign-off",
				},
			],
		},
		{
			title: "PDE reconciliation closeout",
			program: "medicare",
			obligationType: "Reconciliation",
			frequency: "Monthly",
			dueOffset: 4,
			owner: "Pharmacy Ops",
			regulatoryAgency: "CMS",
			priority: "High",
			regulatoryReference: "PDE Technical Guidance",
			reportingPeriod: PERIOD_Q2,
			description: "Close monthly PDE variance and CMS response issues.",
			openIssues: 3,
		},
		{
			title: "Medicare Q1 2027 reporting close",
			program: "medicare",
			obligationType: "Reporting Close",
			frequency: "Quarterly",
			dueOffset: -40,
			owner: "Regulatory Ops",
			regulatoryAgency: "CMS",
			priority: "Medium",
			regulatoryReference: "Internal SOP",
			reportingPeriod: PERIOD_Q1,
			description: "Archive Q1 Medicare submissions and responses.",
			status: "Completed",
			documents: [{ name: "Q1_2027_closeout.pdf", kind: "pdf" }],
			activity: [{ at: "2027-04-15", actor: "Regulatory Ops", note: "Closed" }],
		},
		{
			title: "HEDIS IDSS final submission",
			program: "quality",
			obligationType: "HEDIS",
			frequency: "Annual",
			dueOffset: 55,
			owner: "Quality Team",
			regulatoryAgency: "NCQA",
			priority: "High",
			regulatoryReference: "NCQA HEDIS",
			reportingPeriod: PERIOD_Q2,
			description: "Final IDSS file delivery for measurement year.",
		},
		{
			title: "CMS EDGE Q2 production submission",
			program: "cms-edge",
			obligationType: "EDGE file",
			frequency: "Quarterly",
			dueOffset: 18,
			owner: "EDGE Ops",
			regulatoryAgency: "CMS",
			priority: "Critical",
			regulatoryReference: "EDGE Server Guide",
			reportingPeriod: PERIOD_Q2,
			description: "EDGE enrollee/medical/pharmacy package for Q2.",
			documents: [{ name: "EDGE_Q2_package.xml", kind: "xml" }],
		},
		{
			title: "Medicaid DC encounter monthly file",
			program: "medicaid",
			obligationType: "Encounter",
			frequency: "Monthly",
			dueOffset: 6,
			owner: "Encounter Ops",
			regulatoryAgency: "State MMIS",
			priority: "High",
			regulatoryReference: "DC MMIS Companion Guide",
			reportingPeriod: PERIOD_Q2,
			description: "837 encounter batch for DC Medicaid.",
		},
		{
			title: "Medicaid MD eligibility refresh",
			program: "medicaid",
			obligationType: "Eligibility",
			frequency: "Monthly",
			dueOffset: 12,
			owner: "Membership Ops",
			regulatoryAgency: "State MMIS",
			priority: "Medium",
			regulatoryReference: "MD MMIS Spec",
			reportingPeriod: PERIOD_Q2,
			description: "Member eligibility extract for Maryland.",
		},
		{
			title: "RADV medical record request wave 1",
			program: "other",
			obligationType: "Audit",
			frequency: "Ad hoc",
			dueOffset: -2,
			owner: "Audit Response",
			regulatoryAgency: "CMS",
			priority: "Critical",
			regulatoryReference: "RADV Protocol",
			reportingPeriod: PERIOD_Q2,
			description: "Respond to RADV chart pull for selected enrollees.",
			openIssues: 5,
			documents: [{ name: "radv_request_list.xlsx", kind: "xlsx" }],
			activity: [
				{
					at: "2027-06-20",
					actor: "Audit Response",
					note: "Charts requested from clinics",
				},
			],
		},
		{
			title: "Medicare Part D formulary update filing",
			program: "medicare",
			obligationType: "Formulary",
			frequency: "Monthly",
			dueOffset: 28,
			owner: "Pharmacy Ops",
			regulatoryAgency: "CMS",
			priority: "Medium",
			regulatoryReference: "HPMS Formulary Guidance",
			reportingPeriod: PERIOD_Q2,
			description: "Submit formulary updates via HPMS.",
		},
		{
			title: "Medicare Q4 2026 PDE archive retention check",
			program: "medicare",
			obligationType: "Retention",
			frequency: "Annual",
			dueOffset: -90,
			owner: "Compliance Team",
			regulatoryAgency: "CMS",
			priority: "Low",
			regulatoryReference: "Records Retention Policy",
			reportingPeriod: PERIOD_Q4,
			description: "Confirm PDE artifacts retained per policy.",
			status: "Completed",
			activity: [
				{ at: "2027-01-10", actor: "Compliance", note: "Retention verified" },
			],
		},
		{
			title: "Medicaid provider roster quarterly",
			program: "medicaid",
			obligationType: "Provider",
			frequency: "Quarterly",
			dueOffset: 30,
			owner: "Network Ops",
			regulatoryAgency: "State MMIS",
			priority: "Medium",
			regulatoryReference: "Provider Data Spec",
			reportingPeriod: PERIOD_Q2,
			description: "Quarterly provider data file to state.",
		},
		{
			title: "Medicare compliance calendar self-assessment",
			program: "medicare",
			obligationType: "Self-Assessment",
			frequency: "Quarterly",
			dueOffset: 14,
			owner: "Compliance Team",
			regulatoryAgency: "Internal",
			priority: "Medium",
			regulatoryReference: "Internal Control Framework",
			reportingPeriod: PERIOD_Q2,
			description: "Quarterly control self-assessment for Medicare reporting.",
			documents: [{ name: "control_matrix.xlsx", kind: "xlsx" }],
		},
	];
}

async function main() {
	console.log(`Target: ${BASE}`);
	if (!USER || !PASS) {
		console.error(
			"Missing VENDOR_CORE_USER / VENDOR_CORE_PASSWORD.\n" +
				"Example:\n  VENDOR_CORE_USER=admin VENDOR_CORE_PASSWORD=… pnpm seed:program-reporting"
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

	// ——— Compliance calendar ———
	console.log("\n== Compliance obligations ==");
	const existingObligations = await listAll(
		token,
		"/api/v1/compliance-obligations/list/"
	);
	const obligationByTitle = new Map(
		existingObligations.map((o) => [o.title, o])
	);
	for (const row of buildObligations()) {
		const due = dueDateOffset(row.dueOffset);
		const payload = {
			title: row.title,
			program: row.program,
			dueDate: due,
			obligationType: row.obligationType || "",
			frequency: row.frequency || "",
			owner: row.owner || "",
			sourceModule: row.program,
			reportingPeriod: row.reportingPeriod || "",
			regulatoryAgency: row.regulatoryAgency || "",
			priority: row.priority || "Medium",
			regulatoryReference: row.regulatoryReference || "",
			description: row.description || "",
			openIssues: row.openIssues || 0,
			documents: row.documents || [],
			activity: row.activity || [],
		};
		if (row.status) payload.status = row.status;
		await createIfMissing({
			token,
			label: "obligation",
			listPath: "/api/v1/compliance-obligations/list/",
			createPath: "/api/v1/compliance-obligations/create/",
			matchKey: "title",
			matchValue: row.title,
			payload,
			existingIndex: obligationByTitle,
		});
	}

	// ——— Program submissions ———
	console.log("\n== Program submissions ==");
	const existingSubs = await listAll(
		token,
		"/api/v1/program-submissions/list/"
	);
	const subByFile = new Map(existingSubs.map((s) => [s.fileName, s]));
	const subByBatch = new Map(existingSubs.map((s) => [s.batch, s]));

	const medicareSubs = [
		[
			"PDE_06202027.xml",
			"Part D (PDE)",
			"PDE-2027-0620",
			PERIOD_Q2,
			"Accepted",
			842560,
			"Regular",
			"001",
			12,
			"pde.ops",
		],
		[
			"PDE_06182027.xml",
			"Part D (PDE)",
			"PDE-2027-0618",
			PERIOD_Q2,
			"Accepted",
			721440,
			"Regular",
			"002",
			14,
			"pde.ops",
		],
		[
			"PDE_06152027.xml",
			"Part D (PDE)",
			"PDE-2027-0615",
			PERIOD_Q2,
			"Rejected",
			12840,
			"Backfill",
			"001",
			17,
			"pde.ops",
		],
		[
			"PDE_06122027.xml",
			"Part D (PDE)",
			"PDE-2027-0612",
			PERIOD_Q2,
			"Accepted",
			598220,
			"Regular",
			"003",
			20,
			"pde.ops",
		],
		[
			"PDE_06082027.xml",
			"Part D (PDE)",
			"PDE-2027-0608",
			PERIOD_Q2,
			"Pending",
			4280,
			"Backfill",
			"002",
			24,
			"pde.ops",
		],
		[
			"MA_Encounter_Q2_2027_001.xml",
			"Encounter Data",
			"EDS-2027-Q2-01",
			PERIOD_Q2,
			"Acknowledged",
			312400,
			"Original",
			"001",
			9,
			"encounter.ops",
		],
		[
			"MA_Encounter_Q2_2027_002.xml",
			"Encounter Data",
			"EDS-2027-Q2-02",
			PERIOD_Q2,
			"Submitted",
			288120,
			"Original",
			"002",
			5,
			"encounter.ops",
		],
		[
			"RAPS_Q2_2027.txt",
			"Risk Adjustment",
			"RAPS-2027-Q2",
			PERIOD_Q2,
			"Completed",
			95600,
			"Replacement",
			"001",
			18,
			"ra.ops",
		],
		[
			"PDE_Q1_2027_FINAL.xml",
			"Part D (PDE)",
			"PDE-2027-Q1-F",
			PERIOD_Q1,
			"Accepted",
			910200,
			"Regular",
			"001",
			70,
			"pde.ops",
		],
	];
	for (const [
		fileName,
		reportType,
		batch,
		period,
		status,
		records,
		kind,
		pbp,
		days,
		by,
	] of medicareSubs) {
		const created = await createIfMissing({
			token,
			label: "medicare-sub",
			createPath: "/api/v1/program-submissions/create/",
			matchValue: fileName,
			payload: {
				programType: "medicare",
				fileName,
				reportingPeriod: period,
				reportType,
				batch,
				submittedAt: daysAgoIso(days),
				status,
				records,
				submittedBy: by,
				submissionKind: kind,
				pbp,
			},
			existingIndex: subByFile,
		});
		if (created) subByBatch.set(batch, created);
	}

	const medicaidSubs = [
		[
			"DC_Encounter_Q2_2027_001.dat",
			"Encounter File",
			"ENC-DC-2027-06-01",
			PERIOD_Q2,
			"DC",
			"Accepted",
			512840,
			10,
			"encounter.ops",
		],
		[
			"MD_Encounter_Q2_2027_Final.dat",
			"Encounter File",
			"ENC-MD-2027-06-F",
			PERIOD_Q2,
			"MD",
			"Accepted",
			421560,
			16,
			"encounter.ops",
		],
		[
			"DC_Eligibility_Q2_2027.dat",
			"Member Eligibility",
			"ELIG-DC-2027-06",
			PERIOD_Q2,
			"DC",
			"Acknowledged",
			389104,
			8,
			"membership.ops",
		],
		[
			"DC_Provider_Q2_2027.dat",
			"Provider Data",
			"PROV-DC-2027-06",
			PERIOD_Q2,
			"DC",
			"Rejected",
			84320,
			11,
			"network.ops",
		],
		[
			"DC_Encounter_Q2_2027_003.dat",
			"Encounter File",
			"ENC-DC-2027-06-03",
			PERIOD_Q2,
			"DC",
			"Pending",
			498220,
			3,
			"encounter.ops",
		],
	];
	for (const [
		fileName,
		reportType,
		batch,
		period,
		state,
		status,
		records,
		days,
		by,
	] of medicaidSubs) {
		const created = await createIfMissing({
			token,
			label: "medicaid-sub",
			createPath: "/api/v1/program-submissions/create/",
			matchValue: fileName,
			payload: {
				programType: "medicaid",
				fileName,
				reportingPeriod: period,
				reportType,
				batch,
				state,
				submittedAt: daysAgoIso(days),
				status,
				records,
				submittedBy: by,
			},
			existingIndex: subByFile,
		});
		if (created) subByBatch.set(batch, created);
	}

	// Refresh index after creates
	const allSubs = await listAll(token, "/api/v1/program-submissions/list/");
	for (const s of allSubs) {
		subByFile.set(s.fileName, s);
		if (s.batch) subByBatch.set(s.batch, s);
	}

	// ——— Responses ———
	console.log("\n== Program responses ==");
	const existingResponses = await listAll(
		token,
		"/api/v1/program-responses/list/"
	);
	const respByFile = new Map(existingResponses.map((r) => [r.responseFile, r]));

	const medicareResponses = [
		[
			"PDE_RESP_06212027.xml",
			"PDE-2027-0620",
			"Processed",
			842560,
			120,
			40,
			11,
		],
		["PDE_RESP_06192027.xml", "PDE-2027-0618", "Processed", 721440, 0, 12, 13],
		["PDE_RESP_06162027.xml", "PDE-2027-0615", "Failed", 12840, 12840, 0, 16],
		["PDE_RESP_06132027.xml", "PDE-2027-0612", "Processed", 598220, 85, 22, 19],
		["PDE_RESP_06092027.xml", "PDE-2027-0608", "Pending", 4280, 0, 0, 23],
		[
			"EDS_RESP_Q2_001.xml",
			"EDS-2027-Q2-01",
			"Processed",
			312400,
			1240,
			310,
			8,
		],
		["RAPS_RESP_Q2.xml", "RAPS-2027-Q2", "Processed", 95600, 40, 15, 17],
	];
	for (const [
		responseFile,
		batch,
		status,
		records,
		errors,
		warnings,
		days,
	] of medicareResponses) {
		const sub = subByBatch.get(batch);
		await createIfMissing({
			token,
			label: "medicare-resp",
			createPath: "/api/v1/program-responses/create/",
			matchValue: responseFile,
			payload: {
				programType: "medicare",
				responseFile,
				submissionId: sub?.id || null,
				receivedAt: daysAgoIso(days),
				status,
				records,
				errors,
				warnings,
			},
			existingIndex: respByFile,
		});
	}

	const medicaidResponses = [
		[
			"DC_MMIS_Response_Q2_2027_001.rsp",
			"ENC-DC-2027-06-01",
			"Processed",
			512840,
			12480,
			2240,
			9,
		],
		[
			"MD_MMIS_Response_Q2_2027_Final.rsp",
			"ENC-MD-2027-06-F",
			"Processed",
			421560,
			8920,
			1760,
			15,
		],
		[
			"DC_MMIS_Response_Q2_2027_ELIG.rsp",
			"ELIG-DC-2027-06",
			"Processed",
			389104,
			8284,
			2400,
			7,
		],
		[
			"DC_MMIS_Response_Q2_2027_PROV.rsp",
			"PROV-DC-2027-06",
			"Failed",
			84320,
			84320,
			0,
			10,
		],
		[
			"DC_MMIS_Response_Q2_2027_003.rsp",
			"ENC-DC-2027-06-03",
			"Pending",
			498220,
			0,
			0,
			2,
		],
	];
	for (const [
		responseFile,
		batch,
		status,
		records,
		errors,
		warnings,
		days,
	] of medicaidResponses) {
		const sub = subByBatch.get(batch);
		await createIfMissing({
			token,
			label: "medicaid-resp",
			createPath: "/api/v1/program-responses/create/",
			matchValue: responseFile,
			payload: {
				programType: "medicaid",
				responseFile,
				submissionId: sub?.id || null,
				receivedAt: daysAgoIso(days),
				status,
				records,
				errors,
				warnings,
			},
			existingIndex: respByFile,
		});
	}

	// ——— Audits ———
	console.log("\n== Program audits ==");
	const existingAudits = await listAll(token, "/api/v1/program-audits/list/");
	const auditByActivity = new Map(existingAudits.map((a) => [a.activity, a]));
	const audits = [
		[
			"medicare",
			"PDE file integrity review",
			"High",
			"Completed",
			10,
			{
				auditType: "File Integrity",
				reportType: "Part D (PDE)",
				plan: "PBP 001",
				auditPeriod: PERIOD_Q2,
				auditor: "Internal Audit",
				findings: 3,
				description: "NDC format and compound code checks",
			},
		],
		[
			"medicare",
			"Encounter data completeness",
			"Medium",
			"In Progress",
			6,
			{
				auditType: "Completeness",
				reportType: "Encounter Data",
				plan: "PBP 002",
				auditPeriod: PERIOD_Q2,
				auditor: "Compliance",
				findings: 5,
				description: "Missing rendering NPI on professional claims",
			},
		],
		[
			"medicare",
			"Risk adjustment coding sample",
			"Critical",
			"Open",
			4,
			{
				auditType: "Coding",
				reportType: "Risk Adjustment",
				plan: "PBP 001",
				auditPeriod: PERIOD_Q2,
				auditor: "External Vendor",
				findings: 8,
				description: "HCC capture gaps in diabetes cohort",
			},
		],
		[
			"medicare",
			"Part D reconciliation controls",
			"High",
			"Scheduled",
			2,
			{
				auditType: "Controls",
				reportType: "Part D (PDE)",
				plan: "All PBPs",
				auditPeriod: PERIOD_Q2,
				auditor: "Internal Audit",
				findings: 0,
				description: "Quarterly PDE variance control walkthrough",
			},
		],
		[
			"medicare",
			"Medicare attestation evidence review",
			"Low",
			"Completed",
			20,
			{
				auditType: "Attestation",
				reportType: "Compliance",
				plan: "Contract H1234",
				auditPeriod: PERIOD_Q1,
				auditor: "Compliance",
				findings: 1,
				description: "Evidence pack for Q1 attestation",
			},
		],
		[
			"medicaid",
			"State MMIS acceptance sampling",
			"Medium",
			"Completed",
			12,
			{
				auditType: "Acceptance",
				reportType: "Encounter File",
				plan: "MFC-DC-100",
				auditPeriod: PERIOD_Q2,
				auditor: "QA",
				findings: 2,
				description: "Sampled rejected encounters for root cause",
			},
		],
		[
			"medicaid",
			"Provider roster data quality",
			"High",
			"In Progress",
			5,
			{
				auditType: "Data Quality",
				reportType: "Provider Data",
				plan: "MFC-DC-100",
				auditPeriod: PERIOD_Q2,
				auditor: "Network Ops",
				findings: 4,
				description: "Invalid taxonomy codes on roster file",
			},
		],
	];
	for (const [
		programType,
		activity,
		severity,
		status,
		days,
		details,
	] of audits) {
		await createIfMissing({
			token,
			label: "audit",
			createPath: "/api/v1/program-audits/create/",
			matchValue: activity,
			payload: {
				programType,
				activity,
				findingSeverity: severity,
				status,
				occurredAt: daysAgoIso(days),
				details,
			},
			existingIndex: auditByActivity,
		});
	}

	// ——— Exceptions ———
	console.log("\n== Program exceptions ==");
	const existingExc = await listAll(token, "/api/v1/program-exceptions/list/");
	const excKey = (e) => `${e.programType}|${e.errorCode}|${e.submissionBatch}`;
	const excByKey = new Map(existingExc.map((e) => [excKey(e), e]));
	const exceptions = [
		[
			"medicare",
			"PDE-4012",
			"Invalid NDC code format on prescription drug event",
			"Critical",
			"",
			"PDE-2027-0615",
			842,
			"Open",
		],
		[
			"medicare",
			"PDE-2201",
			"Compound code missing for multi-ingredient claim",
			"High",
			"",
			"PDE-2027-0615",
			210,
			"In Review",
		],
		[
			"medicare",
			"EDS-110",
			"Member HICN/MBI not found on enrollment file",
			"High",
			"",
			"EDS-2027-Q2-01",
			640,
			"Open",
		],
		[
			"medicare",
			"EDS-204",
			"Service date outside reporting period",
			"Medium",
			"",
			"EDS-2027-Q2-01",
			180,
			"Open",
		],
		[
			"medicare",
			"RAPS-019",
			"Diagnosis code not billable for risk adjustment",
			"Medium",
			"",
			"RAPS-2027-Q2",
			95,
			"Resolved",
		],
		[
			"medicare",
			"PDE-088",
			"Duplicate PDE record for same Rx fill",
			"Low",
			"",
			"PDE-2027-0620",
			44,
			"Resolved",
		],
		[
			"medicaid",
			"ME-001",
			"Invalid member identifier",
			"Critical",
			"DC",
			"ENC-DC-2027-06-01",
			1240,
			"Open",
		],
		[
			"medicaid",
			"ME-014",
			"Service date outside eligibility",
			"Warning",
			"DC",
			"ENC-DC-2027-06-01",
			880,
			"In Review",
		],
		[
			"medicaid",
			"PR-008",
			"Provider NPI not on file",
			"Critical",
			"DC",
			"PROV-DC-2027-06",
			4200,
			"Open",
		],
		[
			"medicaid",
			"EN-022",
			"Duplicate encounter record",
			"Warning",
			"MD",
			"ENC-MD-2027-06-F",
			610,
			"Resolved",
		],
		[
			"medicaid",
			"EL-003",
			"Missing subscriber ID on eligibility row",
			"Info",
			"DC",
			"ELIG-DC-2027-06",
			95,
			"Open",
		],
	];
	for (const [
		programType,
		errorCode,
		description,
		severity,
		state,
		batch,
		count,
		status,
	] of exceptions) {
		const key = `${programType}|${errorCode}|${batch}`;
		await createIfMissing({
			token,
			label: "exception",
			createPath: "/api/v1/program-exceptions/create/",
			matchValue: key,
			payload: {
				programType,
				errorCode,
				description,
				severity,
				state,
				submissionBatch: batch,
				encounterCount: count,
				status,
			},
			existingIndex: excByKey,
		});
	}

	// ——— Documents ———
	console.log("\n== Program documents ==");
	const existingDocs = await listAll(token, "/api/v1/program-documents/list/");
	const docByName = new Map(existingDocs.map((d) => [d.name, d]));
	const docs = [
		[
			"medicare",
			"PDE_06202027.xml",
			"xml",
			"Submitted File",
			PERIOD_Q2,
			"",
			"Submitted",
			"48.2 MB",
			12,
		],
		[
			"medicare",
			"PDE_RESP_06212027.xml",
			"xml",
			"Response File",
			PERIOD_Q2,
			"",
			"Received",
			"6.1 MB",
			11,
		],
		[
			"medicare",
			"PDE_validation_Q2_2027.pdf",
			"pdf",
			"Validation Report",
			PERIOD_Q2,
			"",
			"Complete",
			"1.4 MB",
			10,
		],
		[
			"medicare",
			"MA_Encounter_Q2_2027_001.xml",
			"xml",
			"Submitted File",
			PERIOD_Q2,
			"",
			"Submitted",
			"112 MB",
			9,
		],
		[
			"medicare",
			"EDS_acceptance_Q2.pdf",
			"pdf",
			"Acceptance Report",
			PERIOD_Q2,
			"",
			"Complete",
			"820 KB",
			8,
		],
		[
			"medicare",
			"medicare_audit_workpapers_Q2.xlsx",
			"xlsx",
			"Audit Document",
			PERIOD_Q2,
			"",
			"Reference",
			"2.3 MB",
			6,
		],
		[
			"medicaid",
			"DC_Encounter_Q2_2027_001.dat",
			"dat",
			"Submitted File",
			PERIOD_Q2,
			"DC",
			"Submitted",
			"86 MB",
			10,
		],
		[
			"medicaid",
			"DC_MMIS_Response_Q2_2027_001.rsp",
			"rsp",
			"Response File",
			PERIOD_Q2,
			"DC",
			"Received",
			"12 MB",
			9,
		],
		[
			"medicaid",
			"DC_validation_summary_Q2.pdf",
			"pdf",
			"Validation Report",
			PERIOD_Q2,
			"DC",
			"Complete",
			"1.1 MB",
			8,
		],
		[
			"medicaid",
			"MD_Encounter_Q2_2027_Final.dat",
			"dat",
			"Submitted File",
			PERIOD_Q2,
			"MD",
			"Submitted",
			"71 MB",
			16,
		],
	];
	for (const [
		programType,
		name,
		fileKind,
		documentType,
		period,
		state,
		status,
		fileSize,
		days,
	] of docs) {
		await createIfMissing({
			token,
			label: "document",
			createPath: "/api/v1/program-documents/create/",
			matchValue: name,
			payload: {
				programType,
				name,
				fileKind,
				documentType,
				reportingPeriod: period,
				state,
				uploadedAt: daysAgoIso(days),
				status,
				fileSize,
			},
			existingIndex: docByName,
		});
	}

	// ——— PDE reconciliations ———
	console.log("\n== PDE reconciliations ==");
	const existingPde = await listAll(token, "/api/v1/pde-reconciliations/list/");
	const pdeKey = (p) => `${p.pbp}|${p.reconciliationType}|${p.reportingPeriod}`;
	const pdeByKey = new Map(existingPde.map((p) => [pdeKey(p), p]));
	const pdes = [
		["001", "Monthly PDE", 842560, 842440, 120, "Reconciled", PERIOD_Q2],
		["002", "Monthly PDE", 721440, 721400, 40, "Reconciled", PERIOD_Q2],
		["001", "Backfill PDE", 12840, 0, 12840, "In Review", PERIOD_Q2],
		["003", "Monthly PDE", 598220, 598135, 85, "Pending", PERIOD_Q2],
		["001", "Q1 Closeout", 910200, 910180, 20, "Reconciled", PERIOD_Q1],
	];
	for (const [
		pbp,
		reconciliationType,
		submitted,
		accepted,
		variance,
		status,
		period,
	] of pdes) {
		const key = `${pbp}|${reconciliationType}|${period}`;
		await createIfMissing({
			token,
			label: "pde",
			createPath: "/api/v1/pde-reconciliations/create/",
			matchValue: key,
			payload: {
				pbp,
				reconciliationType,
				recordsSubmitted: submitted,
				cmsAccepted: accepted,
				variance,
				status,
				reportingPeriod: period,
			},
			existingIndex: pdeByKey,
		});
	}

	console.log(
		"\nDone. Refresh Program Reporting (Medicare, period Q2 2027) + Compliance Calendar."
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
