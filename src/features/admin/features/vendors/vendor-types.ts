import type { FileRun } from "@/features/admin/features/file-management/mock-data";

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
	createdAt?: string;
};

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

export type VendorTrendPoint = {
	day: string;
	successful: number;
	warnings: number;
	failed: number;
};

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

export function runBucket(status: FileRun["status"]) {
	if (status === "success") return "success" as const;
	if (status === "failed") return "failed" as const;
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
