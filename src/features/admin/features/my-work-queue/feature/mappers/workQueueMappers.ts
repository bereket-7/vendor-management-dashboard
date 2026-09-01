import type {
	MigrationCaseDto,
	MigrationCaseEventDto,
	MigrationCaseProgressDto,
	WorkQueueAnalystStatsRowDto,
	WorkQueueBlockerRowDto,
	WorkQueueKpisDto,
	WorkQueueProgressSummaryDto,
} from "@/lib/vendor-core/types";

import {
	type HistoryEvent,
	type MigrationStatus,
	type TpaTpvRow,
	type VendorType,
	WORK_QUEUE_KPI,
	type WhitelistStatus,
} from "../../work-queue-types";
import {
	type AnalystProgressRow,
	type EscalationStatus,
	type EscalationSummary,
} from "../../work-queue-analyst-escalation";
import {
	EMPTY_EDI_PROGRESS,
	EMPTY_SFTP_PROGRESS,
	type ConnectionProgress,
	type ProgressTrack,
	progressFromMilestones,
} from "../../progress-data";

const STAGE_LABEL: Record<string, string> = {
	not_started: "Not Started",
	data_exchange: "Data Exchange",
	connectivity_testing: "Connectivity Testing",
	whitelist_review: "Whitelist Review",
	contract_review: "Contract Review",
	go_live_readiness: "Go-Live Readiness",
	exception_handling: "Exception Handling",
	production: "Production",
};

const STAGE_FROM_LABEL: Record<string, string> = Object.fromEntries(
	Object.entries(STAGE_LABEL).map(([k, v]) => [v.toLowerCase(), k])
);

const HISTORY_TONES = new Set(["orange", "purple", "green", "blue", "red"]);

export const CURRENT_STAGE_OPTIONS = Object.entries(STAGE_LABEL).map(
	([value, label]) => ({ value, label })
);

export function stageToApi(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "not_started";
	if (STAGE_LABEL[trimmed]) return trimmed;
	return STAGE_FROM_LABEL[trimmed.toLowerCase()] ?? "not_started";
}

export function stageToLabel(value: string): string {
	return STAGE_LABEL[value] ?? value;
}

export function vendorTypeToApi(type: VendorType | string): "tpa" | "tpv" {
	return String(type).toLowerCase() === "tpv" ? "tpv" : "tpa";
}

export function vendorTypeToUi(type: string): VendorType {
	return type.toLowerCase() === "tpv" ? "TPV" : "TPA";
}

/** Accept MM/DD/YYYY or ISO; emit YYYY-MM-DD for API date fields. */
export function dateToApi(value: string): string | null {
	const v = value.trim();
	if (!v) return null;
	if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
	const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (m?.[1] && m[2] && m[3]) {
		const mm = m[1].padStart(2, "0");
		const dd = m[2].padStart(2, "0");
		const yyyy = m[3];
		return `${yyyy}-${mm}-${dd}`;
	}
	const parsed = new Date(v);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string | null | undefined): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) {
		if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
			const [y, m, day] = iso.split("-");
			return `${m}/${day}/${y}`;
		}
		return iso;
	}
	return d.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

function formatDisplayDateTime(iso: string | null | undefined): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function analystName(assigned: MigrationCaseDto["assigned_to"]): string {
	if (!assigned) return "Unassigned";
	return (
		assigned.full_name?.trim() ||
		[assigned.first_name, assigned.last_name]
			.filter(Boolean)
			.join(" ")
			.trim() ||
		assigned.username ||
		assigned.email ||
		"Unassigned"
	);
}

function progressUserName(
	user: MigrationCaseProgressDto["updated_by"]
): string {
	if (!user) return "";
	return (
		user.full_name?.trim() ||
		[user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
		user.username ||
		user.email ||
		""
	);
}

function progressDtoToConnection(
	dto: MigrationCaseProgressDto | undefined,
	fallback: ConnectionProgress
): ConnectionProgress {
	if (!dto) return fallback;

	const milestones =
		dto.milestones.length > 0
			? dto.milestones.map((m) => ({
					key: m.key,
					label: m.label,
					weightPercent: m.weight_percent,
					completedAt: m.completed_at ? formatDisplayDate(m.completed_at) : null,
				}))
			: fallback.milestones;

	const fromMilestones = progressFromMilestones(milestones, {
		updatedBy: progressUserName(dto.updated_by),
		updatedAt: formatDisplayDateTime(dto.updated_at ?? dto.last_updated_at),
		notes: dto.notes ?? "",
	});

	return {
		...fromMilestones,
		percent: dto.percent ?? fromMilestones.percent,
		currentMilestone:
			dto.current_milestone_label?.trim() || fromMilestones.currentMilestone,
		currentMilestoneKey:
			dto.current_milestone_key?.trim() || fromMilestones.currentMilestoneKey,
		lastUpdated: dto.last_updated_at
			? formatDisplayDate(dto.last_updated_at)
			: fromMilestones.lastUpdated,
		milestones,
	};
}

export function connectionProgressToApiInput(progress: ConnectionProgress) {
	return {
		milestones: progress.milestones.map((m) => ({
			key: m.key,
			completed_at: m.completedAt ? dateToApi(m.completedAt) : null,
		})),
		notes: progress.notes ?? "",
	};
}

function asMigrationStatus(value: string): MigrationStatus {
	const allowed: MigrationStatus[] = [
		"waiting_on_vendor",
		"testing",
		"need_testing",
		"ready",
		"production_ready",
		"not_started",
		"exception",
	];
	return (
		allowed.includes(value as MigrationStatus) ? value : "not_started"
	) as MigrationStatus;
}

function asWhitelistStatus(value: string): WhitelistStatus {
	if (value === "complete" || value === "pending") return value;
	return "not_started";
}

function asEscalationStatus(value: string | undefined): EscalationStatus {
	const allowed: EscalationStatus[] = [
		"none",
		"escalation_required",
		"attention",
		"escalated",
		"resolved",
	];
	return allowed.includes(value as EscalationStatus)
		? (value as EscalationStatus)
		: "none";
}

function integrationFieldsFromMetadata(
	metadata: MigrationCaseDto["metadata"]
): Pick<TpaTpvRow, "sourceSystem" | "lastSyncedAt"> {
	if (!metadata || typeof metadata !== "object") return {};
	const meta = metadata as Record<string, unknown>;
	const sourceSystem =
		typeof meta.source_system === "string"
			? meta.source_system
			: typeof meta.sourceSystem === "string"
				? meta.sourceSystem
				: undefined;
	const rawSync =
		meta.last_synced_at ??
		meta.lastSyncedAt ??
		meta.last_sync ??
		meta.lastSyncAt;
	const lastSyncedAt =
		typeof rawSync === "string" && rawSync.trim()
			? formatDisplayDateTime(rawSync)
			: undefined;
	return { sourceSystem, lastSyncedAt };
}

export function eventDtoToHistory(event: MigrationCaseEventDto): HistoryEvent {
	const tone = HISTORY_TONES.has(event.tone)
		? (event.tone as HistoryEvent["tone"])
		: "blue";
	return {
		id: event.id,
		at: formatDisplayDateTime(event.created_at),
		message: event.message,
		tone,
	};
}

export function migrationCaseToRow(dto: MigrationCaseDto): TpaTpvRow {
	const row: TpaTpvRow = {
		id: dto.id,
		wave: dto.wave ?? 1,
		name: dto.name,
		code: dto.code,
		type: vendorTypeToUi(String(dto.vendor_type)),
		serverType: dto.server_type ?? "",
		contactEmail: dto.primary_email || "",
		whitelistStatus: asWhitelistStatus(String(dto.whitelist_status)),
		lastCommunication: formatDisplayDate(dto.last_communication_at),
		status: asMigrationStatus(String(dto.migration_status)),
		assignedAnalyst: analystName(dto.assigned_to),
		assignedToId: dto.assigned_to?.id ?? null,
		lastUpdated: formatDisplayDateTime(dto.updated_at),
		notes: dto.notes ?? "",
		primaryContact: dto.primary_contact ?? "",
		primaryEmail: dto.primary_email ?? "",
		primaryPhone: dto.primary_phone ?? "",
		secondaryContact: dto.secondary_contact ?? "",
		secondaryEmail: dto.secondary_email ?? "",
		secondaryPhone: dto.secondary_phone ?? "",
		migrationStartDate: formatDisplayDate(dto.migration_start_date),
		waitingOnVendorDate: formatDisplayDate(dto.waiting_on_vendor_date),
		currentStage: stageToLabel(String(dto.current_stage ?? "not_started")),
		nextStep: dto.next_step ?? "",
		history: (dto.events ?? []).map(eventDtoToHistory),
		sftpProgress: progressDtoToConnection(
			dto.sftp_progress,
			EMPTY_SFTP_PROGRESS
		),
		ediProgress: progressDtoToConnection(dto.edi_progress, EMPTY_EDI_PROGRESS),
		escalationStatus: asEscalationStatus(dto.escalation_status),
		...integrationFieldsFromMetadata(dto.metadata),
	};
	return row;
}

export function kpisToCards(kpis: WorkQueueKpisDto) {
	const counts: Record<string, number> = {
		assigned: kpis.assigned,
		connected: kpis.connected,
		migration: kpis.in_migration,
		testing: kpis.testing,
		exceptions: kpis.exceptions,
		escalations: kpis.escalations ?? 0,
		not_started: kpis.not_started,
	};
	return WORK_QUEUE_KPI.map((card) => ({
		...card,
		count: counts[card.id] ?? 0,
	}));
}

export function kpisToProgressSummary(kpis: WorkQueueKpisDto) {
	const sftp = kpis.sftp_completion;
	const edi = kpis.edi_completion;
	return {
		sftp: {
			percent: sftp?.percent ?? 0,
			completeCount: sftp?.complete_count ?? 0,
			totalCount: sftp?.total_count ?? 0,
		},
		edi: {
			percent: edi?.percent ?? 0,
			completeCount: edi?.complete_count ?? 0,
			totalCount: edi?.total_count ?? 0,
		},
	};
}

function analystDisplayName(
	analyst: WorkQueueAnalystStatsRowDto["analyst"]
): string {
	if (!analyst) return "Unassigned";
	return (
		analyst.full_name?.trim() ||
		[analyst.first_name, analyst.last_name].filter(Boolean).join(" ").trim() ||
		analyst.username?.trim() ||
		analyst.email?.trim() ||
		"Unassigned"
	);
}

export function analystStatsToProgressRows(
	rows: WorkQueueAnalystStatsRowDto[]
): AnalystProgressRow[] {
	return rows.map((row) => {
		const analyst = analystDisplayName(row.analyst);
		const assigned = row.assigned_count;
		const pct = (n: number) =>
			assigned ? Math.round((n / assigned) * 100) : 0;
		return {
			analyst,
			analystId: row.analyst?.id ?? null,
			assigned,
			sftpComplete: row.sftp_complete_count,
			sftpPct: pct(row.sftp_complete_count),
			ediComplete: row.edi_complete_count,
			ediPct: pct(row.edi_complete_count),
			inProgress: row.in_progress_count,
			inProgressPct: pct(row.in_progress_count),
			blockedEscalated: row.blocked_escalated_count,
			blockedPct: pct(row.blocked_escalated_count),
		};
	});
}

export function progressSummaryDtoToUi(dto: WorkQueueProgressSummaryDto) {
	return {
		sftp: {
			percent: dto.sftp.percent,
			completeCount: dto.sftp.complete_count,
			totalCount: dto.sftp.total_count,
		},
		edi: {
			percent: dto.edi.percent,
			completeCount: dto.edi.complete_count,
			totalCount: dto.edi.total_count,
		},
	};
}

export function blockerRowsToEscalationSummary(
	rows: WorkQueueBlockerRowDto[]
): EscalationSummary {
	const summary: EscalationSummary = {
		escalation_required: 0,
		attention: 0,
		escalated: 0,
		resolved: 0,
	};
	for (const row of rows) {
		const status = (row.blocker_status ||
			row.escalation_status ||
			"none") as EscalationStatus;
		if (status === "none") continue;
		if (status in summary) summary[status] += 1;
	}
	return summary;
}

export type { ProgressTrack };
