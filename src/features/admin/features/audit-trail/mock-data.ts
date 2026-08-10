import { isMockEnabled } from "@/lib/mock-mode";

export type AuditActionType = "Updated" | "Created" | "Deleted" | "Login";

export type AuditModule =
	| "Configuration"
	| "Job"
	| "Account"
	| "Mapping"
	| "Access"
	| "File";

export type AuditActivity = {
	id: string;
	at: string;
	user: string;
	action: AuditActionType;
	module: AuditModule;
	details: string;
	ipAddress: string;
	vendorId?: string;
	vendorName?: string;
};

const USERS = [
	"System",
	"Alex Chen",
	"Jordan Lee",
	"Priya Patel",
	"Sam Okonkwo",
	"Taylor Brooks",
	"Morgan Ellis",
] as const;

const DETAIL_TEMPLATES: Record<AuditActionType, string[]> = {
	Updated: [
		"Updated SFTP port from 21 to 22",
		"Changed job frequency from Weekly to Daily",
		"Updated remote directory path",
		"Modified alert threshold for late files",
		"Updated PGP key rotation schedule",
		"Changed account line of business mapping",
	],
	Created: [
		"Created new Eligibility (834) import job",
		"Added file mapping for Medical Claims (837)",
		"Created schedule for Accumulator feed",
		"Added new linked account ACC-1012",
		"Created SLA breach alert rule",
	],
	Deleted: [
		"Deleted unused pharmacy claims schedule",
		"Removed stale file mapping version",
		"Deleted paused test job",
		"Removed obsolete alert rule",
	],
	Login: [
		"User login successful",
		"Admin session started",
		"User login from trusted network",
		"Password reset completed",
	],
};

const MODULE_BY_ACTION: Record<AuditActionType, AuditModule[]> = {
	Updated: ["Configuration", "Job", "Account", "Mapping", "File"],
	Created: ["Job", "Account", "Mapping", "Configuration"],
	Deleted: ["Job", "Mapping", "Configuration"],
	Login: ["Access"],
};

function pad(n: number) {
	return String(n).padStart(2, "0");
}

function formatAuditDate(date: Date) {
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const year = date.getFullYear();
	let hours = date.getHours();
	const minutes = pad(date.getMinutes());
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12 || 12;
	return `${month}/${day}/${year} ${pad(hours)}:${minutes} ${ampm}`;
}

function ipFor(seed: number) {
	return `10.10.${(seed % 20) + 1}.${(seed % 200) + 10}`;
}

export function buildAuditActivities(options?: {
	vendorId?: string;
	vendorName?: string;
	count?: number;
}): AuditActivity[] {
	if (!isMockEnabled()) return [];
	const count = options?.count ?? (options?.vendorId ? 48 : 128);
	const actions: AuditActionType[] = ["Updated", "Created", "Deleted", "Login"];

	return Array.from({ length: count }, (_, index) => {
		const action = actions[index % actions.length]!;
		const modules = MODULE_BY_ACTION[action];
		const auditModule = modules[index % modules.length]!;
		const detailsList = DETAIL_TEMPLATES[action];
		const details = detailsList[index % detailsList.length]!;
		const user =
			action === "Login" && index % 5 === 0
				? "System"
				: USERS[index % USERS.length]!;
		const date = new Date(2026, 6, 24, 9, 15);
		date.setMinutes(date.getMinutes() - index * 37);
		return {
			id: `audit-${options?.vendorId ?? "global"}-${index + 1}`,
			at: formatAuditDate(date),
			user,
			action,
			module: auditModule,
			details: options?.vendorName
				? details
				: index % 4 === 0
					? `${details} · Apex Supply`
					: details,
			ipAddress: ipFor(index + 3),
			vendorId: options?.vendorId,
			vendorName: options?.vendorName,
		};
	});
}

export function summarizeAuditActivities(rows: AuditActivity[]) {
	const users = new Set(rows.map((r) => r.user)).size;
	const configuration = rows.filter((r) => r.module === "Configuration").length;
	const fileJob = rows.filter(
		(r) => r.module === "File" || r.module === "Job"
	).length;
	const access = rows.filter((r) => r.module === "Access").length;
	return {
		total: rows.length,
		users,
		configuration,
		fileJob,
		access,
	};
}
