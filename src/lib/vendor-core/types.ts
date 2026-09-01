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
	description?: string | null;
	website?: string | null;
	tax_id?: string | null;
	risk_level?: string;
	risk_score?: number | string | null;
	tags?: string[];
	standard_payment_terms_days?: number;
	default_currency?: string;
	metadata?: Record<string, unknown> | null;
	primary_contact?: VendorContactDto | null;
	categories?: VendorCategoryCompactDto[];
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
	payer_id?: string | null;
	health_score?: number;
	timezone?: string;
	eligibility_feed_status?: string;
	medical_feed_status?: string;
	pharmacy_feed_status?: string;
	accumulator_feed_status?: string;
	metadata?: Record<string, unknown> | null;
	created_at?: string;
	updated_at?: string;
	code: string;
	vendor_id: string;
};

export type AccountCreateInput = {
	vendor_id: string;
	account_code: string;
	name: string;
	line_of_business: string;
	active?: boolean;
	metadata?: Record<string, unknown>;
	is_visible?: boolean;
};

export type AccountUpdateInput = {
	vendor_id?: string;
	account_code?: string;
	name?: string;
	line_of_business?: string;
	active?: boolean;
	metadata?: Record<string, unknown>;
	is_visible?: boolean;
};

export type VendorInviteCreateInput = {
	legal_name: string;
	email: string;
	categories?: string[];
	country?: string;
	city?: string;
	vendor_code?: string;
	expires_in_days?: number;
};

export type VendorInviteDto = {
	id: string;
	token: string;
	legal_name: string;
	email: string;
	categories: string[];
	status: string;
	vendor_id: string | null;
	expires_at: string;
	created_at: string;
};

export type VendorTeamMemberDto = {
	id: string;
	vendor_id: string;
	user_id: string | null;
	name: string;
	email: string;
	role: string;
	is_active: boolean;
};

export type VendorCategoryDto = {
	id: string;
	name: string;
	code: string;
	description?: string | null;
	parent_id: string | null;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
};

export type VendorCategoryListQuery = {
	is_active?: boolean;
	limit?: number;
	offset?: number;
};

export type ContractDto = {
	id: string;
	vendor_id: string;
	vendor_name?: string | null;
	contract_number: string;
	title: string;
	contract_type: string;
	parent_contract_id?: string | null;
	status: string;
	effective_date: string;
	expiration_date?: string | null;
	renewal_type?: string;
	total_contract_value?: number | string | null;
	currency?: string;
	payment_terms_days?: number;
	owner_id?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ContractListQuery = {
	vendor_id?: string;
	status?: string;
	limit?: number;
	offset?: number;
};

export type ContractCreateInput = {
	vendor_id: string;
	contract_number: string;
	title: string;
	contract_type: string;
	effective_date: string;
	expiration_date?: string | null;
	status?: string;
	parent_contract_id?: string | null;
	renewal_type?: string;
	total_contract_value?: number | string | null;
	currency?: string;
	payment_terms_days?: number;
	owner_id?: string | null;
};

export type ContractUpdateInput = Partial<ContractCreateInput>;

export type VendorContactDto = {
	id: string;
	vendor_id: string;
	name: string;
	email: string;
	phone?: string | null;
	role: string;
	title?: string | null;
	is_primary: boolean;
	receives_notifications?: boolean;
	created_at?: string;
	updated_at?: string;
};

export type VendorContactCreateInput = {
	vendor_id: string;
	name: string;
	email: string;
	phone?: string;
	role?: string;
	title?: string;
	is_primary?: boolean;
	receives_notifications?: boolean;
};

export type VendorContactUpdateInput = Partial<VendorContactCreateInput>;

export type VendorNoteDto = {
	id: string;
	vendor_id: string;
	body: string;
	is_pinned: boolean;
	author?: { id: string; email?: string; name?: string } | null;
	created_at?: string;
	updated_at?: string;
};

export type VendorNoteCreateInput = {
	vendor_id: string;
	body: string;
	is_pinned?: boolean;
};

export type VendorNoteUpdateInput = {
	body?: string;
	is_pinned?: boolean;
};

export type AccountOpsSummaryDto = {
	account_id: string;
	last_inbound_at?: string | null;
	last_file_type?: string | null;
	open_issue_count: number;
	eligibility_status: string;
	medical_status: string;
	pharmacy_status: string;
	accumulator_status: string;
	health_score: number;
};

export type VendorCategoryCompactDto = {
	id: string;
	code: string;
	name: string;
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
	/** Present on Member 360 list (`GET /members/list/`) as vendor_id */
	vendor_id?: string | null;
	is_visible?: boolean;
	deleted_at?: string | null;
	metadata?: Record<string, unknown> | null;
	created_at?: string;
	updated_at?: string;
};

/** `GET /api/v1/members/list/` row (snake_case wire). */
export type MemberListDto = {
	id: string;
	reference_id?: string;
	vendor_id?: string | null;
	cardholder_id?: string;
	person_code?: string;
	external_id?: string;
	first_name?: string;
	middle_name?: string;
	last_name?: string;
	display_name?: string;
	status?: string;
	relationship_code?: string;
	source_system?: string;
	vendor_source?: string;
	program?: string;
	lob?: string;
	plan_type?: string;
	pcp_name?: string;
	pcp_npi?: string;
	member_since?: string | null;
	claims_ytd?: number;
	paid_ytd?: string | number;
	last_claim_date?: string | null;
	date_of_birth?: string | null;
	gender?: string;
	ssn_last4?: string;
	phone?: string;
	email?: string;
	address_line1?: string;
	address_line2?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	alternate_id?: string;
	eligibility_status?: string;
	eligibility_label?: string;
	account_group?: string;
	group_name?: string;
	plan_name?: string;
	coverage_effective_date?: string | null;
	last_eligibility_update?: string | null;
	created_at?: string;
	updated_at?: string;
};

/**
 * Applied / remaining / total for one accumulator bucket on a table row.
 * Unused triples on a row MUST be `null` (UI renders "—").
 */
export type MemberAccumulatorAmountDto = {
	applied: number | null;
	remaining: number | null;
	total: number | null;
};

/**
 * One Medical or Pharmacy Accumulators table row.
 * `category`: `"medical"` | `"pharmacy"`.
 * `level`: `"individual"` | `"family"`.
 * Fill only the amount triple that matches `accumulator_type`; leave others null.
 * `source_accumulator_id` optional link to legacy flat MemberAccumulator for CRUD.
 */
export type MemberAccumulatorTableRowDto = {
	id: string;
	category: "medical" | "pharmacy";
	plan_id: string;
	account_group_id: string;
	internal_member_id: string;
	internal_family_id: string;
	/** e.g. "Medical Deductible", "Pharmacy Out-of-Pocket" */
	accumulator_type: string;
	level: "individual" | "family";
	deductible: MemberAccumulatorAmountDto;
	oop: MemberAccumulatorAmountDto;
	benefit_max: MemberAccumulatorAmountDto;
	/** Dollar amount under Plan Year column */
	plan_year_amount: number | null;
	/** YYYY-MM-DD */
	plan_year_start: string | null;
	plan_year_end: string | null;
	reset_date: string | null;
	source_accumulator_id?: string | null;
};

/**
 * Fixed KPI card for Accumulator Summary header.
 * Keys (in UI order): `medical_deductible` | `medical_oop` | `medical_benefit_max` |
 * `pharmacy_deductible` | `pharmacy_oop` | `pharmacy_benefit_max` | `total_paid`.
 * For `total_paid`, `individual_total` and `family_total` are null (no limit).
 */
export type MemberAccumulatorKpiDto = {
	key: string;
	label: string;
	individual_applied: number;
	individual_total: number | null;
	family_applied: number;
	family_total: number | null;
};

/**
 * Recent Accumulator Transactions row.
 * `level`: `"individual"` | `"family"`.
 * Dates: YYYY-MM-DD (or ISO); UI formats display.
 */
export type MemberAccumulatorTransactionDto = {
	id: string;
	date: string;
	plan_id: string;
	accumulator_type: string;
	level: "individual" | "family";
	service_date: string | null;
	description: string;
	amount: number;
	individual_amount: number;
	family_amount: number;
	source: string;
};

/**
 * Target BE payload for Member Detail Accumulators tab.
 * Prefer nesting on member detail as `accumulator_summary`, or
 * dedicated `GET /api/v1/members/<id>/accumulators/summary/`.
 * `kpis` MUST be length 7 in the fixed UI order (see MemberAccumulatorKpiDto).
 * Legacy flat `accumulators[]` remains for Overview + CRUD until this lands.
 */
export type MemberAccumulatorSummaryDto = {
	current_plan_name: string;
	effective_date: string | null;
	as_of_date: string | null;
	kpis: MemberAccumulatorKpiDto[];
	medical_rows: MemberAccumulatorTableRowDto[];
	pharmacy_rows: MemberAccumulatorTableRowDto[];
	recent_transactions: MemberAccumulatorTransactionDto[];
};

/** Flat ingest: `GET /api/v1/accumulator-files/…` */
export type AccumulatorFileListQuery = {
	vendor_id?: string;
	layout_id?: string;
	limit?: number;
	offset?: number;
	ordering?: string;
};

export type AccumulatorFileDto = {
	id: string;
	reference_id: string;
	vendor_id: string | null;
	source_inbound_file_id: string | null;
	original_filename: string;
	received_at: string;
	row_count: number;
	layout_id: string;
	created_at: string;
	updated_at: string;
	metadata?: Record<string, unknown>;
};

export type AccumulatorRowListQuery = {
	file_id?: string;
	cardholder_id?: string;
	client_id?: string;
	date_of_service?: string;
	date_of_service_from?: string;
	date_of_service_to?: string;
	limit?: number;
	offset?: number;
	ordering?: string;
};

export type AccumulatorRowListDto = {
	id: string;
	reference_id: string;
	file_id: string;
	member_id: string | null;
	row_number: number;
	cardholder_id: string;
	patient_first_name: string;
	patient_last_name: string;
	date_of_service: string | null;
	amount_applied_to_deductible: number | null;
	amount_applied_to_oop: number | null;
	plan_paid_amount: number | null;
	client_id: string;
	created_at: string;
};

export type AccumulatorRowDetailDto = {
	id: string;
	reference_id: string;
	file_id: string;
	member_id: string | null;
	row_number: number;
	cardholder_id: string;
	cardholder_ssn: string;
	patient_last_name: string;
	patient_first_name: string;
	patient_date_of_birth: string | null;
	gender: string;
	patient_relationship_code: string;
	date_of_service: string | null;
	amount_applied_to_deductible: number | null;
	amount_applied_to_oop: number | null;
	benefit_code: string;
	file_date: string | null;
	period_begin: string | null;
	notes: string;
	client_id: string;
	person_code: string;
	plan_paid_amount: number | null;
	alternate_id: string;
	raw: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	metadata?: Record<string, unknown>;
};

export type AccumulatorRowCreateInput = {
	file_id: string;
	member_id?: string | null;
	row_number?: number;
	cardholder_id?: string;
	cardholder_ssn?: string;
	patient_last_name?: string;
	patient_first_name?: string;
	patient_date_of_birth?: string | null;
	gender?: string;
	patient_relationship_code?: string;
	date_of_service?: string | null;
	amount_applied_to_deductible?: number | null;
	amount_applied_to_oop?: number | null;
	benefit_code?: string;
	file_date?: string | null;
	period_begin?: string | null;
	notes?: string;
	client_id?: string;
	person_code?: string;
	plan_paid_amount?: number | null;
	alternate_id?: string;
	raw?: Record<string, unknown>;
};

export type AccumulatorRowUpdateInput = {
	member_id?: string | null;
	row_number?: number;
	cardholder_id?: string;
	cardholder_ssn?: string;
	patient_last_name?: string;
	patient_first_name?: string;
	patient_date_of_birth?: string | null;
	gender?: string;
	patient_relationship_code?: string;
	date_of_service?: string | null;
	amount_applied_to_deductible?: number | null;
	amount_applied_to_oop?: number | null;
	benefit_code?: string;
	file_date?: string | null;
	period_begin?: string | null;
	notes?: string;
	client_id?: string;
	person_code?: string;
	plan_paid_amount?: number | null;
	alternate_id?: string;
	raw?: Record<string, unknown>;
	is_visible?: boolean;
};

/** Flat ingest: `GET /api/v1/pharmacy-claim-files/…` */
export type PharmacyClaimFileListQuery = {
	vendor_id?: string;
	layout_id?: string;
	limit?: number;
	offset?: number;
	ordering?: string;
};

export type PharmacyClaimFileDto = {
	id: string;
	reference_id: string;
	vendor_id: string | null;
	source_inbound_file_id: string | null;
	original_filename: string;
	received_at: string;
	row_count: number;
	layout_id: string;
	created_at: string;
	updated_at: string;
	metadata?: Record<string, unknown>;
};

export type PharmacyClaimRowListQuery = {
	file_id?: string;
	cardholder_id?: string;
	claim_no?: string;
	client_id?: string;
	date_of_service?: string;
	date_of_service_from?: string;
	date_of_service_to?: string;
	limit?: number;
	offset?: number;
	ordering?: string;
};

export type PharmacyClaimRowListDto = {
	id: string;
	reference_id: string;
	file_id: string;
	member_id: string | null;
	row_number: number;
	claim_no: string;
	date_of_service: string | null;
	cardholder_id: string;
	patient_first_name: string;
	patient_last_name: string;
	product_id: string;
	drug_name: string;
	total_amount_paid: number | null;
	patient_pay_amount: number | null;
	client_id: string;
	created_at: string;
};

export type PharmacyClaimRowDetailDto = {
	id: string;
	reference_id: string;
	file_id: string;
	member_id: string | null;
	row_number: number;
	claim_no: string;
	original_claim_no: string;
	is_reversed: boolean;
	claim_date: string | null;
	date_of_service: string | null;
	cardholder_id: string;
	person_code: string;
	patient_first_name: string;
	patient_last_name: string;
	date_of_birth: string | null;
	gender: string;
	product_id: string;
	drug_name: string;
	quantity_dispensed: number | null;
	days_supply: number | null;
	total_amount_paid: number | null;
	patient_pay_amount: number | null;
	service_provider_id: string;
	prescriber_id: string;
	client_id: string;
	group_id: string;
	transaction_response_status: string;
	payload: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	metadata?: Record<string, unknown>;
};

export type PharmacyClaimRowCreateInput = {
	file_id: string;
	member_id?: string | null;
	row_number?: number;
	claim_no?: string;
	original_claim_no?: string;
	is_reversed?: boolean;
	claim_date?: string | null;
	date_of_service?: string | null;
	cardholder_id?: string;
	person_code?: string;
	patient_first_name?: string;
	patient_last_name?: string;
	date_of_birth?: string | null;
	gender?: string;
	product_id?: string;
	drug_name?: string;
	quantity_dispensed?: number | null;
	days_supply?: number | null;
	total_amount_paid?: number | null;
	patient_pay_amount?: number | null;
	service_provider_id?: string;
	prescriber_id?: string;
	client_id?: string;
	group_id?: string;
	transaction_response_status?: string;
	payload?: Record<string, unknown>;
};

export type PharmacyClaimRowUpdateInput = {
	member_id?: string | null;
	row_number?: number;
	claim_no?: string;
	original_claim_no?: string;
	is_reversed?: boolean;
	claim_date?: string | null;
	date_of_service?: string | null;
	cardholder_id?: string;
	person_code?: string;
	patient_first_name?: string;
	patient_last_name?: string;
	date_of_birth?: string | null;
	gender?: string;
	product_id?: string;
	drug_name?: string;
	quantity_dispensed?: number | null;
	days_supply?: number | null;
	total_amount_paid?: number | null;
	patient_pay_amount?: number | null;
	service_provider_id?: string;
	prescriber_id?: string;
	client_id?: string;
	group_id?: string;
	transaction_response_status?: string;
	payload?: Record<string, unknown>;
	is_visible?: boolean;
};

/** Nested slices on `GET /api/v1/members/<id>/`. */
export type MemberDetailDto = MemberListDto & {
	data_as_of?: string | null;
	demographics?: Record<string, unknown> | null;
	eligibility?: Record<string, unknown> | null;
	plan_coverage?: Record<string, unknown> | null;
	employment_group?: Record<string, unknown> | null;
	other_statuses?: Record<string, unknown>[];
	family_members?: Record<string, unknown>[];
	latest_source?: Record<string, unknown> | null;
	recent_sources?: Record<string, unknown>[];
	change_events?: Record<string, unknown>[];
	alerts?: Record<string, unknown>[];
	eligibility_history?: Record<string, unknown>[];
	plan_history?: Record<string, unknown>[];
	claims?: Record<string, unknown>[];
	encounters?: Record<string, unknown>[];
	/** Legacy flat list — keep until BE ships accumulator_summary. */
	accumulators?: Record<string, unknown>[];
	/**
	 * Accumulators tab contract (KPI cards + Medical/Pharmacy tables + transactions).
	 * See MemberAccumulatorSummaryDto.
	 */
	accumulator_summary?: MemberAccumulatorSummaryDto;
	exceptions?: Record<string, unknown>[];
	vendor_history?: Record<string, unknown>[];
	preferred_name?: string;
	preferred_language?: string;
	race?: string;
	ethnicity?: string;
	communication_preference?: string;
	emergency_contact_name?: string;
	emergency_contact_phone?: string;
	emergency_contact_relation?: string;
	mailing_address_line1?: string;
	mailing_address_line2?: string;
	mailing_city?: string;
	mailing_state?: string;
	mailing_postal_code?: string;
};

/** Nested write cards for POST create / PATCH update (core serializers). */
export type MemberDemographicsWrite = {
	date_of_birth?: string | null;
	gender?: string;
	ssn_encrypted?: string;
	ssn_last4?: string;
	alternate_id?: string;
	address_line1?: string;
	address_line2?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	phone?: string;
	email?: string;
	preferred_name?: string;
	preferred_language?: string;
	race?: string;
	ethnicity?: string;
	communication_preference?: string;
	emergency_contact_name?: string;
	emergency_contact_phone?: string;
	emergency_contact_relation?: string;
	mailing_address_line1?: string;
	mailing_address_line2?: string;
	mailing_city?: string;
	mailing_state?: string;
	mailing_postal_code?: string;
};

export type MemberEligibilityWrite = {
	status?: string;
	status_effective_date?: string | null;
	status_term_date?: string | null;
	enrollment_date?: string | null;
	disenrollment_date?: string | null;
	secondary_coverage?: boolean;
};

export type MemberPlanCoverageWrite = {
	plan_name?: string;
	plan_code?: string;
	benefit_package?: string;
	coverage_level_code?: string;
	coverage_level?: string;
	coverage_effective_date?: string | null;
	coverage_term_date?: string | null;
};

export type MemberEmploymentGroupWrite = {
	group_id?: string;
	group_name?: string;
	client_id?: string;
	account_type?: string;
	account_status?: string;
	member_type?: string;
	employee_type?: string;
};

export type MemberWriteBody = {
	vendor_id?: string;
	cardholder_id?: string;
	person_code?: string;
	external_id?: string;
	relationship_code?: string;
	first_name?: string;
	middle_name?: string;
	last_name?: string;
	status?: string;
	source_system?: string;
	program?: string;
	lob?: string;
	plan_type?: string;
	pcp_name?: string;
	pcp_npi?: string;
	member_since?: string | null;
	demographics?: MemberDemographicsWrite | null;
	eligibility?: MemberEligibilityWrite | null;
	plan_coverage?: MemberPlanCoverageWrite | null;
	employment_group?: MemberEmploymentGroupWrite | null;
};

export type MemberCreateBody = MemberWriteBody & {
	vendor_id: string;
	cardholder_id: string;
};

export type MemberListQuery = {
	search?: string;
	vendor_id?: string;
	status?: string;
	cardholder_id?: string;
	group_id?: string;
	/** Employment group display name (backend `account_group` filter). */
	account_group?: string;
	alternate_id?: string;
	first_name?: string;
	last_name?: string;
	date_of_birth?: string;
	gender?: string;
	plan_name?: string;
	eligibility_status?: string;
	program?: string;
	lob?: string;
	coverage_effective_from?: string;
	coverage_effective_to?: string;
	order_by?: string;
	limit?: number;
	offset?: number;
};

/** GET /api/v1/members/stats/ — directory dashboard KPI counts. */
export type MemberDashboardStatsQuery = Omit<
	MemberListQuery,
	"limit" | "offset" | "order_by"
>;

export type MemberDashboardStatsDto = {
	total: number;
	active: number;
	pending: number;
	termed: number;
	inactive: number;
	program?: string;
	vendor_id?: string | null;
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

export type ProviderVendorRef = {
	id: string;
	legal_name?: string;
	vendor_code?: string;
	reference_id?: string;
};

export type ProviderRosterRef = {
	id: string;
	reference_id?: string;
	original_filename?: string;
	provider_count?: number;
	received_at?: string;
	vendor_id?: string | null;
	vendor?: ProviderVendorRef | string | null;
};

export type ProviderDto = {
	id: string;
	reference_id?: string;
	roster_file_id?: string;
	roster_file?: ProviderRosterRef | string | null;
	vendor_id?: string | null;
	vendor?: ProviderVendorRef | string | null;
	npi: string;
	name: string;
	taxonomy?: string;
	entity_type?: string;
	status?: string;
	effective_date?: string | null;
	raw_object_id?: string | null;
	metadata?: Record<string, unknown> | null;
	profile?: ProviderProfileCompactDto | null;
	tab_counts?: ProviderTabCountsDto | null;
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

export type ProviderListQuery = {
	is_visible?: boolean;
	is_deleted?: boolean;
	reference_id?: string;
	roster_file_id?: string;
	vendor_id?: string;
	npi?: string;
	name?: string;
	taxonomy?: string;
	entity_type?: string;
	status?: string;
	order_by?: string;
	limit?: number;
	offset?: number;
};

export type ProviderCreateInput = {
	roster_file_id: string;
	npi: string;
	name: string;
	taxonomy?: string;
	entity_type?: string;
	effective_date?: string | null;
	raw_object_id?: string | null;
	metadata?: Record<string, unknown>;
	is_visible?: boolean;
};

export type ProviderUpdateInput = Partial<ProviderCreateInput>;

export type ProviderStatusInput = {
	status: "active" | "inactive" | "pending" | "termed";
};

/** GET /api/v1/providers/stats/ — list dashboard KPI counts. */
export type ProviderDashboardStatsQuery = {
	program?: "MDH" | "DHCF" | "BHP" | string;
	vendor_id?: string;
	roster_file_id?: string;
};

export type ProviderDashboardStatsDto = {
	total: number;
	active: number;
	pending: number;
	termed: number;
	inactive: number;
	program?: string;
	vendor_id?: string | null;
	roster_file_id?: string | null;
};

export type ProviderProfileCompactDto = {
	id?: string | null;
	first_name?: string;
	last_name?: string;
	middle_name?: string;
	suffix?: string;
	credentials?: string;
	gender?: string;
	dob?: string | null;
	email?: string;
	phone?: string;
	specialty?: string;
	subspecialty?: string;
	program?: string;
	provider_type?: string;
	enrollment_status?: string;
	enrollment_effective?: string | null;
	practice_name?: string;
	accepting_new_patients?: boolean;
};

export type ProviderTabCountsDto = {
	location_count: number;
	identifier_count: number;
	network_count: number;
	credential_count: number;
	exception_count: number;
};

export type ProviderProfileDto = ProviderProfileCompactDto & {
	provider_id?: string;
	reference_id?: string;
	fax?: string;
	taxonomy_description?: string;
	practice_address_line1?: string;
	practice_address_line2?: string;
	practice_city?: string;
	practice_state?: string;
	practice_postal_code?: string;
	mailing_address?: string;
	website?: string;
	years_in_practice?: number | null;
	board_certification?: string;
	medical_school?: string;
	graduation_year?: number | null;
	state_license?: string;
	dea_number?: string;
	is_visible?: boolean;
	created_at?: string | null;
	updated_at?: string | null;
};

export type ProviderProfileUpdateInput = Partial<{
	first_name: string;
	last_name: string;
	middle_name: string;
	suffix: string;
	credentials: string;
	gender: "male" | "female" | "other" | "unknown";
	dob: string | null;
	email: string;
	fax: string;
	phone: string;
	specialty: string;
	subspecialty: string;
	taxonomy_description: string;
	program: "MDH" | "DHCF" | "BHP" | "";
	provider_type: "Individual" | "Group" | "Facility";
	enrollment_status: "enrolled" | "pending" | "terminated";
	enrollment_effective: string | null;
	practice_name: string;
	practice_address_line1: string;
	practice_address_line2: string;
	practice_city: string;
	practice_state: string;
	practice_postal_code: string;
	mailing_address: string;
	website: string;
	accepting_new_patients: boolean;
	years_in_practice: number | null;
	board_certification: string;
	medical_school: string;
	graduation_year: number | null;
	state_license: string;
	dea_number: string;
	is_visible: boolean;
}>;

export type ProviderSummaryDto = {
	provider_id: string;
	reference_id?: string;
	npi: string;
	name: string;
	status: string;
	vendor_id?: string | null;
	roster_file_id: string;
	program?: string;
	enrollment_status?: string;
	enrollment_effective?: string | null;
	specialty?: string;
	location_count: number;
	network_count: number;
	identifier_count: number;
	credential_count: number;
	open_exception_count: number;
	expiring_credential_count: number;
	claims12m: number;
	encounters12m: number;
	billed12m: number;
	paid12m: number;
	rejection_rate: number;
	net_payment12m: number;
	data_as_of?: string;
};

export type ProviderLocationDto = {
	id: string;
	reference_id?: string;
	name: string;
	address_line1: string;
	address_line2: string;
	city: string;
	state: string;
	postal_code: string;
	phone: string;
	status: string;
	is_primary: boolean;
	created_at?: string;
	updated_at?: string;
};

export type ProviderIdentifierDto = {
	id: string;
	reference_id?: string;
	label: string;
	value: string;
	is_primary: boolean;
	created_at?: string;
	updated_at?: string;
};

export type ProviderIdentifierCreateInput = {
	label: string;
	value: string;
	is_primary?: boolean;
};

export type ProviderIdentifierUpdateInput =
	Partial<ProviderIdentifierCreateInput>;

export type ProviderNetworkDto = {
	id: string;
	reference_id?: string;
	network_plan: string;
	payer: string;
	status: string;
	effective_date?: string | null;
	end_date?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ProviderCredentialDto = {
	id: string;
	reference_id?: string;
	label: string;
	status: string;
	issuer: string;
	verified_date?: string | null;
	expiration_date?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ProviderExceptionDto = {
	id: string;
	reference_id?: string;
	exception_type: string;
	description: string;
	status: string;
	date_identified?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ProviderVendorSourceDto = {
	id: string;
	vendor_id?: string | null;
	vendor_name?: string;
	original_filename: string;
	received_at?: string;
	file_type?: string;
	provider_count: number;
	inbound_file_id?: string | null;
};

/** Work queue / migration cases (My Work Queue). */
export type MigrationVendorType = "tpa" | "tpv";

export type MigrationStatusDto =
	| "not_started"
	| "waiting_on_vendor"
	| "need_testing"
	| "testing"
	| "ready"
	| "production_ready"
	| "exception";

export type WhitelistStatusDto = "not_started" | "pending" | "complete";

export type MigrationCurrentStageDto =
	| "not_started"
	| "data_exchange"
	| "connectivity_testing"
	| "whitelist_review"
	| "contract_review"
	| "go_live_readiness"
	| "exception_handling"
	| "production";

export type MigrationCaseUserCompactDto = {
	id: string;
	username?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	full_name?: string;
};

export type MigrationCaseVendorCompactDto = {
	id: string;
	legal_name?: string;
	vendor_code?: string;
};

export type MigrationCaseEventDto = {
	id: string;
	event_type: string;
	message: string;
	tone: string;
	actor?: MigrationCaseUserCompactDto | null;
	created_at: string;
};

export type MigrationCaseDocumentDto = {
	id: string;
	reference_id?: string;
	migration_case_id?: string;
	name: string;
	mime_type?: string;
	size_bytes?: number;
	web_url?: string;
	created_at?: string;
	updated_at?: string;
};

export type MigrationCaseProgressMilestoneDto = {
	key: string;
	label: string;
	weight_percent: number;
	completed_at?: string | null;
};

export type MigrationCaseProgressDto = {
	percent: number;
	current_milestone_key?: string;
	current_milestone_label?: string;
	last_updated_at?: string | null;
	milestones: MigrationCaseProgressMilestoneDto[];
	notes?: string;
	updated_by?: MigrationCaseUserCompactDto | null;
	updated_at?: string | null;
};

export type MigrationCaseDto = {
	id: string;
	reference_id?: string;
	code: string;
	name: string;
	vendor_type: MigrationVendorType | string;
	wave: number;
	server_type?: string;
	whitelist_status: WhitelistStatusDto | string;
	migration_status: MigrationStatusDto | string;
	current_stage: MigrationCurrentStageDto | string;
	next_step?: string;
	notes?: string;
	last_communication_at?: string | null;
	migration_start_date?: string | null;
	waiting_on_vendor_date?: string | null;
	primary_contact?: string;
	primary_email?: string;
	primary_phone?: string;
	secondary_contact?: string;
	secondary_email?: string;
	secondary_phone?: string;
	assigned_to?: MigrationCaseUserCompactDto | null;
	vendor?: MigrationCaseVendorCompactDto | null;
	escalation_status?: string;
	blocker_status?: string;
	blocker_reason?: string | null;
	blocker_notes?: string;
	blocker_updated_at?: string | null;
	escalated_at?: string | null;
	sftp_progress?: MigrationCaseProgressDto;
	edi_progress?: MigrationCaseProgressDto;
	events?: MigrationCaseEventDto[];
	documents?: MigrationCaseDocumentDto[];
	metadata?: Record<string, unknown>;
	is_visible?: boolean;
	is_deleted?: boolean;
	deleted_at?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type MigrationCaseListQuery = {
	is_visible?: boolean;
	is_deleted?: boolean;
	reference_id?: string;
	code?: string;
	name?: string;
	vendor_type?: string;
	wave?: number;
	server_type?: string;
	migration_status?: string;
	whitelist_status?: string;
	current_stage?: string;
	assigned_to_id?: string;
	vendor_id?: string;
	escalation_status?: string;
	blocker_status?: string;
	search?: string;
	order_by?: string;
	limit?: number;
	offset?: number;
};

export type MigrationCaseCreateInput = {
	name: string;
	code: string;
	vendor_type: MigrationVendorType | string;
	wave?: number;
	server_type?: string;
	notes?: string;
	next_step?: string;
	current_stage?: MigrationCurrentStageDto | string;
	vendor_id?: string | null;
	assigned_to_id?: string | null;
	last_communication_at?: string | null;
	migration_start_date?: string | null;
	waiting_on_vendor_date?: string | null;
	primary_contact?: string;
	primary_email?: string;
	primary_phone?: string;
	secondary_contact?: string;
	secondary_email?: string;
	secondary_phone?: string;
	metadata?: Record<string, unknown>;
	is_visible?: boolean;
};

export type MigrationCaseUpdateInput = Partial<
	Omit<MigrationCaseCreateInput, "code" | "name" | "vendor_type">
> & {
	name?: string;
	code?: string;
	vendor_type?: MigrationVendorType | string;
};

export type MigrationCaseProgressUpdateInput = {
	milestones: Array<{ key: string; completed_at?: string | null }>;
	notes?: string;
};

export type MigrationCaseEscalationInput = {
	escalation_status: string;
};

export type MigrationCaseBlockerTransitionInput = {
	blocker_status: string;
	blocker_reason?: string | null;
	blocker_notes?: string;
};

export type WorkQueueFilterQuery = {
	assigned_to_id?: string;
	wave?: number;
	migration_status?: string;
	vendor_type?: string;
	escalation_status?: string;
	blocker_status?: string;
	search?: string;
	limit?: number;
	offset?: number;
};

export type WorkQueueCompletionSummaryDto = {
	percent: number;
	complete_count: number;
	total_count: number;
};

export type WorkQueueKpisDto = {
	assigned: number;
	connected: number;
	in_migration: number;
	testing: number;
	exceptions: number;
	not_started: number;
	escalations?: number;
	sftp_completion?: WorkQueueCompletionSummaryDto;
	edi_completion?: WorkQueueCompletionSummaryDto;
};

export type WorkQueueProgressSummaryDto = {
	sftp: WorkQueueCompletionSummaryDto;
	edi: WorkQueueCompletionSummaryDto;
	in_progress_count: number;
	blocked_escalated_count: number;
};

export type WorkQueueAnalystStatsRowDto = {
	analyst?: MigrationCaseUserCompactDto | null;
	assigned_count: number;
	sftp_complete_count: number;
	edi_complete_count: number;
	in_progress_count: number;
	blocked_escalated_count: number;
};

export type WorkQueueBlockerRowDto = {
	id: string;
	code: string;
	name: string;
	assigned_to?: MigrationCaseUserCompactDto | null;
	blocker_status: string;
	blocker_reason?: string | null;
	blocker_notes?: string;
	blocker_updated_at?: string | null;
	escalated_at?: string | null;
	escalation_status?: string;
	sftp_percent: number;
	edi_percent: number;
	migration_status: string;
};

export type WorkQueueImportResultDto = {
	created_count: number;
	updated_count: number;
	error_count: number;
	created: string[];
	updated: string[];
	errors: Record<string, unknown>[];
};

export type WorkQueueSeedInput = {
	force?: boolean;
};

export type WorkQueueSeedResultDto = {
	created: number;
	skipped?: boolean;
	existing_cases?: number;
	purged?: number;
	case_ids?: string[];
	case_codes?: string[];
};

export type MigrationCaseBulkStatusInput = {
	ids: string[];
	migration_status: MigrationStatusDto | string;
};

export type MigrationCaseBulkStatusResultDto = {
	succeeded: string[];
	failed: Array<{ id?: string; error?: string } & Record<string, unknown>>;
};

export type ProviderRosterCreateInput = {
	vendor_id?: string | null;
	source_inbound_file_id?: string | null;
	original_filename?: string;
	received_at: string;
	provider_count?: number;
	metadata?: Record<string, unknown>;
	is_visible?: boolean;
};

export type ProviderRosterUpdateInput = Partial<ProviderRosterCreateInput>;

export type ProviderRosterListQuery = {
	is_visible?: boolean;
	is_deleted?: boolean;
	reference_id?: string;
	vendor_id?: string;
	source_inbound_file_id?: string;
	original_filename?: string;
	limit?: number;
	offset?: number;
};

/** GET /api/v1/eligibility-files/list/ — 834 eligibility file shells. */
export type EligibilityFileDto = {
	id: string;
	reference_id?: string;
	vendor_id?: string | null;
	vendor?: string | VendorRef | null;
	original_filename?: string;
	received_at?: string;
	member_count?: number;
	created_at?: string;
	updated_at?: string;
};

export function normalizeEligibilityFile(
	raw: Record<string, unknown>
): EligibilityFileDto {
	return {
		...(raw as unknown as EligibilityFileDto),
		id: String(raw.id ?? ""),
		vendor_id:
			typeof raw.vendor_id === "string"
				? raw.vendor_id
				: typeof raw.vendor === "object" &&
					  raw.vendor &&
					  "id" in (raw.vendor as object)
					? String((raw.vendor as VendorRef).id)
					: typeof raw.vendor === "string"
						? raw.vendor
						: null,
		member_count:
			typeof raw.member_count === "number"
				? raw.member_count
				: Number(raw.member_count ?? 0) || 0,
	};
}

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
	actor?: string | { id?: string; email?: string; name?: string };
	summary?: string;
	details?: Record<string, unknown> | null;
	created_at?: string;
};

export type AuditListQuery = {
	resource_type?: string;
	resource_id?: string;
	action?: string;
	limit?: number;
	offset?: number;
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

/** `GET /api/v1/authentication/me/` → `result.user` */
export type MeUserDto = {
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
	must_change_password?: boolean;
};

export type MeResponseDto = {
	user: MeUserDto;
};

/** `/api/v1/identity-groups/` wire shapes */
export type IdentityGroupMemberDto = {
	id: string;
	external_id?: string | null;
	display_name: string;
	role?: string | null;
	user_id?: string | null;
};

export type IdentityGroupCharacteristicDto = {
	id: string;
	key: string;
	operator: string;
	value: unknown;
};

export type IdentityGroupDto = {
	id: string;
	name: string;
	description?: string | null;
	membership_mode: string;
	members: IdentityGroupMemberDto[];
	characteristics: IdentityGroupCharacteristicDto[];
	period_start?: string | null;
	period_end?: string | null;
	is_active: boolean;
	sync_status: string;
	updated_at: string;
};

export type IdentityGroupMemberInput = {
	external_id?: string | null;
	display_name: string;
	role?: string | null;
	user_id?: string | null;
};

export type IdentityGroupCharacteristicInput = {
	key: string;
	operator: string;
	value: unknown;
};

export type IdentityGroupCreateInput = {
	name: string;
	description?: string | null;
	membership_mode: string;
	members?: IdentityGroupMemberInput[];
	characteristics?: IdentityGroupCharacteristicInput[];
	period_start?: string | null;
	period_end?: string | null;
	is_active?: boolean;
};

export type IdentityGroupUpdateInput = Partial<IdentityGroupCreateInput>;

export type IdentityGroupListQuery = {
	search?: string;
	is_active?: boolean;
	limit?: number;
	offset?: number;
};

/** `/api/v1/roles/` wire shapes */
export type RoleUserCompactDto = {
	id: string;
	username: string;
	email: string;
};

export type RoleDto = {
	id: string;
	name: string;
	display_name: string;
	description?: string | null;
	permissions: string[];
	is_system_role: boolean;
	users?: RoleUserCompactDto[];
	created_at?: string;
	updated_at?: string;
};

export type RoleCreateInput = {
	name: string;
	display_name: string;
	description?: string | null;
	permissions?: string[];
};

export type RoleUpdateInput = Partial<RoleCreateInput>;

export type RoleListQuery = {
	limit?: number;
	offset?: number;
};

/** `/api/v1/settings/` wire shapes */
export type AppSettingDto = {
	id: string;
	key: string;
	value: string;
	value_type: string;
	category: string;
	description?: string | null;
	is_secret: boolean;
	created_at?: string;
	updated_at?: string;
};

export type AppSettingCreateInput = {
	key: string;
	value: string;
	value_type?: string;
	category: string;
	description?: string | null;
	is_secret?: boolean;
};

export type AppSettingUpdateInput = Partial<Omit<AppSettingCreateInput, "key">>;

export type AppSettingListQuery = {
	limit?: number;
	offset?: number;
};

export function refId(
	value: string | { id: string } | null | undefined
): string | null {
	if (!value) return null;
	if (typeof value === "string") return value;
	return value.id;
}

export function normalizeVendor(raw: Record<string, unknown>): VendorDto {
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
		status: String(
			raw.status ?? (raw.active === false ? "inactive" : "active")
		),
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
		error_count: raw.error_count != null ? Number(raw.error_count) : undefined,
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
		id: String(
			raw.id ?? `${raw.code ?? "val"}-${raw.line_number ?? raw.line ?? 0}`
		),
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
			pickString(
				raw,
				"message",
				"description",
				"detail",
				"business_explanation"
			) || undefined,
		description:
			pickString(raw, "description", "message", "detail") || undefined,
		field: pickString(raw, "field", "field_name") || null,
		field_name: pickString(raw, "field_name", "field") || null,
		line: pickNumber(raw, "line", "line_number"),
		line_number: pickNumber(raw, "line_number", "line"),
		member_id: pickString(raw, "member_id", "subscriber_id") || null,
		subscriber_id: pickString(raw, "subscriber_id", "member_id") || null,
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
		technical_message:
			pickString(raw, "technical_message", "message") || undefined,
		recommended_action: pickString(raw, "recommended_action") || undefined,
		retry_eligible: raw.retry_eligible === true,
		retry_count: raw.retry_count != null ? Number(raw.retry_count) : undefined,
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
	const rosterRaw = raw.roster_file;
	const rosterObj =
		rosterRaw && typeof rosterRaw === "object"
			? (rosterRaw as Record<string, unknown>)
			: null;
	const vendorRaw = raw.vendor ?? rosterObj?.vendor;
	const vendorObj =
		vendorRaw && typeof vendorRaw === "object"
			? (vendorRaw as Record<string, unknown>)
			: null;
	const metadata =
		raw.metadata && typeof raw.metadata === "object"
			? (raw.metadata as Record<string, unknown>)
			: null;

	return {
		...(raw as unknown as ProviderDto),
		id: String(raw.id ?? ""),
		reference_id: pickString(raw, "reference_id") || undefined,
		roster_file_id:
			refId(rosterRaw as string | { id: string } | null) ??
			(raw.roster_file_id != null ? String(raw.roster_file_id) : undefined),
		roster_file: rosterObj
			? {
					id: String(rosterObj.id ?? ""),
					reference_id: pickString(rosterObj, "reference_id") || undefined,
					original_filename:
						pickString(rosterObj, "original_filename") || undefined,
					provider_count:
						rosterObj.provider_count != null
							? Number(rosterObj.provider_count)
							: undefined,
					received_at: pickString(rosterObj, "received_at") || undefined,
					vendor_id:
						refId(rosterObj.vendor as string | { id: string } | null) ??
						(rosterObj.vendor_id != null ? String(rosterObj.vendor_id) : null),
					vendor: vendorObj
						? {
								id: String(vendorObj.id ?? ""),
								legal_name: pickString(vendorObj, "legal_name") || undefined,
								vendor_code: pickString(vendorObj, "vendor_code") || undefined,
								reference_id:
									pickString(vendorObj, "reference_id") || undefined,
							}
						: typeof rosterObj.vendor === "string"
							? rosterObj.vendor
							: null,
				}
			: typeof rosterRaw === "string"
				? rosterRaw
				: null,
		vendor_id:
			refId(vendorRaw as string | { id: string } | null) ??
			(raw.vendor_id != null ? String(raw.vendor_id) : null),
		vendor: vendorObj
			? {
					id: String(vendorObj.id ?? ""),
					legal_name: pickString(vendorObj, "legal_name") || undefined,
					vendor_code: pickString(vendorObj, "vendor_code") || undefined,
					reference_id: pickString(vendorObj, "reference_id") || undefined,
				}
			: typeof vendorRaw === "string"
				? vendorRaw
				: null,
		npi: String(raw.npi ?? ""),
		name: String(raw.name ?? ""),
		taxonomy: pickString(raw, "taxonomy") || undefined,
		entity_type: pickString(raw, "entity_type") || undefined,
		status: pickString(raw, "status") || undefined,
		effective_date: pickString(raw, "effective_date") || null,
		raw_object_id: pickString(raw, "raw_object_id") || null,
		metadata,
		profile:
			raw.profile && typeof raw.profile === "object"
				? (raw.profile as ProviderProfileCompactDto)
				: null,
		tab_counts:
			raw.tab_counts && typeof raw.tab_counts === "object"
				? (raw.tab_counts as ProviderTabCountsDto)
				: null,
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
		line_number: raw.line_number != null ? Number(raw.line_number) : undefined,
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

function normalizeMigrationUser(
	raw: unknown
): MigrationCaseUserCompactDto | null {
	if (!raw || typeof raw !== "object") return null;
	const u = raw as Record<string, unknown>;
	const id = String(u.id ?? "");
	if (!id) return null;
	return {
		id,
		username: pickString(u, "username") || undefined,
		email: pickString(u, "email") || undefined,
		first_name: pickString(u, "first_name") || undefined,
		last_name: pickString(u, "last_name") || undefined,
		full_name: pickString(u, "full_name") || undefined,
	};
}

function normalizeMigrationEvent(
	raw: Record<string, unknown>
): MigrationCaseEventDto {
	return {
		id: String(raw.id ?? ""),
		event_type: pickString(raw, "event_type") || "",
		message: pickString(raw, "message") || "",
		tone: pickString(raw, "tone") || "blue",
		actor: normalizeMigrationUser(raw.actor),
		created_at: pickString(raw, "created_at") || "",
	};
}

export function normalizeMigrationCaseDocument(
	raw: Record<string, unknown>
): MigrationCaseDocumentDto {
	return {
		id: String(raw.id ?? ""),
		reference_id: pickString(raw, "reference_id") || undefined,
		migration_case_id: pickString(raw, "migration_case_id") || undefined,
		name: pickString(raw, "name") || "Document",
		mime_type: pickString(raw, "mime_type") || undefined,
		size_bytes:
			raw.size_bytes != null ? Number(raw.size_bytes) : undefined,
		web_url: pickString(raw, "web_url") || undefined,
		created_at: pickString(raw, "created_at") || undefined,
		updated_at: pickString(raw, "updated_at") || undefined,
	};
}

export function normalizeMigrationCase(
	raw: Record<string, unknown>
): MigrationCaseDto {
	const vendorRaw = raw.vendor;
	const vendorObj =
		vendorRaw && typeof vendorRaw === "object"
			? (vendorRaw as Record<string, unknown>)
			: null;
	const eventsRaw = Array.isArray(raw.events) ? raw.events : undefined;
	const docsRaw = Array.isArray(raw.documents) ? raw.documents : undefined;

	return {
		...(raw as unknown as MigrationCaseDto),
		id: String(raw.id ?? ""),
		reference_id: pickString(raw, "reference_id") || undefined,
		code: String(raw.code ?? ""),
		name: String(raw.name ?? ""),
		vendor_type: pickString(raw, "vendor_type") || "tpa",
		wave: raw.wave != null ? Number(raw.wave) : 1,
		server_type: pickString(raw, "server_type") || "",
		whitelist_status: pickString(raw, "whitelist_status") || "not_started",
		migration_status: pickString(raw, "migration_status") || "not_started",
		current_stage: pickString(raw, "current_stage") || "not_started",
		next_step: pickString(raw, "next_step") || "",
		notes: pickString(raw, "notes") || "",
		last_communication_at: pickString(raw, "last_communication_at") || null,
		migration_start_date: pickString(raw, "migration_start_date") || null,
		waiting_on_vendor_date: pickString(raw, "waiting_on_vendor_date") || null,
		primary_contact: pickString(raw, "primary_contact") || "",
		primary_email: pickString(raw, "primary_email") || "",
		primary_phone: pickString(raw, "primary_phone") || "",
		secondary_contact: pickString(raw, "secondary_contact") || "",
		secondary_email: pickString(raw, "secondary_email") || "",
		secondary_phone: pickString(raw, "secondary_phone") || "",
		assigned_to: normalizeMigrationUser(raw.assigned_to),
		escalation_status: pickString(raw, "escalation_status") || "none",
		blocker_status: pickString(raw, "blocker_status") || "none",
		blocker_reason: pickString(raw, "blocker_reason") || null,
		blocker_notes: pickString(raw, "blocker_notes") || "",
		blocker_updated_at: pickString(raw, "blocker_updated_at") || null,
		escalated_at: pickString(raw, "escalated_at") || null,
		sftp_progress: normalizeMigrationProgress(raw.sftp_progress),
		edi_progress: normalizeMigrationProgress(raw.edi_progress),
		vendor: vendorObj
			? {
					id: String(vendorObj.id ?? ""),
					legal_name: pickString(vendorObj, "legal_name") || undefined,
					vendor_code: pickString(vendorObj, "vendor_code") || undefined,
				}
			: null,
		events: eventsRaw
			? eventsRaw
					.filter(
						(e): e is Record<string, unknown> => !!e && typeof e === "object"
					)
					.map(normalizeMigrationEvent)
			: undefined,
		documents: docsRaw
			? docsRaw
					.filter(
						(d): d is Record<string, unknown> => !!d && typeof d === "object"
					)
					.map((d) => ({
						id: String(d.id ?? ""),
						reference_id: pickString(d, "reference_id") || undefined,
						name: pickString(d, "name") || "",
						web_url: pickString(d, "web_url") || undefined,
					}))
			: undefined,
		is_visible: raw.is_visible !== false,
		is_deleted: Boolean(raw.is_deleted),
		deleted_at: pickString(raw, "deleted_at") || null,
		created_at: pickString(raw, "created_at") || undefined,
		updated_at: pickString(raw, "updated_at") || undefined,
	};
}

function normalizeMigrationProgress(
	raw: unknown
): MigrationCaseProgressDto | undefined {
	if (!raw || typeof raw !== "object") return undefined;
	const obj = raw as Record<string, unknown>;
	const milestonesRaw = Array.isArray(obj.milestones) ? obj.milestones : [];
	return {
		percent: Number(obj.percent ?? 0) || 0,
		current_milestone_key: pickString(obj, "current_milestone_key") || "",
		current_milestone_label:
			pickString(obj, "current_milestone_label") || "Not Started",
		last_updated_at: pickString(obj, "last_updated_at") || null,
		milestones: milestonesRaw
			.filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
			.map((m) => ({
				key: pickString(m, "key") || "",
				label: pickString(m, "label") || "",
				weight_percent: Number(m.weight_percent ?? 0) || 0,
				completed_at: pickString(m, "completed_at") || null,
			})),
		notes: pickString(obj, "notes") || "",
		updated_by: normalizeMigrationUser(obj.updated_by),
		updated_at: pickString(obj, "updated_at") || null,
	};
}

function normalizeWorkQueueCompletionSummary(
	value: unknown
): WorkQueueCompletionSummaryDto {
	if (!value || typeof value !== "object") {
		return { percent: 0, complete_count: 0, total_count: 0 };
	}
	const obj = value as Record<string, unknown>;
	return {
		percent: Number(obj.percent ?? 0) || 0,
		complete_count: Number(obj.complete_count ?? 0) || 0,
		total_count: Number(obj.total_count ?? 0) || 0,
	};
}

export function normalizeWorkQueueKpis(
	raw: Record<string, unknown>
): WorkQueueKpisDto {
	const sftpRaw = raw.sftp_completion;
	const ediRaw = raw.edi_completion;
	const normalizeSummary = (
		value: unknown
	): WorkQueueCompletionSummaryDto | undefined => {
		if (!value || typeof value !== "object") return undefined;
		return normalizeWorkQueueCompletionSummary(value);
	};

	return {
		assigned: Number(raw.assigned ?? 0) || 0,
		connected: Number(raw.connected ?? 0) || 0,
		in_migration: Number(raw.in_migration ?? 0) || 0,
		testing: Number(raw.testing ?? 0) || 0,
		exceptions: Number(raw.exceptions ?? 0) || 0,
		not_started: Number(raw.not_started ?? 0) || 0,
		escalations: Number(raw.escalations ?? 0) || 0,
		sftp_completion: normalizeSummary(sftpRaw),
		edi_completion: normalizeSummary(ediRaw),
	};
}

export function normalizeWorkQueueProgressSummary(
	raw: Record<string, unknown>
): WorkQueueProgressSummaryDto {
	return {
		sftp: normalizeWorkQueueCompletionSummary(raw.sftp),
		edi: normalizeWorkQueueCompletionSummary(raw.edi),
		in_progress_count: Number(raw.in_progress_count ?? 0) || 0,
		blocked_escalated_count: Number(raw.blocked_escalated_count ?? 0) || 0,
	};
}

export function normalizeWorkQueueAnalystStatsRow(
	raw: Record<string, unknown>
): WorkQueueAnalystStatsRowDto {
	return {
		analyst: normalizeMigrationUser(raw.analyst),
		assigned_count: Number(raw.assigned_count ?? 0) || 0,
		sftp_complete_count: Number(raw.sftp_complete_count ?? 0) || 0,
		edi_complete_count: Number(raw.edi_complete_count ?? 0) || 0,
		in_progress_count: Number(raw.in_progress_count ?? 0) || 0,
		blocked_escalated_count: Number(raw.blocked_escalated_count ?? 0) || 0,
	};
}

export function normalizeWorkQueueBlockerRow(
	raw: Record<string, unknown>
): WorkQueueBlockerRowDto {
	return {
		id: String(raw.id ?? ""),
		code: pickString(raw, "code") || "",
		name: pickString(raw, "name") || "",
		assigned_to: normalizeMigrationUser(raw.assigned_to),
		blocker_status: pickString(raw, "blocker_status") || "none",
		blocker_reason: pickString(raw, "blocker_reason") || null,
		blocker_notes: pickString(raw, "blocker_notes") || "",
		blocker_updated_at: pickString(raw, "blocker_updated_at") || null,
		escalated_at: pickString(raw, "escalated_at") || null,
		escalation_status: pickString(raw, "escalation_status") || undefined,
		sftp_percent: Number(raw.sftp_percent ?? 0) || 0,
		edi_percent: Number(raw.edi_percent ?? 0) || 0,
		migration_status: pickString(raw, "migration_status") || "",
	};
}
