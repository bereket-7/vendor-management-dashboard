/**
 * Types for Vendor Management Core (Django) REST envelope + Phase 1 intake domain.
 * Field names match the live API; UI helpers also expose `code` / `name` aliases.
 */

export type ApiEnvelope<T> = {
	status: "success" | "error";
	result: T;
	meta?: { version?: string };
	message?: string;
};

export type PaginatedResult<T> = {
	limit: number;
	offset: number;
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};

export type VendorRef = {
	id: string;
	reference_id?: string;
	vendor_code?: string;
	legal_name?: string;
};

export type VendorDto = {
	id: string;
	reference_id?: string;
	vendor_code: string;
	legal_name: string;
	trade_name?: string | null;
	status: string;
	tier?: string;
	country?: string;
	city?: string;
	metadata?: Record<string, unknown> | null;
	created_at?: string;
	updated_at?: string;
	/** Normalized aliases for UI */
	code: string;
	name: string;
};

export type AccountDto = {
	id: string;
	reference_id?: string;
	vendor: string | VendorRef;
	account_code: string;
	name?: string;
	line_of_business?: string;
	active?: boolean;
	status?: string;
	created_at?: string;
	code: string;
	vendor_id: string;
};

export type CredentialDto = {
	id: string;
	name: string;
	kind: string;
	secret_ref: string;
	created_at?: string;
};

export type ConnectionDto = {
	id: string;
	name: string;
	vendor: string | VendorRef;
	account: string | VendorRef | null;
	method: string;
	direction: string;
	environment: string;
	status: string;
	config: Record<string, unknown>;
	health: {
		last_success_at?: string;
		last_failure_at?: string;
		last_error?: string;
		current_status?: string;
	};
	created_at?: string;
	updated_at?: string;
	vendor_id: string;
};

export type IntakeJobDto = {
	id: string;
	name: string;
	connection: string | { id: string };
	vendor: string | VendorRef;
	account?: string | VendorRef | null;
	file_type: string;
	direction?: string;
	filename_pattern: string;
	path_or_endpoint?: string;
	schedule_cron: string;
	schedule_timezone: string;
	expected_delivery_cron?: string;
	parser?: string;
	validation_profile?: string;
	status: string;
	destination_module: string;
	retry_max?: number;
	retry_interval_seconds?: number;
	alert_on_missing?: boolean;
	alert_on_late?: boolean;
	alert_on_failed?: boolean;
	sla?: Record<string, unknown>;
	remote_file_action?: string;
	metadata?: Record<string, unknown> | null;
	created_at?: string;
	updated_at?: string;
	vendor_id: string;
	connection_id: string;
};

export type IntakeJobRunDto = {
	id: string;
	job: string | { id: string; name?: string };
	trigger: string;
	stage: string;
	started_at?: string | null;
	finished_at?: string | null;
	files_found: number;
	files_downloaded: number;
	files_processed: number;
	files_rejected: number;
	error_summary?: string;
	details?: Record<string, unknown>;
	created_at?: string;
	job_id: string;
};

/** GET /api/v1/member-coverages/list/ — 834 coverage shells from intake. */
export type MemberCoverageDto = {
	id: string;
	reference_id?: string;
	subscriber_id: string;
	group_or_policy_number?: string;
	member_first_name?: string;
	member_last_name?: string;
	maintenance_type_code?: string;
	raw_object_id?: string;
	eligibility_file_id?: string;
	eligibility_file?:
		| string
		| {
				id: string;
				reference_id?: string;
				original_filename?: string;
				vendor?: string | VendorRef | null;
				received_at?: string;
				member_count?: number;
		  };
	is_visible?: boolean;
	deleted_at?: string | null;
	metadata?: Record<string, unknown> | null;
	created_at?: string;
	updated_at?: string;
};

export type InboundFileDto = {
	id: string;
	original_filename: string;
	checksum_sha256?: string;
	size_bytes?: number;
	storage_uri?: string;
	detected_type?: string;
	destination_module?: string;
	stage: string;
	source?: string;
	vendor: string | VendorRef | null;
	job?: string | null;
	run?: string | null;
	connection?: string | null;
	dispatch_status?: string;
	dispatch_correlation_id?: string | null;
	error_count?: number;
	parse_result?: Record<string, unknown> | null;
	duplicate_of?: string | null;
	created_at?: string;
	updated_at?: string;
	vendor_id?: string | null;
};

export type ErrorRecordDto = {
	id: string;
	category: string;
	status: string;
	code?: string;
	stage?: string;
	message?: string;
	detail?: string;
	business_explanation?: string;
	technical_message?: string;
	recommended_action?: string;
	retry_eligible?: boolean;
	retry_count?: number;
	inbound_file?: string | { id: string } | null;
	inbound_file_id?: string | null;
	run?: string | { id: string } | null;
	run_id?: string | null;
	vendor?: string | VendorRef | null;
	owner?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ProviderDto = {
	id: string;
	reference_id?: string;
	roster_file_id?: string;
	roster_file?: string | null;
	vendor_id?: string | null;
	vendor?: string | null;
	npi: string;
	name: string;
	taxonomy?: string;
	entity_type?: string;
	status?: string;
	effective_date?: string | null;
	raw_object_id?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ProviderRosterDto = {
	id: string;
	reference_id?: string;
	vendor_id?: string | null;
	vendor?: string | null;
	source_inbound_file_id?: string | null;
	original_filename?: string;
	received_at?: string;
	provider_count?: number;
	created_at?: string;
	updated_at?: string;
};

export type ClaimLineDto = {
	id: string;
	reference_id?: string;
	vendor_file_id?: string;
	vendor?: string | null;
	batch_id?: string | null;
	batch_number?: string | null;
	file_control_number?: string | null;
	claim_id?: string;
	claim_reference_id: string;
	line_number?: number;
	procedure_code?: string | null;
	revenue_code?: string | null;
	service_date?: string | null;
	billed_amount?: number | string;
	allowed_amount?: number | string | null;
	paid_amount?: number | string | null;
	status?: string;
	denial_reason_code?: string | null;
	created_at?: string;
	updated_at?: string;
};

/** Resolve a vendor id from a nested serializer or plain UUID. */
export function vendorLabel(
	vendor: string | VendorRef | null | undefined,
	nameById?: Map<string, string>
): string {
	if (!vendor) return "—";
	if (typeof vendor === "object") {
		return (
			vendor.legal_name ??
			vendor.vendor_code ??
			nameById?.get(vendor.id) ??
			vendor.id.slice(0, 8)
		);
	}
	return nameById?.get(vendor) ?? vendor.slice(0, 8);
}

export type RoutingRuleDto = {
	id: string;
	name: string;
	priority: number;
	is_active: boolean;
	destination_module: string;
	edi_type?: string | null;
	parser?: string;
};

export type AuditRecordDto = {
	id: string;
	action: string;
	resource_type?: string;
	resource_id?: string;
	actor?: string;
	summary?: string;
	created_at?: string;
};

export type CoreUserDto = {
	id: string;
	username: string;
	email: string;
	first_name?: string;
	last_name?: string;
	full_name?: string;
	phone_number?: string | number | null;
	is_active: boolean;
	is_staff?: boolean;
	is_admin?: boolean;
	is_superuser?: boolean;
	is_visible?: boolean;
	created_at?: string;
	updated_at?: string;
};

export type LoginEventUserRef = {
	id: string;
	username?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	full_name?: string;
};

export type LoginEventDto = {
	id: number | string;
	login_type: string;
	login_type_label?: string;
	username: string;
	user: LoginEventUserRef | string | null;
	remote_ip?: string | null;
	datetime: string;
};

export type MonitoringRunDto = {
	id?: string;
	status?: string;
	stage?: string;
	job__name?: string;
	files_processed?: number;
	files_found?: number;
	started_at?: string;
	finished_at?: string;
	job?: string | { id: string; name?: string };
	connection?: string | { id: string; name?: string };
};

export type MonitoringDashboardDto = {
	connections: ConnectionDto[];
	recent_runs: MonitoringRunDto[];
	inbound_file_stages: { stage: string; count: number }[];
	active_jobs: IntakeJobDto[];
};

export type TokenPair = {
	access: string;
	refresh?: string;
};

export function refId(
	value: string | { id: string } | null | undefined
): string | null {
	if (!value) return null;
	if (typeof value === "string") return value;
	return value.id;
}

export function normalizeVendor(
	raw: Record<string, unknown>
): VendorDto {
	const vendor_code = String(raw.vendor_code ?? raw.code ?? "");
	const legal_name = String(raw.legal_name ?? raw.name ?? "");
	return {
		...(raw as unknown as VendorDto),
		id: String(raw.id),
		vendor_code,
		legal_name,
		status: String(raw.status ?? "active"),
		code: vendor_code,
		name: legal_name || String(raw.trade_name ?? "—"),
	};
}

export function normalizeConnection(
	raw: Record<string, unknown>
): ConnectionDto {
	const vendor = raw.vendor as string | VendorRef;
	const vendor_id = refId(vendor) ?? "";
	return {
		...(raw as unknown as ConnectionDto),
		id: String(raw.id),
		name: String(raw.name ?? ""),
		vendor,
		vendor_id,
		account: (raw.account as ConnectionDto["account"]) ?? null,
		method: String(raw.method ?? ""),
		direction: String(raw.direction ?? ""),
		environment: String(raw.environment ?? ""),
		status: String(raw.status ?? ""),
		config: (raw.config as Record<string, unknown>) ?? {},
		health: (raw.health as ConnectionDto["health"]) ?? {},
	};
}

export function normalizeJob(raw: Record<string, unknown>): IntakeJobDto {
	const vendor = raw.vendor as string | VendorRef;
	const connection = raw.connection as string | { id: string };
	return {
		...(raw as unknown as IntakeJobDto),
		id: String(raw.id),
		name: String(raw.name ?? ""),
		vendor,
		vendor_id: refId(vendor) ?? "",
		connection,
		connection_id: refId(connection) ?? "",
		file_type: String(raw.file_type ?? ""),
		filename_pattern: String(raw.filename_pattern ?? ""),
		schedule_cron: String(raw.schedule_cron ?? ""),
		schedule_timezone: String(raw.schedule_timezone ?? ""),
		status: String(raw.status ?? ""),
		destination_module: String(raw.destination_module ?? ""),
	};
}

export function normalizeJobRun(raw: Record<string, unknown>): IntakeJobRunDto {
	const job = raw.job as string | { id: string; name?: string };
	return {
		...(raw as unknown as IntakeJobRunDto),
		id: String(raw.id),
		job,
		job_id: refId(job) ?? "",
		trigger: String(raw.trigger ?? ""),
		stage: String(raw.stage ?? ""),
		files_found: Number(raw.files_found ?? 0),
		files_downloaded: Number(raw.files_downloaded ?? 0),
		files_processed: Number(raw.files_processed ?? 0),
		files_rejected: Number(raw.files_rejected ?? 0),
		error_summary: String(raw.error_summary ?? ""),
		details: (raw.details as Record<string, unknown>) ?? {},
	};
}

export function normalizeMemberCoverage(
	raw: Record<string, unknown>
): MemberCoverageDto {
	const eligibility_file_id =
		raw.eligibility_file_id != null
			? String(raw.eligibility_file_id)
			: refId(raw.eligibility_file as string | { id: string } | null);
	return {
		...(raw as unknown as MemberCoverageDto),
		id: String(raw.id),
		subscriber_id: String(raw.subscriber_id ?? ""),
		member_first_name: String(raw.member_first_name ?? ""),
		member_last_name: String(raw.member_last_name ?? ""),
		group_or_policy_number: String(raw.group_or_policy_number ?? ""),
		maintenance_type_code: String(raw.maintenance_type_code ?? ""),
		reference_id: raw.reference_id ? String(raw.reference_id) : undefined,
		eligibility_file_id: eligibility_file_id ?? undefined,
	};
}

export function normalizeAccount(raw: Record<string, unknown>): AccountDto {
	const vendor = raw.vendor as string | VendorRef;
	const account_code = String(raw.account_code ?? raw.code ?? "");
	return {
		...(raw as unknown as AccountDto),
		id: String(raw.id),
		vendor,
		vendor_id: refId(vendor) ?? "",
		account_code,
		code: account_code,
		name: String(raw.name ?? account_code),
		status: String(raw.status ?? (raw.active === false ? "inactive" : "active")),
	};
}

export function normalizeInboundFile(
	raw: Record<string, unknown>
): InboundFileDto {
	const vendor = (raw.vendor as string | VendorRef | null) ?? null;
	return {
		...(raw as unknown as InboundFileDto),
		id: String(raw.id),
		original_filename: String(
			raw.original_filename ?? raw.filename ?? raw.name ?? "—"
		),
		stage: String(raw.stage ?? "unknown"),
		vendor,
		vendor_id: refId(vendor),
		error_count:
			raw.error_count != null ? Number(raw.error_count) : undefined,
		source: raw.source != null ? String(raw.source) : undefined,
		detected_type:
			raw.detected_type != null ? String(raw.detected_type) : undefined,
		destination_module:
			raw.destination_module != null
				? String(raw.destination_module)
				: undefined,
	};
}

/** GET /api/v1/inbound-files/{id}/events/ — pipeline timeline entry. */
export type ProcessingEventDto = {
	id: string;
	inbound_file_id?: string | null;
	stage?: string;
	level?: string;
	source?: string;
	message: string;
	detail?: string | null;
	error_code?: string | null;
	member_id?: string | null;
	line_number?: number | null;
	related_record?: string | null;
	created_at?: string;
	occurred_at?: string;
	metadata?: Record<string, unknown> | null;
};

/** GET /api/v1/validation-results/list/ — row-level validation issue. */
export type ValidationResultDto = {
	id: string;
	inbound_file_id?: string | null;
	inbound_file?: string | { id: string } | null;
	validation_profile?: string | null;
	profile?: string | null;
	is_valid?: boolean;
	severity?: string;
	code?: string;
	error_code?: string;
	message?: string;
	description?: string;
	field?: string | null;
	field_name?: string | null;
	line?: number | null;
	line_number?: number | null;
	member_id?: string | null;
	subscriber_id?: string | null;
	received_value?: string | null;
	expected_value?: string | null;
	validation_rule?: string | null;
	recommended_resolution?: string | null;
	created_at?: string;
};

function pickString(raw: Record<string, unknown>, ...keys: string[]): string {
	for (const key of keys) {
		const value = raw[key];
		if (value != null && value !== "") return String(value);
	}
	return "";
}

function pickNumber(
	raw: Record<string, unknown>,
	...keys: string[]
): number | null {
	for (const key of keys) {
		const value = raw[key];
		if (value == null || value === "") continue;
		const n = Number(value);
		if (Number.isFinite(n)) return n;
	}
	return null;
}

export function normalizeProcessingEvent(
	raw: Record<string, unknown>
): ProcessingEventDto {
	const meta = (raw.metadata as Record<string, unknown> | null) ?? null;
	const details =
		(raw.details as Record<string, unknown> | null) ??
		(typeof raw.detail === "object" && raw.detail != null
			? (raw.detail as Record<string, unknown>)
			: null);
	const message = pickString(raw, "message", "summary") || "—";
	return {
		...(raw as unknown as ProcessingEventDto),
		id: String(raw.id ?? `${raw.created_at ?? "evt"}-${message.slice(0, 24)}`),
		inbound_file_id:
			refId(raw.inbound_file as string | { id: string } | null) ??
			(raw.inbound_file_id != null ? String(raw.inbound_file_id) : null),
		stage: pickString(raw, "stage", "pipeline_stage") || undefined,
		level:
			pickString(raw, "level", "severity", "log_level") ||
			(details?.level != null ? String(details.level) : undefined),
		source:
			pickString(raw, "source", "component", "subsystem") ||
			(details?.source != null ? String(details.source) : undefined),
		message,
		detail:
			typeof raw.detail === "string"
				? raw.detail
				: details?.detail != null
					? String(details.detail)
					: meta?.detail != null
						? String(meta.detail)
						: null,
		error_code:
			pickString(raw, "error_code", "code") ||
			(details?.error_code != null ? String(details.error_code) : null) ||
			(details?.code != null ? String(details.code) : null) ||
			(meta?.error_code != null ? String(meta.error_code) : null) ||
			null,
		member_id:
			pickString(raw, "member_id", "subscriber_id") ||
			(details?.member_id != null ? String(details.member_id) : null) ||
			(meta?.member_id != null ? String(meta.member_id) : null) ||
			null,
		line_number:
			pickNumber(raw, "line_number", "line") ??
			pickNumber(details ?? {}, "line_number", "line"),
		related_record:
			pickString(raw, "related_record", "record_id") ||
			(details?.related_record != null
				? String(details.related_record)
				: null) ||
			(meta?.related_record != null ? String(meta.related_record) : null) ||
			null,
		created_at:
			pickString(raw, "created_at", "occurred_at", "timestamp") || undefined,
		occurred_at:
			pickString(raw, "occurred_at", "created_at", "timestamp") || undefined,
		metadata: details ?? meta,
	};
}

export function normalizeValidationResult(
	raw: Record<string, unknown>
): ValidationResultDto {
	const inbound_file = raw.inbound_file as string | { id: string } | null;
	return {
		...(raw as unknown as ValidationResultDto),
		id: String(raw.id ?? `${raw.code ?? "val"}-${raw.line_number ?? raw.line ?? 0}`),
		inbound_file_id:
			refId(inbound_file) ??
			(raw.inbound_file_id != null ? String(raw.inbound_file_id) : null),
		inbound_file,
		validation_profile:
			pickString(raw, "validation_profile", "profile") || null,
		profile: pickString(raw, "profile", "validation_profile") || null,
		is_valid:
			raw.is_valid === true ||
			raw.is_valid === "true" ||
			(raw.valid === true && raw.is_valid !== false),
		severity: pickString(raw, "severity", "level") || undefined,
		code: pickString(raw, "code", "error_code") || undefined,
		error_code: pickString(raw, "error_code", "code") || undefined,
		message:
			pickString(raw, "message", "description", "detail", "business_explanation") ||
			undefined,
		description: pickString(raw, "description", "message", "detail") || undefined,
		field: pickString(raw, "field", "field_name") || null,
		field_name: pickString(raw, "field_name", "field") || null,
		line: pickNumber(raw, "line", "line_number"),
		line_number: pickNumber(raw, "line_number", "line"),
		member_id:
			pickString(raw, "member_id", "subscriber_id") ||
			null,
		subscriber_id:
			pickString(raw, "subscriber_id", "member_id") ||
			null,
		received_value:
			raw.received_value != null ? String(raw.received_value) : null,
		expected_value:
			raw.expected_value != null ? String(raw.expected_value) : null,
		validation_rule:
			raw.validation_rule != null ? String(raw.validation_rule) : null,
		recommended_resolution:
			raw.recommended_resolution != null
				? String(raw.recommended_resolution)
				: null,
		created_at: pickString(raw, "created_at") || undefined,
	};
}

export function normalizeErrorRecord(
	raw: Record<string, unknown>
): ErrorRecordDto {
	return {
		...(raw as unknown as ErrorRecordDto),
		id: String(raw.id ?? ""),
		category: String(raw.category ?? ""),
		status: String(raw.status ?? "open"),
		code: pickString(raw, "code") || undefined,
		stage: pickString(raw, "stage") || undefined,
		message:
			pickString(raw, "message", "technical_message", "business_explanation") ||
			undefined,
		detail: pickString(raw, "detail") || undefined,
		business_explanation: pickString(raw, "business_explanation") || undefined,
		technical_message: pickString(raw, "technical_message", "message") || undefined,
		recommended_action: pickString(raw, "recommended_action") || undefined,
		retry_eligible: raw.retry_eligible === true,
		retry_count:
			raw.retry_count != null ? Number(raw.retry_count) : undefined,
		inbound_file_id:
			refId(raw.inbound_file as string | { id: string } | null) ??
			(raw.inbound_file_id != null ? String(raw.inbound_file_id) : null),
		inbound_file: raw.inbound_file as string | { id: string } | null,
		run_id:
			refId(raw.run as string | { id: string } | null) ??
			(raw.run_id != null ? String(raw.run_id) : null),
		run: raw.run as string | { id: string } | null,
		owner: pickString(raw, "owner") || null,
		created_at: pickString(raw, "created_at") || undefined,
		updated_at: pickString(raw, "updated_at") || undefined,
	};
}

export function normalizeProvider(raw: Record<string, unknown>): ProviderDto {
	return {
		...(raw as unknown as ProviderDto),
		id: String(raw.id ?? ""),
		reference_id: pickString(raw, "reference_id") || undefined,
		roster_file_id:
			refId(raw.roster_file as string | { id: string } | null) ??
			(raw.roster_file_id != null ? String(raw.roster_file_id) : undefined),
		roster_file:
			typeof raw.roster_file === "string"
				? raw.roster_file
				: pickString(raw, "roster_file") || null,
		vendor_id:
			refId(raw.vendor as string | { id: string } | null) ??
			(raw.vendor_id != null ? String(raw.vendor_id) : null),
		vendor:
			typeof raw.vendor === "string"
				? raw.vendor
				: pickString(raw, "vendor") || null,
		npi: String(raw.npi ?? ""),
		name: String(raw.name ?? ""),
		taxonomy: pickString(raw, "taxonomy") || undefined,
		entity_type: pickString(raw, "entity_type") || undefined,
		status: pickString(raw, "status") || undefined,
		effective_date: pickString(raw, "effective_date") || null,
		raw_object_id: pickString(raw, "raw_object_id") || null,
		created_at: pickString(raw, "created_at") || undefined,
		updated_at: pickString(raw, "updated_at") || undefined,
	};
}

export function normalizeProviderRoster(
	raw: Record<string, unknown>
): ProviderRosterDto {
	return {
		...(raw as unknown as ProviderRosterDto),
		id: String(raw.id ?? ""),
		reference_id: pickString(raw, "reference_id") || undefined,
		vendor_id:
			refId(raw.vendor as string | { id: string } | null) ??
			(raw.vendor_id != null ? String(raw.vendor_id) : null),
		vendor:
			typeof raw.vendor === "string"
				? raw.vendor
				: pickString(raw, "vendor") || null,
		source_inbound_file_id:
			refId(raw.source_inbound_file as string | { id: string } | null) ??
			(raw.source_inbound_file_id != null
				? String(raw.source_inbound_file_id)
				: null),
		original_filename: pickString(raw, "original_filename") || undefined,
		received_at: pickString(raw, "received_at") || undefined,
		provider_count:
			raw.provider_count != null ? Number(raw.provider_count) : undefined,
		created_at: pickString(raw, "created_at") || undefined,
		updated_at: pickString(raw, "updated_at") || undefined,
	};
}

function pickAmount(raw: Record<string, unknown>, ...keys: string[]): number {
	for (const key of keys) {
		const value = raw[key];
		if (value == null || value === "") continue;
		const n = Number(value);
		if (Number.isFinite(n)) return n;
	}
	return 0;
}

export function normalizeClaimLine(raw: Record<string, unknown>): ClaimLineDto {
	return {
		...(raw as unknown as ClaimLineDto),
		id: String(raw.id ?? ""),
		reference_id: pickString(raw, "reference_id") || undefined,
		vendor_file_id:
			refId(raw.vendor_file as string | { id: string } | null) ??
			(raw.vendor_file_id != null ? String(raw.vendor_file_id) : undefined),
		vendor:
			typeof raw.vendor === "string"
				? raw.vendor
				: pickString(raw, "vendor") || null,
		batch_id:
			refId(raw.batch as string | { id: string } | null) ??
			(raw.batch_id != null ? String(raw.batch_id) : null),
		batch_number: pickString(raw, "batch_number") || null,
		file_control_number: pickString(raw, "file_control_number") || null,
		claim_id:
			pickString(raw, "claim_id", "claim_reference_id") ||
			String(raw.claim_reference_id ?? ""),
		claim_reference_id: String(
			raw.claim_reference_id ?? raw.claim_id ?? raw.id ?? ""
		),
		line_number:
			raw.line_number != null ? Number(raw.line_number) : undefined,
		procedure_code: pickString(raw, "procedure_code") || null,
		revenue_code: pickString(raw, "revenue_code") || null,
		service_date: pickString(raw, "service_date") || null,
		billed_amount: pickAmount(raw, "billed_amount"),
		allowed_amount: pickAmount(raw, "allowed_amount") || null,
		paid_amount: pickAmount(raw, "paid_amount") || null,
		status: pickString(raw, "status") || undefined,
		denial_reason_code: pickString(raw, "denial_reason_code") || null,
		created_at: pickString(raw, "created_at") || undefined,
		updated_at: pickString(raw, "updated_at") || undefined,
	};
}
