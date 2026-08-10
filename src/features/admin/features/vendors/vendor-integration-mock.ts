import {
	FILE_RUNS,
	type FileRun,
	displayRunStatus,
} from "@/features/admin/features/file-management/mock-data";
import { fixtureList, fixtureRecord, isMockEnabled } from "@/lib/mock-mode";

export type VendorHealth = "healthy" | "warning" | "failed" | "in_progress";

export type VendorIntegrationProfile = {
	vendorId: string;
	vendorType: string;
	sftpHost: string;
	timezone: string;
	transmissionMethod: string;
	encryption: string;
	fileFormats: string[];
	tradingPartnerId: string;
	slaPercent: number;
	protocol: string;
	createdBy: string;
	accountsCount: number;
	jobsCount: number;
	alertsCount: number;
	avgProcessingTime: string;
	health: VendorHealth;
	notes: string;
};

export const VENDOR_INTEGRATION: Record<string, VendorIntegrationProfile> =
	fixtureRecord({
	"vnd-1": {
		vendorId: "vnd-1",
		vendorType: "Clearinghouse",
		sftpHost: "sftp.ust-healthcare.example",
		timezone: "Eastern ET",
		transmissionMethod: "SFTP",
		encryption: "PGP",
		fileFormats: ["EDI X12", "XML", "CSV"],
		tradingPartnerId: "VND-0003",
		slaPercent: 99.2,
		protocol: "SFTP / AS2",
		createdBy: "Admin",
		accountsCount: 3,
		jobsCount: 8,
		alertsCount: 0,
		avgProcessingTime: "00:02:14",
		health: "healthy",
		notes:
			"Primary clearinghouse for professional and institutional claims. Daily 837 and remittance feeds are active.",
	},
	"vnd-2": {
		vendorId: "vnd-2",
		vendorType: "PBM",
		sftpHost: "sftp.cvs-caremark.example",
		timezone: "Eastern ET",
		transmissionMethod: "SFTP",
		encryption: "PGP",
		fileFormats: ["NCPDP", "CSV"],
		tradingPartnerId: "VND-0011",
		slaPercent: 96.4,
		protocol: "SFTP",
		createdBy: "Admin",
		accountsCount: 2,
		jobsCount: 6,
		alertsCount: 3,
		avgProcessingTime: "00:03:48",
		health: "failed",
		notes:
			"Pharmacy benefits manager. Recent NCPDP claim file failures require follow-up with vendor ops.",
	},
	"vnd-3": {
		vendorId: "vnd-3",
		vendorType: "Laboratory",
		sftpHost: "as2.labcorp.example",
		timezone: "Eastern ET",
		transmissionMethod: "AS2",
		encryption: "AS2 + TLS",
		fileFormats: ["HL7", "CSV", "X12"],
		tradingPartnerId: "VND-0007",
		slaPercent: 98.8,
		protocol: "AS2",
		createdBy: "Admin",
		accountsCount: 4,
		jobsCount: 10,
		alertsCount: 2,
		avgProcessingTime: "00:01:38",
		health: "warning",
		notes:
			"Lab results and claim feeds. Weekly results file had validation warnings on the last run.",
	},
	"vnd-4": {
		vendorId: "vnd-4",
		vendorType: "Dental",
		sftpHost: "sftp.avesis.example",
		timezone: "Eastern ET",
		transmissionMethod: "SFTP",
		encryption: "PGP",
		fileFormats: ["EDI X12", "CSV"],
		tradingPartnerId: "VND-0014",
		slaPercent: 97.1,
		protocol: "SFTP",
		createdBy: "Admin",
		accountsCount: 1,
		jobsCount: 3,
		alertsCount: 1,
		avgProcessingTime: "00:02:12",
		health: "warning",
		notes:
			"Dental / vision claims partner. Schema drift warnings on recent 837D files under tolerant mode.",
	},
});

export type VendorListStatus = "active" | "at_risk" | "inactive";
export type VendorListHealth = "healthy" | "warning" | "critical";

export type VendorDirectoryRow = {
	id: string;
	name: string;
	vendorCode: string;
	vendorType: string;
	status: VendorListStatus;
	linkedAccounts: number;
	activeJobs: number;
	lastFileReceived: string;
	lastFileRelative: string;
	health: VendorListHealth;
	mark: string;
	avatarBg: string;
	/** ISO timestamp for live sorting (optional for mock rows) */
	createdAt?: string;
};

/** Directory used by the Vendors list page (matches ops console mock). */
export const VENDOR_DIRECTORY: VendorDirectoryRow[] = fixtureList([
	{
		id: "vnd-1",
		name: "UST Healthcare",
		vendorCode: "VND-0003",
		vendorType: "Clearinghouse",
		status: "active",
		linkedAccounts: 12,
		activeJobs: 8,
		lastFileReceived: "07/24/2026 6:02 AM",
		lastFileRelative: "Today",
		health: "healthy",
		mark: "U",
		avatarBg: "bg-[#13446c]",
	},
	{
		id: "vnd-2",
		name: "CVS Caremark",
		vendorCode: "VND-0011",
		vendorType: "PBM",
		status: "active",
		linkedAccounts: 9,
		activeJobs: 14,
		lastFileReceived: "07/24/2026 5:41 AM",
		lastFileRelative: "Today",
		health: "healthy",
		mark: "C",
		avatarBg: "bg-[#c2410c]",
	},
	{
		id: "vnd-3",
		name: "Labcorp",
		vendorCode: "VND-0007",
		vendorType: "Laboratory",
		status: "at_risk",
		linkedAccounts: 6,
		activeJobs: 4,
		lastFileReceived: "07/23/2026 8:25 PM",
		lastFileRelative: "Yesterday",
		health: "critical",
		mark: "L",
		avatarBg: "bg-[#1d4ed8]",
	},
	{
		id: "vnd-4",
		name: "Avesis",
		vendorCode: "VND-0014",
		vendorType: "Dental",
		status: "active",
		linkedAccounts: 5,
		activeJobs: 7,
		lastFileReceived: "07/23/2026 7:18 PM",
		lastFileRelative: "Yesterday",
		health: "warning",
		mark: "A",
		avatarBg: "bg-[#15803d]",
	},
	{
		id: "vnd-5",
		name: "Optum",
		vendorCode: "VND-0002",
		vendorType: "PBM",
		status: "active",
		linkedAccounts: 11,
		activeJobs: 10,
		lastFileReceived: "07/24/2026 4:12 AM",
		lastFileRelative: "Today",
		health: "healthy",
		mark: "O",
		avatarBg: "bg-[#0e7490]",
	},
	{
		id: "vnd-6",
		name: "Quest Diagnostics",
		vendorCode: "VND-0009",
		vendorType: "Laboratory",
		status: "active",
		linkedAccounts: 8,
		activeJobs: 6,
		lastFileReceived: "07/24/2026 3:55 AM",
		lastFileRelative: "Today",
		health: "healthy",
		mark: "Q",
		avatarBg: "bg-[#7c3aed]",
	},
	{
		id: "vnd-7",
		name: "Change Healthcare",
		vendorCode: "VND-0001",
		vendorType: "Clearinghouse",
		status: "inactive",
		linkedAccounts: 3,
		activeJobs: 0,
		lastFileReceived: "07/10/2026 9:14 AM",
		lastFileRelative: "19 days ago",
		health: "warning",
		mark: "C",
		avatarBg: "bg-[#0369a1]",
	},
	{
		id: "vnd-8",
		name: "Express Scripts",
		vendorCode: "VND-0018",
		vendorType: "PBM",
		status: "active",
		linkedAccounts: 7,
		activeJobs: 9,
		lastFileReceived: "07/24/2026 2:40 AM",
		lastFileRelative: "Today",
		health: "healthy",
		mark: "E",
		avatarBg: "bg-[#be123c]",
	},
	{
		id: "vnd-9",
		name: "Cotviti",
		vendorCode: "VND-0020",
		vendorType: "Clearinghouse",
		status: "active",
		linkedAccounts: 10,
		activeJobs: 11,
		lastFileReceived: "07/24/2026 1:18 AM",
		lastFileRelative: "Today",
		health: "healthy",
		mark: "C",
		avatarBg: "bg-[#b45309]",
	},
	{
		id: "vnd-10",
		name: "Delta Dental",
		vendorCode: "VND-0015",
		vendorType: "Dental",
		status: "active",
		linkedAccounts: 4,
		activeJobs: 5,
		lastFileReceived: "07/23/2026 11:02 PM",
		lastFileRelative: "Yesterday",
		health: "healthy",
		mark: "D",
		avatarBg: "bg-[#0f766e]",
	},
]);

/** Canonical vendor display names — use this everywhere mock UIs list vendors. */
export const VENDOR_NAMES = VENDOR_DIRECTORY.map((v) => v.name);

/** Map vendor type → claim/encounter file type label for mock seeding. */
export function claimFileTypeForVendorType(vendorType: string): string {
	switch (vendorType) {
		case "PBM":
			return "Pharmacy Claims";
		case "Dental":
			return "Vision/Dental";
		case "Laboratory":
			return "Laboratory Claims";
		case "Clearinghouse":
			return "Medical Claims";
		default:
			return "Medical Claims";
	}
}

/** Seed metadata for claim/encounter files (same vendors as Vendor Comparison). */
export const CLAIM_VENDOR_SEED = VENDOR_DIRECTORY.map((v) => ({
	id: v.id,
	name: v.name,
	fileType: claimFileTypeForVendorType(v.vendorType),
	vendorType: v.vendorType,
	mark: v.mark,
	avatarBg: v.avatarBg,
}));

export function summarizeVendorDirectory(rows: VendorDirectoryRow[]) {
	const total = rows.length;
	const active = rows.filter((r) => r.status === "active").length;
	const atRisk = rows.filter((r) => r.status === "at_risk").length;
	const inactive = rows.filter((r) => r.status === "inactive").length;
	const withAlerts = rows.filter(
		(r) => r.health === "warning" || r.health === "critical"
	).length;
	const healthy = rows.filter((r) => r.health === "healthy").length;
	const warning = rows.filter((r) => r.health === "warning").length;
	const critical = rows.filter((r) => r.health === "critical").length;
	return {
		total,
		active,
		atRisk,
		inactive,
		withAlerts,
		healthPie: [
			{
				name: "Healthy",
				value: healthy,
				pct: total ? Math.round((healthy / total) * 100) : 0,
				color: "#059669",
			},
			{
				name: "Warning",
				value: warning,
				pct: total ? Math.round((warning / total) * 100) : 0,
				color: "#d97706",
			},
			{
				name: "Critical",
				value: critical,
				pct: total ? Math.round((critical / total) * 100) : 0,
				color: "#dc2626",
			},
		],
	};
}

const VENDOR_NAME_MAP: Record<string, string> = {
	...Object.fromEntries(VENDOR_DIRECTORY.map((row) => [row.name, row.id])),
	// Legacy file-run vendor names still present in file-management mocks
	"Apex Industrial Supply": "vnd-1",
	"Horizon Logistics": "vnd-2",
	"NovaTech Components": "vnd-3",
	"GreenField Organics": "vnd-4",
	"Summit Packaging Co.": "vnd-1",
};

export function vendorIdForRun(run: FileRun): string | null {
	if (run.vendorId) return run.vendorId;
	for (const [name, id] of Object.entries(VENDOR_NAME_MAP)) {
		if (run.vendor.startsWith(name) || name.startsWith(run.vendor)) return id;
	}
	return null;
}

export function runsForVendor(
	vendorId: string,
	program?: FileRun["program"]
): FileRun[] {
	if (!isMockEnabled()) return [];
	return FILE_RUNS.filter(
		(run) =>
			vendorIdForRun(run) === vendorId &&
			(program == null || run.program === program)
	);
}

export function getVendorIntegration(
	vendorId: string
): VendorIntegrationProfile {
	return (
		VENDOR_INTEGRATION[vendorId] ?? {
			vendorId,
			vendorType: "Supplier",
			sftpHost: "—",
			timezone: "UTC",
			transmissionMethod: "SFTP",
			encryption: "None",
			fileFormats: [],
			tradingPartnerId: "—",
			slaPercent: 99,
			protocol: "SFTP",
			createdBy: "Admin",
			accountsCount: 0,
			jobsCount: 0,
			alertsCount: 0,
			avgProcessingTime: "—",
			health: "in_progress",
			notes: "No integration profile configured yet.",
		}
	);
}

export function runBucket(status: FileRun["status"]) {
	const label = displayRunStatus(status);
	if (label === "Success") return "success" as const;
	if (label === "Failed") return "failed" as const;
	if (status === "processing") return "in_progress" as const;
	if (status === "warning" || status === "late") return "warning" as const;
	return "pending" as const;
}

export function summarizeRuns(runs: FileRun[]) {
	const total = runs.length;
	const successful = runs.filter(
		(r) => runBucket(r.status) === "success"
	).length;
	const warnings = runs.filter((r) => runBucket(r.status) === "warning").length;
	const failed = runs.filter((r) => runBucket(r.status) === "failed").length;
	const inProgress = runs.filter(
		(r) => runBucket(r.status) === "in_progress"
	).length;
	const pending = runs.filter(
		(r) => runBucket(r.status) === "pending" || r.status === "missing"
	).length;
	return {
		total,
		expected: Math.max(total + 4, total),
		successful,
		warnings,
		failed,
		inProgress,
		pending,
		successPct: total ? ((successful / total) * 100).toFixed(1) : "0.0",
		warningPct: total ? ((warnings / total) * 100).toFixed(1) : "0.0",
		failedPct: total ? ((failed / total) * 100).toFixed(1) : "0.0",
	};
}

export const PROCESSING_TREND = fixtureList([
	{ day: "Jul 18", successful: 18, warnings: 2, failed: 1 },
	{ day: "Jul 19", successful: 20, warnings: 1, failed: 0 },
	{ day: "Jul 20", successful: 17, warnings: 3, failed: 2 },
	{ day: "Jul 21", successful: 22, warnings: 2, failed: 1 },
	{ day: "Jul 22", successful: 19, warnings: 4, failed: 1 },
	{ day: "Jul 23", successful: 21, warnings: 2, failed: 0 },
	{ day: "Jul 24", successful: 23, warnings: 3, failed: 2 },
]);

export const VENDOR_TREND_BY_ID: Record<
	string,
	{ day: string; successful: number; warnings: number; failed: number }[]
> = fixtureRecord({
	"vnd-1": [
		{ day: "Jul 18", successful: 6, warnings: 0, failed: 0 },
		{ day: "Jul 19", successful: 7, warnings: 1, failed: 0 },
		{ day: "Jul 20", successful: 5, warnings: 0, failed: 0 },
		{ day: "Jul 21", successful: 8, warnings: 0, failed: 0 },
		{ day: "Jul 22", successful: 6, warnings: 1, failed: 0 },
		{ day: "Jul 23", successful: 7, warnings: 0, failed: 0 },
		{ day: "Jul 24", successful: 8, warnings: 0, failed: 0 },
	],
	"vnd-2": [
		{ day: "Jul 18", successful: 3, warnings: 1, failed: 1 },
		{ day: "Jul 19", successful: 4, warnings: 0, failed: 0 },
		{ day: "Jul 20", successful: 2, warnings: 2, failed: 1 },
		{ day: "Jul 21", successful: 3, warnings: 1, failed: 0 },
		{ day: "Jul 22", successful: 2, warnings: 1, failed: 1 },
		{ day: "Jul 23", successful: 4, warnings: 0, failed: 0 },
		{ day: "Jul 24", successful: 1, warnings: 1, failed: 2 },
	],
	"vnd-3": [
		{ day: "Jul 18", successful: 5, warnings: 0, failed: 0 },
		{ day: "Jul 19", successful: 4, warnings: 1, failed: 0 },
		{ day: "Jul 20", successful: 5, warnings: 0, failed: 1 },
		{ day: "Jul 21", successful: 6, warnings: 0, failed: 0 },
		{ day: "Jul 22", successful: 4, warnings: 2, failed: 0 },
		{ day: "Jul 23", successful: 5, warnings: 0, failed: 0 },
		{ day: "Jul 24", successful: 5, warnings: 1, failed: 1 },
	],
	"vnd-4": [
		{ day: "Jul 18", successful: 2, warnings: 1, failed: 0 },
		{ day: "Jul 19", successful: 3, warnings: 0, failed: 0 },
		{ day: "Jul 20", successful: 2, warnings: 1, failed: 0 },
		{ day: "Jul 21", successful: 2, warnings: 1, failed: 0 },
		{ day: "Jul 22", successful: 3, warnings: 1, failed: 0 },
		{ day: "Jul 23", successful: 2, warnings: 2, failed: 0 },
		{ day: "Jul 24", successful: 2, warnings: 1, failed: 0 },
	],
});

export type VendorAlert = {
	id: string;
	vendorId: string;
	vendorName: string;
	title: string;
	fileName?: string;
	when: string;
	severity: "error" | "warning" | "info";
	runId?: string;
};

export const VENDOR_ALERTS: VendorAlert[] = fixtureList([
	{
		id: "va1",
		vendorId: "vnd-2",
		vendorName: "CVS Caremark",
		title: "CVS Caremark — pharmacy claims file processing failed.",
		fileName: "NCPDP_CVS_20260724.edi",
		when: "Yesterday 8:25 PM",
		severity: "error",
		runId: "f2",
	},
	{
		id: "va2",
		vendorId: "vnd-3",
		vendorName: "Labcorp",
		title: "Labcorp — lab results feed has 102 warnings.",
		fileName: "LAB_LABCORP_W30.csv",
		when: "Yesterday 7:18 PM",
		severity: "warning",
		runId: "f3",
	},
	{
		id: "va3",
		vendorId: "vnd-1",
		vendorName: "UST Healthcare",
		title: "UST Healthcare — 837 professional file received successfully.",
		fileName: "837P_UST_20260724.edi",
		when: "6:02 AM",
		severity: "info",
		runId: "f6",
	},
	{
		id: "va4",
		vendorId: "vnd-4",
		vendorName: "Avesis",
		title: "Avesis — dental claim schema drift warning.",
		fileName: "837D_AVESIS_DAILY.edi",
		when: "Today 7:50 AM",
		severity: "warning",
		runId: "f5",
	},
	{
		id: "va5",
		vendorId: "vnd-7",
		vendorName: "Change Healthcare",
		title: "Change Healthcare — claims file not delivered.",
		fileName: "837I_CHANGE_20260723.edi",
		when: "Yesterday 9:15 AM",
		severity: "error",
		runId: "f7",
	},
]);

export type AccountFileStatus = "success" | "none" | "warning" | "error";

export type VendorAccountRow = {
	id: string;
	name: string;
	accountId: string;
	lineOfBusiness: "Commercial" | "Medicare" | "Medicaid" | "Marketplace";
	status: "healthy" | "warning" | "error" | "inactive";
	healthScore: number;
	lastFileReceived: string;
	lastFileType: string;
	eligibility: AccountFileStatus;
	medical: AccountFileStatus;
	pharmacy: AccountFileStatus;
	accumulator: AccountFileStatus;
	payerId: string;
	timezone: string;
	openIssues: number;
	active: boolean;
};

const ACCOUNT_NAMES = [
	"Alpha Benefits Group",
	"Beta Health Partners",
	"Cascade Care Network",
	"Delta Employer Trust",
	"Evergreen Health Plan",
	"Frontier Mutual",
	"Gateway Benefits Co",
	"Harbor Group Benefits",
	"Ironwood Insurance",
	"Juniper Health Alliance",
	"Keystone Coverage",
	"Lakeside Employer Plan",
];

const LOBS: VendorAccountRow["lineOfBusiness"][] = [
	"Commercial",
	"Medicare",
	"Medicaid",
	"Marketplace",
];

function fileStatusFor(
	seed: number,
	bias: "good" | "mixed" = "good"
): AccountFileStatus {
	const roll = seed % (bias === "good" ? 10 : 6);
	if (roll === 0) return "none";
	if (roll === 1 && bias === "mixed") return "warning";
	if (roll === 2 && bias === "mixed") return "error";
	return "success";
}

export function getVendorAccounts(vendorId: string): VendorAccountRow[] {
	if (!isMockEnabled()) return [];
	const profile = getVendorIntegration(vendorId);
	const directory = VENDOR_DIRECTORY.find((row) => row.id === vendorId);
	const count = Math.max(
		directory?.linkedAccounts ?? profile.accountsCount,
		profile.accountsCount,
		4
	);

	return Array.from({ length: count }, (_, index) => {
		const seed = vendorId.charCodeAt(vendorId.length - 1) + index * 7;
		const warning = index === 2 || index === 8;
		const inactive = index === count - 1 && count > 8;
		const healthScore = inactive
			? 40
			: warning
				? 68 + (seed % 8)
				: 88 + (seed % 10);
		const lob = LOBS[index % LOBS.length]!;
		const name = ACCOUNT_NAMES[index % ACCOUNT_NAMES.length]!;
		const accountId = `ACC-${1001 + index}`;
		return {
			id: `${vendorId}-acc-${index + 1}`,
			name,
			accountId,
			lineOfBusiness: lob,
			status: inactive
				? "inactive"
				: warning
					? "warning"
					: healthScore >= 85
						? "healthy"
						: "warning",
			healthScore,
			lastFileReceived:
				index === 0
					? "Today, 7:15 AM"
					: index === 1
						? "Today, 6:42 AM"
						: index % 3 === 0
							? "Yesterday, 8:10 PM"
							: `Today, ${6 + (index % 4)}:${String((index * 7) % 60).padStart(2, "0")} AM`,
			lastFileType:
				index % 4 === 0
					? "Eligibility (834)"
					: index % 4 === 1
						? "Medical Claims (837)"
						: index % 4 === 2
							? "Pharmacy Claims (835)"
							: "Accumulator",
			eligibility: fileStatusFor(seed + 1, warning ? "mixed" : "good"),
			medical: fileStatusFor(seed + 2, warning ? "mixed" : "good"),
			pharmacy: fileStatusFor(seed + 3),
			accumulator: fileStatusFor(seed + 4),
			payerId: `PAY-${8200 + index}`,
			timezone: profile.timezone,
			openIssues: warning ? 1 + (seed % 2) : 0,
			active: !inactive,
		};
	});
}

export type VendorConfigJob = {
	id: string;
	name: string;
	fileType: string;
	direction: "Incoming" | "Outgoing";
	frequency: "Daily" | "Weekly" | "Hourly";
	status: "Active" | "Paused";
	lastRun: string;
	nextRun: string;
	lastFileReceived: string;
};

export type VendorSftpConnection = {
	host: string;
	port: number;
	username: string;
	authMethod: string;
	authKey: string;
	lastVerified: string;
	remoteDirectory: string;
	status: "Connected" | "Disconnected";
	testConnection: "Successful" | "Failed";
	connectionName: string;
};

const CONFIG_FILE_TYPES = [
	"Eligibility (834)",
	"Medical Claims (837)",
	"Pharmacy Claims (835)",
	"Accumulator",
] as const;

export function getVendorSftpConnection(
	vendorId: string,
	vendorName?: string
): VendorSftpConnection {
	const profile = getVendorIntegration(vendorId);
	const short =
		(vendorName ?? profile.tradingPartnerId)
			.replace(/[^a-zA-Z0-9]+/g, " ")
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((p) => p.slice(0, 3).toUpperCase())
			.join("") || "VND";
	const host =
		profile.sftpHost === "—"
			? "sftp.partner.example"
			: profile.sftpHost.replace(/\.example$/, ".com");
	return {
		host,
		port: 22,
		username: `${short.toLowerCase()}_mfc`,
		authMethod: "Key Based",
		authKey: `id_rsa_${short.toLowerCase()}`,
		lastVerified: "07/24/2026 6:00 AM",
		remoteDirectory: `/${short}/incoming`,
		status: profile.health === "failed" ? "Disconnected" : "Connected",
		testConnection: profile.health === "failed" ? "Failed" : "Successful",
		connectionName: `${short} - SFTP Connection`,
	};
}

export function getVendorConfigJobs(
	vendorId: string,
	vendorName?: string
): VendorConfigJob[] {
	if (!isMockEnabled()) return [];
	const profile = getVendorIntegration(vendorId);
	const short =
		(vendorName ?? profile.tradingPartnerId)
			.replace(/[^a-zA-Z0-9]+/g, " ")
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? "")
			.join("") || "Vendor";
	const label = vendorName?.split(/\s+/).slice(0, 2).join(" ") ?? short;
	const count = Math.min(Math.max(profile.jobsCount || 4, 4), 4);

	return Array.from({ length: count }, (_, index) => {
		const fileType = CONFIG_FILE_TYPES[index % CONFIG_FILE_TYPES.length]!;
		const frequency =
			index % 3 === 0 ? "Weekly" : index % 2 === 0 ? "Daily" : "Daily";
		return {
			id: `${vendorId}-job-${index + 1}`,
			name: `${label} - ${fileType.split(" (")[0]} Import`,
			fileType,
			direction: "Incoming" as const,
			frequency: frequency as VendorConfigJob["frequency"],
			status: "Active" as const,
			lastRun:
				index === 0
					? "Today, 6:00 AM"
					: index === 1
						? "Today, 5:30 AM"
						: `Yesterday, ${8 + index}:00 AM`,
			nextRun:
				frequency === "Weekly"
					? "Mon, 6:00 AM"
					: `Tomorrow, ${6 + (index % 2)}:00 AM`,
			lastFileReceived:
				index === 0
					? "Today, 6:05 AM"
					: index === 1
						? "Today, 5:42 AM"
						: `Yesterday, ${8 + index}:12 AM`,
		};
	});
}
