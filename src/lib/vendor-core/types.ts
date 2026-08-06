/**
 * Types for Vendor Management Core (Django) REST envelope + Phase 1 intake domain.
 * Field names match Django serializers (snake_case).
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

export type VendorDto = {
	id: string;
	reference_id?: string;
	vendor_code: string;
	legal_name: string;
	trade_name?: string | null;
	status: string;
	tier?: string | null;
	country?: string;
	city?: string;
	created_at?: string;
	updated_at?: string;
};

export type AccountDto = {
	id: string;
	reference_id?: string;
	vendor: string;
	account_code: string;
	name: string;
	line_of_business: string;
	status?: string;
	active: boolean;
	created_at?: string;
	updated_at?: string;
};

export type CredentialDto = {
	id: string;
	name: string;
	kind: string;
	secret_ref: string;
	description?: string;
	created_at?: string;
	updated_at?: string;
};

export type ConnectionDto = {
	id: string;
	name: string;
	vendor: string;
	account: string | null;
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
};

export type IntakeJobDto = {
	id: string;
	name: string;
	connection: string;
	vendor: string;
	account?: string | null;
	file_type: string;
	filename_pattern: string;
	schedule_cron: string;
	schedule_timezone: string;
	status: string;
	destination_module: string;
	created_at?: string;
};

export type IntakeJobRunDto = {
	id: string;
	job: string;
	trigger?: string;
	stage: string;
	started_at: string | null;
	finished_at: string | null;
	files_found: number;
	files_downloaded: number;
	files_processed: number;
	files_rejected: number;
	error_summary: string;
	created_at?: string;
};

export type InboundFileDto = {
	id: string;
	original_filename: string;
	checksum_sha256: string;
	size_bytes: number;
	detected_type: string;
	destination_module: string;
	stage: string;
	source: string;
	vendor: string | null;
	job: string | null;
	run?: string | null;
	connection?: string | null;
	storage_uri?: string;
	error_count?: number;
	parse_result?: Record<string, unknown> | null;
	created_at?: string;
	updated_at?: string;
};

export type ErrorRecordDto = {
	id: string;
	category: string;
	stage: string;
	code: string;
	technical_message: string;
	business_explanation: string;
	retry_eligible: boolean;
	retry_count: number;
	status: string;
	created_at?: string;
};

export type RoutingRuleDto = {
	id: string;
	name: string;
	priority: number;
	is_active: boolean;
	vendor: string | null;
	account: string | null;
	filename_pattern: string;
	file_extension: string;
	edi_type: string;
	sender_id: string;
	receiver_id: string;
	jurisdiction: string;
	destination_module: string;
	parser: string;
	created_at?: string;
	updated_at?: string;
};

export type AuditRecordDto = {
	id: string;
	actor: string | null;
	action: string;
	resource_type: string;
	resource_id: string;
	summary: string;
	details?: Record<string, unknown>;
	created_at?: string;
};

export type MonitoringDashboardDto = {
	connections: Array<{
		id: string;
		name: string;
		method: string;
		status: string;
		health: ConnectionDto["health"];
	}>;
	recent_runs: Array<{
		id: string;
		job_id: string;
		job__name: string;
		stage: string;
		files_found: number;
		files_downloaded: number;
		files_processed: number;
		files_rejected: number;
		started_at: string | null;
		finished_at: string | null;
		error_summary: string;
	}>;
	inbound_file_stages: Array<{ stage: string; count: number }>;
	active_jobs: Array<{
		id: string;
		name: string;
		schedule_cron: string;
		schedule_timezone: string;
		connection_id: string;
	}>;
};

export type TokenPair = {
	access: string;
	refresh: string;
};

/** Identity — Phase 1 */
export type IdentityGroupMemberDto = {
	id?: string;
	external_id?: string | null;
	display_name?: string | null;
	role?: string | null;
};

export type IdentityGroupCharacteristicDto = {
	id?: string;
	key?: string | null;
	operator?: string | null;
	value?: unknown;
};

export type IdentityGroupDto = {
	id: string;
	name: string;
	description?: string | null;
	membership_mode: string;
	members?: IdentityGroupMemberDto[];
	characteristics?: IdentityGroupCharacteristicDto[];
	period_start?: string | null;
	period_end?: string | null;
	is_active?: boolean;
	sync_status?: string | null;
	updated_at?: string;
};

export type IdentityGroupCreateDto = {
	name: string;
	description?: string | null;
	membership_mode: string;
	members?: IdentityGroupMemberDto[];
	characteristics?: IdentityGroupCharacteristicDto[];
	period_start?: string | null;
	period_end?: string | null;
	is_active?: boolean;
};

export type RoleDto = {
	id: string;
	name: string;
	permissions: string[];
};

export type AppSettingDto = {
	id: string;
	key: string;
	value: string;
	category: string | null;
};

export type UserListDto = {
	id: string;
	email: string;
	username?: string;
	name?: string | null;
	roles?: string[];
	is_active?: boolean;
	is_staff?: boolean;
};
