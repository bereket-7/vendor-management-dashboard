import type { TpaTpvRow } from "./work-queue-types";

export type EscalationStatus =
	| "none"
	| "escalation_required"
	| "attention"
	| "escalated"
	| "resolved";

export const ESCALATION_STATUS_LABEL: Record<EscalationStatus, string> = {
	none: "—",
	escalation_required: "Escalation Required",
	attention: "Attention",
	escalated: "Escalated",
	resolved: "Resolved",
};

/** User-settable escalation values (detail + dashboard filters). */
export const ESCALATION_STATUS_SELECT_OPTIONS = [
	"escalated",
	"resolved",
] as const satisfies readonly EscalationStatus[];

export type SelectableEscalationStatus =
	(typeof ESCALATION_STATUS_SELECT_OPTIONS)[number];

export function isSelectableEscalationStatus(
	status: EscalationStatus
): status is SelectableEscalationStatus {
	return (
		ESCALATION_STATUS_SELECT_OPTIONS as readonly EscalationStatus[]
	).includes(status);
}

export type AnalystProgressRow = {
	analyst: string;
	analystId?: string | null;
	assigned: number;
	sftpComplete: number;
	sftpPct: number;
	ediComplete: number;
	ediPct: number;
	inProgress: number;
	inProgressPct: number;
	blockedEscalated: number;
	blockedPct: number;
};

export type EscalationSummary = {
	escalation_required: number;
	attention: number;
	escalated: number;
	resolved: number;
};

const SFTP_DONE = 100;
const EDI_DONE = 100;

export function hasProgressData(row: TpaTpvRow): boolean {
	if (row.sftpProgress.percent > 0 || row.ediProgress.percent > 0) return true;
	return (
		row.sftpProgress.milestones.some((m) => m.completedAt) ||
		row.ediProgress.milestones.some((m) => m.completedAt)
	);
}

/** True when no row has milestone progress (live mode before progress API). */
export function rowsUseStatusEstimatedProgress(rows: TpaTpvRow[]): boolean {
	return rows.length > 0 && rows.every((row) => !hasProgressData(row));
}

function isSftpCompleteByStatus(row: TpaTpvRow): boolean {
	return row.status === "ready" || row.status === "production_ready";
}

function isEdiCompleteByStatus(row: TpaTpvRow): boolean {
	return row.status === "production_ready";
}

export function isSftpComplete(row: TpaTpvRow): boolean {
	if (hasProgressData(row)) return row.sftpProgress.percent >= SFTP_DONE;
	return isSftpCompleteByStatus(row);
}

export function isEdiComplete(row: TpaTpvRow): boolean {
	if (hasProgressData(row)) return row.ediProgress.percent >= EDI_DONE;
	return isEdiCompleteByStatus(row);
}

export function isInProgressRow(row: TpaTpvRow): boolean {
	if (row.status === "not_started") return false;
	if (isSftpComplete(row) && isEdiComplete(row)) return false;
	return true;
}

export function isBlockedOrEscalated(row: TpaTpvRow): boolean {
	if (row.status === "exception") return true;
	const status = row.escalationStatus ?? "none";
	return (
		status === "escalation_required" ||
		status === "attention" ||
		status === "escalated"
	);
}

export function deriveEscalationStatus(row: TpaTpvRow): EscalationStatus {
	if (row.escalationStatus && row.escalationStatus !== "none") {
		return row.escalationStatus;
	}
	if (row.status === "exception") return "escalation_required";
	if (row.status === "need_testing") return "attention";
	if (row.status === "waiting_on_vendor") {
		if (hasProgressData(row)) {
			const secondSent = row.sftpProgress.milestones.some(
				(m) => m.key === "second_contact_sent" && m.completedAt
			);
			const response = row.sftpProgress.milestones.some(
				(m) => m.key === "response_received" && m.completedAt
			);
			if (secondSent && !response) return "escalation_required";
		} else {
			return "attention";
		}
	}
	return "none";
}

export function summarizeAnalystProgress(
	rows: TpaTpvRow[]
): AnalystProgressRow[] {
	const byAnalyst = new Map<string, TpaTpvRow[]>();

	for (const row of rows) {
		const name = row.assignedAnalyst?.trim() || "Unassigned";
		const bucket = byAnalyst.get(name) ?? [];
		bucket.push(row);
		byAnalyst.set(name, bucket);
	}

	const analysts = Array.from(byAnalyst.entries())
		.filter(([name]) => name !== "Unassigned")
		.sort(([a], [b]) => a.localeCompare(b));

	const unassigned = byAnalyst.get("Unassigned");

	const result: AnalystProgressRow[] = analysts.map(([analyst, group]) => {
		const assigned = group.length;
		const sftpComplete = group.filter(isSftpComplete).length;
		const ediComplete = group.filter(isEdiComplete).length;
		const inProgress = group.filter(isInProgressRow).length;
		const blockedEscalated = group.filter(isBlockedOrEscalated).length;
		const pct = (n: number) =>
			assigned ? Math.round((n / assigned) * 100) : 0;
		return {
			analyst,
			assigned,
			sftpComplete,
			sftpPct: pct(sftpComplete),
			ediComplete,
			ediPct: pct(ediComplete),
			inProgress,
			inProgressPct: pct(inProgress),
			blockedEscalated,
			blockedPct: pct(blockedEscalated),
		};
	});

	if (unassigned?.length) {
		result.push({
			analyst: "Unassigned",
			assigned: unassigned.length,
			sftpComplete: 0,
			sftpPct: 0,
			ediComplete: 0,
			ediPct: 0,
			inProgress: 0,
			inProgressPct: 0,
			blockedEscalated: 0,
			blockedPct: 0,
		});
	}

	return result;
}

export function summarizeEscalations(rows: TpaTpvRow[]): EscalationSummary {
	const summary: EscalationSummary = {
		escalation_required: 0,
		attention: 0,
		escalated: 0,
		resolved: 0,
	};
	for (const row of rows) {
		const status = row.escalationStatus ?? "none";
		if (status === "none") continue;
		if (status in summary) summary[status] += 1;
	}
	return summary;
}

export function countActiveEscalations(rows: TpaTpvRow[]): number {
	return rows.filter((row) => {
		const status = row.escalationStatus ?? "none";
		return (
			status === "escalation_required" ||
			status === "attention" ||
			status === "escalated"
		);
	}).length;
}

export type EscalationListItem = {
	id: string;
	name: string;
	code: string;
	assignedAnalyst: string;
	reason: string;
	status: EscalationStatus;
	lastUpdated: string;
};

export function deriveEscalationReason(row: TpaTpvRow): string {
	const status = row.escalationStatus ?? "none";
	if (status === "none") return "—";

	if (!hasProgressData(row)) {
		if (row.status === "exception") return "Migration exception / blocker";
		if (row.status === "waiting_on_vendor") {
			return "Waiting on vendor — follow-up required";
		}
		if (row.status === "need_testing") {
			return "Testing readiness pending";
		}
		if (status === "attention") return "Approaching escalation threshold";
		if (status === "escalated") return "Escalated to senior team / management";
		if (status === "resolved") return "Blocker cleared";
		return "Follow-up required";
	}

	const milestones = row.sftpProgress.milestones;
	const secondSent = milestones.some(
		(m) => m.key === "second_contact_sent" && m.completedAt
	);
	const response = milestones.some(
		(m) => m.key === "response_received" && m.completedAt
	);
	const sftpConfirmed = milestones.some(
		(m) => m.key === "sftp_confirmed" && m.completedAt
	);
	const credentials = milestones.some(
		(m) => m.key === "credentials_provided" && m.completedAt
	);
	const ipWhitelist = milestones.some(
		(m) => m.key === "ip_whitelisted" && m.completedAt
	);

	if (status === "escalation_required" && secondSent && !response) {
		return "Second contact sent — no vendor response";
	}
	if (row.status === "exception") return "Migration exception / blocker";
	if (!sftpConfirmed && secondSent && !response) {
		return "SFTP setup stalled — awaiting vendor response";
	}
	if (sftpConfirmed && !credentials) return "Credentials not received";
	if (!ipWhitelist && response) return "IP whitelist delay";
	if (row.status === "testing" || row.status === "need_testing") {
		return "Testing / configuration blocker";
	}
	if (status === "attention") return "Approaching escalation threshold";
	if (status === "escalated") return "Escalated to senior team / management";
	if (status === "resolved") return "Blocker cleared";
	return "Follow-up required";
}

export function listEscalationItems(
	rows: TpaTpvRow[],
	filter: EscalationStatus | "all" = "all"
): EscalationListItem[] {
	return rows
		.map((row) => ({
			id: row.id,
			name: row.name,
			code: row.code,
			assignedAnalyst: row.assignedAnalyst || "Unassigned",
			reason: deriveEscalationReason(row),
			status: row.escalationStatus ?? "none",
			lastUpdated: row.lastUpdated || "—",
		}))
		.filter((item) => item.status !== "none")
		.filter((item) => filter === "all" || item.status === filter)
		.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
}

export function analystInitials(name: string): string {
	if (name === "Unassigned") return "—";
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

const ANALYST_AVATAR_TONE: Record<string, string> = {
	"Sarah Johnson": "bg-sky-100 text-sky-800 ring-sky-200",
	"Priya Patel": "bg-violet-100 text-violet-800 ring-violet-200",
	"James Okoro": "bg-amber-100 text-amber-900 ring-amber-200",
	Unassigned: "bg-muted text-muted-foreground ring-border",
};

export function analystAvatarTone(name: string): string {
	return (
		ANALYST_AVATAR_TONE[name] ?? "bg-slate-100 text-slate-800 ring-slate-200"
	);
}
