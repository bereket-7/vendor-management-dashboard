import type {
	MigrationStatus,
	TpaTpvRow,
	WhitelistStatus,
} from "../work-queue-types";

export type OperationalStatus = "not_started" | "in_progress" | "completed";

export type IpWhitelistingStatus =
	| "not_required"
	| "not_started"
	| "in_progress"
	| "completed";

export type EscalationWorkflowStatus = "submitted" | "in_progress" | "resolved";

export type EscalatedTo =
	| "internal_team"
	| "it"
	| "management"
	| "tpa_tpv"
	| "other";

export type EscalationReason =
	| "second_contact_no_response"
	| "sftp_blocker"
	| "credentials_not_received"
	| "ip_whitelist_delay"
	| "configuration_blocker"
	| "testing_failure"
	| "other";

export const OPERATIONAL_STATUS_LABEL: Record<OperationalStatus, string> = {
	not_started: "Not Started",
	in_progress: "In Progress",
	completed: "Completed",
};

export const IP_WHITELISTING_LABEL: Record<IpWhitelistingStatus, string> = {
	not_required: "Not Required",
	not_started: "Not Started",
	in_progress: "In Progress",
	completed: "Completed",
};

export const ESCALATION_WORKFLOW_LABEL: Record<
	EscalationWorkflowStatus,
	string
> = {
	submitted: "Submitted",
	in_progress: "In Progress",
	resolved: "Resolved",
};

export const ESCALATED_TO_LABEL: Record<EscalatedTo, string> = {
	internal_team: "Internal Team",
	it: "IT",
	management: "Management",
	tpa_tpv: "TPA/TPV",
	other: "Other",
};

export const ESCALATION_REASON_LABEL: Record<EscalationReason, string> = {
	second_contact_no_response: "No Response from TPA/TPV",
	sftp_blocker: "SFTP Blocker",
	credentials_not_received: "Credentials Not Received",
	ip_whitelist_delay: "IP Whitelisting Delay",
	configuration_blocker: "Configuration Blocker",
	testing_failure: "Testing Failure",
	other: "Other",
};

export const OPERATIONAL_STATUS_OPTIONS = Object.keys(
	OPERATIONAL_STATUS_LABEL
) as OperationalStatus[];

export const IP_WHITELISTING_OPTIONS = Object.keys(
	IP_WHITELISTING_LABEL
) as IpWhitelistingStatus[];

export const ESCALATION_WORKFLOW_OPTIONS = Object.keys(
	ESCALATION_WORKFLOW_LABEL
) as EscalationWorkflowStatus[];

export const ESCALATED_TO_OPTIONS = Object.keys(
	ESCALATED_TO_LABEL
) as EscalatedTo[];

export const ESCALATION_REASON_OPTIONS = Object.keys(
	ESCALATION_REASON_LABEL
) as EscalationReason[];

function asOperationalStatus(value: unknown): OperationalStatus | undefined {
	if (
		value === "not_started" ||
		value === "in_progress" ||
		value === "completed"
	) {
		return value;
	}
	return undefined;
}

function asIpWhitelistingStatus(
	value: unknown
): IpWhitelistingStatus | undefined {
	if (
		value === "not_required" ||
		value === "not_started" ||
		value === "in_progress" ||
		value === "completed"
	) {
		return value;
	}
	return undefined;
}

function asEscalationWorkflowStatus(
	value: unknown
): EscalationWorkflowStatus | undefined {
	if (
		value === "submitted" ||
		value === "in_progress" ||
		value === "resolved"
	) {
		return value;
	}
	return undefined;
}

function asEscalatedTo(value: unknown): EscalatedTo | undefined {
	if (
		value === "internal_team" ||
		value === "it" ||
		value === "management" ||
		value === "tpa_tpv" ||
		value === "other"
	) {
		return value;
	}
	return undefined;
}

function asEscalationReason(value: unknown): EscalationReason | undefined {
	if (
		value === "second_contact_no_response" ||
		value === "sftp_blocker" ||
		value === "credentials_not_received" ||
		value === "ip_whitelist_delay" ||
		value === "configuration_blocker" ||
		value === "testing_failure" ||
		value === "other"
	) {
		return value;
	}
	return undefined;
}

export function operationalStatusFromMigration(
	status: MigrationStatus
): OperationalStatus {
	if (status === "not_started") return "not_started";
	if (status === "ready" || status === "production_ready") return "completed";
	return "in_progress";
}

export function ipWhitelistingFromWhitelist(
	whitelistStatus: WhitelistStatus,
	metadata?: Record<string, unknown> | null
): IpWhitelistingStatus {
	const fromMeta = asIpWhitelistingStatus(metadata?.ip_whitelisting_status);
	if (fromMeta) return fromMeta;
	if (metadata?.ip_whitelisting_not_required === true) return "not_required";
	if (whitelistStatus === "complete") return "completed";
	if (whitelistStatus === "pending") return "in_progress";
	return "not_started";
}

export function whitelistStatusFromIpWhitelisting(
	status: IpWhitelistingStatus
): WhitelistStatus {
	if (status === "completed") return "complete";
	if (status === "in_progress") return "pending";
	return "not_started";
}

export function isCaseEscalated(
	blockerStatus: string | undefined,
	escalationStatus: string | undefined,
	metadata?: Record<string, unknown> | null
): boolean {
	if (metadata?.escalated === true) return true;
	const status = blockerStatus || escalationStatus || "none";
	return (
		status === "escalated" ||
		status === "escalation_required" ||
		status === "attention"
	);
}

export function escalationWorkflowFromCase(
	blockerStatus: string | undefined,
	metadata?: Record<string, unknown> | null
): EscalationWorkflowStatus {
	const fromMeta = asEscalationWorkflowStatus(
		metadata?.escalation_workflow_status
	);
	if (fromMeta) return fromMeta;
	if (blockerStatus === "resolved") return "resolved";
	if (
		blockerStatus === "escalated" ||
		blockerStatus === "escalation_required"
	) {
		return "in_progress";
	}
	return "submitted";
}

export function escalationReasonFromCase(
	blockerReason: string | null | undefined,
	metadata?: Record<string, unknown> | null
): EscalationReason | "" {
	const fromMeta = asEscalationReason(metadata?.escalation_reason);
	if (fromMeta) return fromMeta;
	const fromBlocker = asEscalationReason(blockerReason);
	return fromBlocker ?? "";
}

export function escalatedToFromMetadata(
	metadata?: Record<string, unknown> | null
): EscalatedTo | "" {
	return asEscalatedTo(metadata?.escalated_to) ?? "";
}

export function ediAnalystFieldsFromMetadata(
	metadata?: Record<string, unknown> | null
): {
	ediAnalystId: string;
	ediAnalystAssignedAt: string;
	ediAnalystAssignedBy: string;
	ediAnalystPreviousId: string;
	ediAnalystPreviousName: string;
} {
	const meta = metadata ?? {};
	const ediAnalystId =
		typeof meta.edi_analyst_id === "string" ? meta.edi_analyst_id : "";
	const ediAnalystAssignedAt =
		typeof meta.edi_analyst_assigned_at === "string"
			? meta.edi_analyst_assigned_at
			: "";
	const ediAnalystAssignedBy =
		typeof meta.edi_analyst_assigned_by === "string"
			? meta.edi_analyst_assigned_by
			: "";
	const ediAnalystPreviousId =
		typeof meta.edi_analyst_previous_id === "string"
			? meta.edi_analyst_previous_id
			: "";
	const ediAnalystPreviousName =
		typeof meta.edi_analyst_previous_name === "string"
			? meta.edi_analyst_previous_name
			: "";
	return {
		ediAnalystId,
		ediAnalystAssignedAt,
		ediAnalystAssignedBy,
		ediAnalystPreviousId,
		ediAnalystPreviousName,
	};
}

export function mergeCaseMetadata(
	existing: Record<string, unknown> | undefined | null,
	patch: Record<string, unknown>
): Record<string, unknown> {
	return { ...(existing ?? {}), ...patch };
}

export function tabFieldsFromDto(
	dto: {
		migration_status?: string;
		whitelist_status?: string;
		blocker_status?: string;
		escalation_status?: string;
		blocker_reason?: string | null;
		blocker_notes?: string;
		escalated_at?: string | null;
		metadata?: Record<string, unknown>;
	},
	migrationStatus: MigrationStatus,
	whitelistStatus: WhitelistStatus
): Pick<
	TpaTpvRow,
	| "operationalStatus"
	| "ipWhitelistingStatus"
	| "escalated"
	| "escalationReason"
	| "escalatedTo"
	| "escalationWorkflowStatus"
	| "blockerStatus"
	| "blockerReason"
	| "blockerNotes"
	| "escalatedAt"
	| "metadata"
	| "ediAnalystId"
	| "ediAnalystName"
	| "ediAnalystAssignedAt"
	| "ediAnalystAssignedBy"
	| "ediAnalystPreviousId"
	| "ediAnalystPreviousName"
> {
	const metadata = dto.metadata ?? {};
	const blockerStatus = dto.blocker_status ?? dto.escalation_status ?? "none";
	const ediFields = ediAnalystFieldsFromMetadata(metadata);
	const ediAnalystName =
		typeof metadata.edi_analyst_name === "string"
			? metadata.edi_analyst_name
			: "";

	return {
		metadata,
		operationalStatus:
			asOperationalStatus(metadata.operational_status) ??
			operationalStatusFromMigration(migrationStatus),
		ipWhitelistingStatus: ipWhitelistingFromWhitelist(
			whitelistStatus,
			metadata
		),
		escalated: isCaseEscalated(
			dto.blocker_status,
			dto.escalation_status,
			metadata
		),
		escalationReason: escalationReasonFromCase(dto.blocker_reason, metadata),
		escalatedTo: escalatedToFromMetadata(metadata),
		escalationWorkflowStatus: escalationWorkflowFromCase(
			blockerStatus,
			metadata
		),
		blockerStatus,
		blockerReason: dto.blocker_reason ?? "",
		blockerNotes: dto.blocker_notes ?? "",
		escalatedAt: dto.escalated_at ?? "",
		ediAnalystId: ediFields.ediAnalystId,
		ediAnalystName,
		ediAnalystAssignedAt: ediFields.ediAnalystAssignedAt,
		ediAnalystAssignedBy: ediFields.ediAnalystAssignedBy,
		ediAnalystPreviousId: ediFields.ediAnalystPreviousId,
		ediAnalystPreviousName: ediFields.ediAnalystPreviousName,
	};
}
