import type {
	EscalatedTo,
	EscalationReason,
	EscalationWorkflowStatus,
	IpWhitelistingStatus,
	OperationalStatus,
} from "./lib/work-queue-detail-tabs";
import type { ConnectionProgress } from "./progress-data";
import type { EscalationStatus } from "./work-queue-analyst-escalation";

export type WhitelistStatus = "complete" | "pending" | "not_started";

export type MigrationStatus =
	| "waiting_on_vendor"
	| "testing"
	| "need_testing"
	| "ready"
	| "production_ready"
	| "not_started"
	| "exception";

export type VendorType = "TPA" | "TPV";

export type HistoryEvent = {
	id: string;
	at: string;
	message: string;
	tone: "orange" | "purple" | "green" | "blue" | "red";
};

export type TpaTpvRow = {
	id: string;
	wave: number;
	name: string;
	code: string;
	type: VendorType;
	serverType: string;
	contactEmail: string;
	whitelistStatus: WhitelistStatus;
	lastCommunication: string;
	status: MigrationStatus;
	assignedAnalyst: string;
	assignedToId?: string | null;
	escalationStatus?: EscalationStatus;
	lastUpdated: string;
	notes: string;
	primaryContact: string;
	primaryEmail: string;
	primaryPhone: string;
	secondaryContact: string;
	secondaryEmail: string;
	secondaryPhone: string;
	migrationStartDate: string;
	waitingOnVendorDate: string;
	currentStage: string;
	nextStep: string;
	history: HistoryEvent[];
	sftpProgress: ConnectionProgress;
	ediProgress: ConnectionProgress;
	/** From `metadata.source_system` when integration layer sets it. */
	sourceSystem?: string;
	/** From `metadata.last_synced_at` (or aliases) when integration layer sets it. */
	lastSyncedAt?: string;
	/** Doc-aligned operational status (metadata or derived from migration status). */
	operationalStatus?: OperationalStatus;
	/** Doc-aligned IP whitelisting stage (metadata + whitelist status). */
	ipWhitelistingStatus?: IpWhitelistingStatus;
	/** Whether case is escalated per escalation tab rules. */
	escalated?: boolean;
	escalationReason?: EscalationReason | "";
	escalatedTo?: EscalatedTo | "";
	escalationWorkflowStatus?: EscalationWorkflowStatus;
	blockerStatus?: string;
	blockerReason?: string;
	blockerNotes?: string;
	escalatedAt?: string;
	/** Raw case metadata for merge-on-update. */
	metadata?: Record<string, unknown>;
	ediAnalystId?: string;
	ediAnalystName?: string;
	ediAnalystAssignedAt?: string;
	ediAnalystAssignedBy?: string;
	ediAnalystPreviousId?: string;
	ediAnalystPreviousName?: string;
};

export const MIGRATION_STATUS_LABEL: Record<MigrationStatus, string> = {
	waiting_on_vendor: "Waiting on Vendor",
	testing: "Testing",
	need_testing: "Need Testing",
	ready: "Ready",
	production_ready: "Production Ready",
	not_started: "Not Started",
	exception: "Exception",
};

export const WHITELIST_STATUS_LABEL: Record<WhitelistStatus, string> = {
	complete: "Complete",
	pending: "Pending",
	not_started: "Not Started",
};

/** Fallback KPI cards before API data loads. */
export const WORK_QUEUE_KPI = [
	{
		id: "assigned",
		label: "Assigned TPA/TPV",
		count: 0,
		tone: "blue" as const,
	},
	{
		id: "connected",
		label: "Connected",
		count: 0,
		tone: "green" as const,
	},
	{
		id: "testing",
		label: "Testing",
		count: 0,
		tone: "purple" as const,
	},
	{
		id: "exceptions",
		label: "Blocked",
		count: 0,
		tone: "red" as const,
	},
	{
		id: "escalations",
		label: "Escalations",
		count: 0,
		tone: "red" as const,
	},
	{
		id: "not_started",
		label: "Not Started",
		count: 0,
		tone: "slate" as const,
	},
];
