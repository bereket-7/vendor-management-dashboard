import {
	VendorCoreApiError,
	getStoredAccessToken,
	getVendorCoreBaseUrl,
	vendorCoreFetch,
} from "@/lib/vendor-core/client";
import type {
	AccountDto,
	AuditRecordDto,
	ConnectionDto,
	CoreUserDto,
	CredentialDto,
	ErrorRecordDto,
	InboundFileDto,
	IntakeJobDto,
	IntakeJobRunDto,
	LoginEventDto,
	MemberCoverageDto,
	MonitoringDashboardDto,
	PaginatedResult,
	ProviderDto,
	ProviderRosterDto,
	ClaimLineDto,
	RoutingRuleDto,
	ValidationResultDto,
	VendorDto,
} from "@/lib/vendor-core/types";
import {
	normalizeAccount,
	normalizeConnection,
	normalizeErrorRecord,
	normalizeInboundFile,
	normalizeJob,
	normalizeJobRun,
	normalizeMemberCoverage,
	normalizeProcessingEvent,
	normalizeProvider,
	normalizeProviderRoster,
	normalizeClaimLine,
	normalizeValidationResult,
	normalizeVendor,
} from "@/lib/vendor-core/types";

/**
 * Live Django vendor-core paths (`/api/v1/*`).
 * Collection resources use REST list/create on the same URL;
 * detail uses GET/PATCH on `/resource/{id}/`.
 */
export const vendorCoreEndpoints = {
	vendors: "/api/v1/vendors/",
	vendorsInvite: "/api/v1/vendors/invite/",
	vendor: (id: string) => `/api/v1/vendors/${id}/`,
	categories: "/api/v1/categories/",
	vendorMe: "/api/v1/vendor/me/",
	vendorTeam: "/api/v1/vendor/team/",
	accounts: "/api/v1/accounts/",
	account: (id: string) => `/api/v1/accounts/${id}/`,
	credentials: "/api/v1/credentials/",
	credential: (id: string) => `/api/v1/credentials/${id}/`,
	connections: "/api/v1/connections/",
	connection: (id: string) => `/api/v1/connections/${id}/`,
	connectionTest: (id: string) => `/api/v1/connections/${id}/test/`,
	intakeJobs: "/api/v1/intake-jobs/",
	intakeJob: (id: string) => `/api/v1/intake-jobs/${id}/`,
	intakeJobRun: (id: string) => `/api/v1/intake-jobs/${id}/run/`,
	intakeJobRuns: "/api/v1/intake-job-runs/",
	memberCoverages: "/api/v1/member-coverages/",
	providers: "/api/v1/providers/",
	providerRosters: "/api/v1/provider-rosters/",
	claimLines: "/api/v1/claim-lines/",
	claimVendorFiles: "/api/v1/claim-vendor-files/",
	claimVendorFile: (id: string) => `/api/v1/claim-vendor-files/${id}/`,
	claimResponses: "/api/v1/claim-responses/",
	claimExceptions: "/api/v1/claim-exceptions/",
	submissionBatches: "/api/v1/submission-batches/",
	eligibilityFiles: "/api/v1/eligibility-files/",
	inboundFiles: "/api/v1/inbound-files/",
	inboundFile: (id: string) => `/api/v1/inbound-files/${id}/`,
	inboundFileEvents: (id: string) => `/api/v1/inbound-files/${id}/events/`,
	inboundFileReprocess: (id: string) =>
		`/api/v1/inbound-files/${id}/reprocess/`,
	validationResults: "/api/v1/validation-results/",
	uploads: "/api/v1/intake/uploads/",
	monitoring: "/api/v1/monitoring/",
	errors: "/api/v1/errors/",
	error: (id: string) => `/api/v1/errors/${id}/`,
	errorRetry: (id: string) => `/api/v1/errors/${id}/retry/`,
	errorResolve: (id: string) => `/api/v1/errors/${id}/resolve/`,
	routingRules: "/api/v1/routing-rules/",
	routingRule: (id: string) => `/api/v1/routing-rules/${id}/`,
	audit: "/api/v1/audit/",
	users: "/api/v1/users/",
	userUpdate: (id: string) => `/api/v1/users/${id}/update/`,
	userPassword: (id: string) => `/api/v1/users/${id}/password/`,
	userLoginEvents: (id: string) => `/api/v1/users/${id}/login-events/`,
	loginEvents: "/api/v1/users/login-events/",
	myLoginEvents: "/api/v1/users/me/login-events/",
	identityGroups: "/api/v1/identity-groups/",
	identityGroup: (id: string) => `/api/v1/identity-groups/${id}/`,
	roles: "/api/v1/roles/",
	settings: "/api/v1/settings/",
	onboarding: "/api/v1/onboarding/",
	onboardingDetail: (id: string) => `/api/v1/onboarding/${id}/`,
	documents: "/api/v1/documents/",
	document: (id: string) => `/api/v1/documents/${id}/`,
	contracts: "/api/v1/contracts/",
	contract: (id: string) => `/api/v1/contracts/${id}/`,
	rfx: "/api/v1/rfx/",
	rfxDetail: (id: string) => `/api/v1/rfx/${id}/`,
	rfxBids: (id: string) => `/api/v1/rfx/${id}/bids/`,
	purchaseOrders: "/api/v1/purchase-orders/",
	purchaseOrder: (id: string) => `/api/v1/purchase-orders/${id}/`,
	invoices: "/api/v1/invoices/",
	invoice: (id: string) => `/api/v1/invoices/${id}/`,
	approvals: "/api/v1/approvals/",
	approval: (id: string) => `/api/v1/approvals/${id}/`,
	scorecards: "/api/v1/scorecards/",
	certificates: "/api/v1/certificates/",
	notifications: "/api/v1/notifications/",
	notification: (id: string) => `/api/v1/notifications/${id}/`,
	health: "/health/",
} as const;

/** @deprecated Use vendorCoreEndpoints.vendors — kept for call-site clarity aliases */
export const vendorCoreEndpointAliases = {
	vendorsList: vendorCoreEndpoints.vendors,
	vendorsCreate: vendorCoreEndpoints.vendors,
	accountsList: vendorCoreEndpoints.accounts,
	accountsCreate: vendorCoreEndpoints.accounts,
	credentialsList: vendorCoreEndpoints.credentials,
	credentialsCreate: vendorCoreEndpoints.credentials,
	connectionsList: vendorCoreEndpoints.connections,
	connectionsCreate: vendorCoreEndpoints.connections,
	intakeJobRunsList: vendorCoreEndpoints.intakeJobRuns,
	memberCoveragesList: vendorCoreEndpoints.memberCoverages,
	providersList: vendorCoreEndpoints.providers,
	providerRostersList: vendorCoreEndpoints.providerRosters,
	claimLinesList: vendorCoreEndpoints.claimLines,
	eligibilityFilesList: vendorCoreEndpoints.eligibilityFiles,
	validationResultsList: vendorCoreEndpoints.validationResults,
	errorsList: vendorCoreEndpoints.errors,
	routingRulesList: vendorCoreEndpoints.routingRules,
	routingRulesCreate: vendorCoreEndpoints.routingRules,
	auditList: vendorCoreEndpoints.audit,
	vendorUpdate: vendorCoreEndpoints.vendor,
} as const;

function unsupported(operation: string): never {
	throw new VendorCoreApiError(
		`${operation} is not exposed by Django vendor-core yet`,
		501
	);
}

function pageParams(extra?: Record<string, string | number | undefined | null>) {
	// Django list endpoints reject limit > 100 ("One or more fields are invalid.")
	const merged = { limit: 100, offset: 0, ...extra };
	const limit = Number(merged.limit);
	if (!Number.isFinite(limit) || limit < 1) merged.limit = 100;
	else if (limit > 100) merged.limit = 100;
	return merged;
}

async function listAllPages<T>(
	fetchPage: (params: {
		limit: number;
		offset: number;
	}) => Promise<PaginatedResult<T>>,
	pageSize = 100
): Promise<T[]> {
	const results: T[] = [];
	let offset = 0;
	for (;;) {
		const page = await fetchPage({ limit: pageSize, offset });
		const chunk = page.results ?? [];
		results.push(...chunk);
		const count = page.count;
		offset += chunk.length;
		if (!chunk.length) break;
		if (typeof count === "number" && offset >= count) break;
		if (chunk.length < pageSize) break;
	}
	return results;
}

function mapPage<T, R>(
	page: PaginatedResult<T>,
	map: (item: T) => R
): PaginatedResult<R> {
	return {
		...page,
		results: (page.results ?? []).map(map),
	};
}

async function listResourcePages<T>(
	path: string,
	params?: Record<string, string | number | undefined | null>,
	pageSize = 100
): Promise<PaginatedResult<T>> {
	const results = await listAllPages(
		({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<T>>(path, {
				params: pageParams({ ...params, limit, offset }),
			}),
		pageSize
	);
	return {
		limit: results.length,
		offset: 0,
		count: results.length,
		next: null,
		previous: null,
		results,
	};
}

export const vendorCoreApi = {
	createVendor: (body: {
		vendor_code: string;
		legal_name: string;
		country: string;
		city: string;
		trade_name?: string;
		status?: string;
		tier?: string;
		metadata?: Record<string, unknown>;
	}) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendors, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	inviteVendor: (body: {
		legal_name: string;
		email: string;
		categories?: string[];
	}) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendorsInvite, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	createAccount: (body: {
		vendor: string;
		account_code: string;
		name?: string;
		line_of_business?: string;
		active?: boolean;
		metadata?: Record<string, unknown>;
	}) =>
		vendorCoreFetch<AccountDto>(vendorCoreEndpoints.accounts, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((a) => normalizeAccount(a as unknown as Record<string, unknown>)),

	createCredential: (body: {
		name: string;
		kind: string;
		secret_ref: string;
		metadata?: Record<string, unknown>;
	}) =>
		vendorCoreFetch<CredentialDto>(vendorCoreEndpoints.credentials, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	createConnection: (body: Record<string, unknown>) =>
		vendorCoreFetch<ConnectionDto>(vendorCoreEndpoints.connections, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((c) =>
			normalizeConnection(c as unknown as Record<string, unknown>)
		),

	createIntakeJob: (body: Record<string, unknown>) =>
		vendorCoreFetch<IntakeJobDto>(vendorCoreEndpoints.intakeJobs, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((j) => normalizeJob(j as unknown as Record<string, unknown>)),

	createRoutingRule: (body: Record<string, unknown>) =>
		vendorCoreFetch<RoutingRuleDto>(vendorCoreEndpoints.routingRules, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	listVendors: async (params?: { status?: string; search?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.vendors, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeVendor);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<VendorDto>;
	},

	getVendor: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.vendor(id)
		);
		return normalizeVendor(raw);
	},

	listAccounts: async (params?: { vendor_id?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.accounts, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeAccount);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<AccountDto>;
	},

	listCredentials: () =>
		vendorCoreFetch<PaginatedResult<CredentialDto>>(
			vendorCoreEndpoints.credentials,
			{ params: pageParams() }
		),

	listConnections: async (params?: {
		method?: string;
		status?: string;
		vendor_id?: string;
	}) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.connections, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeConnection);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<ConnectionDto>;
	},

	testConnection: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.connectionTest(id),
			{ method: "POST" }
		),

	listIntakeJobs: async (params?: { status?: string; vendor_id?: string }) => {
		const results = await listAllPages(
			async ({ limit, offset }) => {
				const page = await vendorCoreFetch<
					PaginatedResult<Record<string, unknown>>
				>(vendorCoreEndpoints.intakeJobs, {
					params: pageParams({ ...params, limit, offset }),
				});
				return mapPage(page, normalizeJob);
			},
			50
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<IntakeJobDto>;
	},

	getIntakeJob: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.intakeJob(id)
		);
		return normalizeJob(raw);
	},

	updateIntakeJob: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<IntakeJobDto>(vendorCoreEndpoints.intakeJob(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}).then((j) => normalizeJob(j as unknown as Record<string, unknown>)),

	runIntakeJob: (id: string) =>
		vendorCoreFetch<{ task_id: string; job_id: string }>(
			vendorCoreEndpoints.intakeJobRun(id),
			{ method: "POST" }
		),

	listIntakeJobRuns: async (params?: {
		job_id?: string;
		stage?: string;
		limit?: number;
		offset?: number;
	}) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.intakeJobRuns, {
			params: pageParams({
				job_id: params?.job_id,
				stage: params?.stage,
				limit: params?.limit ?? 100,
				offset: params?.offset ?? 0,
			}),
		});
		return mapPage(page, normalizeJobRun);
	},

	listMemberCoverages: async (params?: { search?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.memberCoverages, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeMemberCoverage);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<MemberCoverageDto>;
	},

	createEligibilityFile: (_body: {
		vendor_id?: string;
		original_filename?: string;
		received_at?: string;
		member_count?: number;
	}) => unsupported("POST /eligibility-files/"),

	createMemberCoverage: (_body: {
		eligibility_file_id: string;
		subscriber_id: string;
		group_or_policy_number?: string;
		member_first_name?: string;
		member_last_name?: string;
		maintenance_type_code?: string;
		raw_object_id?: string;
	}) => unsupported("POST /member-coverages/"),

	seedMemberCoverages: (_body?: { vendor_id?: string; count?: number }) =>
		unsupported("POST /member-coverages/seed/"),

	listInboundFiles: async (params?: {
		stage?: string;
		vendor_id?: string;
		search?: string;
	}) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.inboundFiles, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeInboundFile);
		}, 50);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<InboundFileDto>;
	},

	getInboundFile: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.inboundFile(id)
		);
		return normalizeInboundFile(raw);
	},

	reprocessInboundFile: (id: string) =>
		vendorCoreFetch<{ task_id?: string; id?: string } | Record<string, unknown>>(
			vendorCoreEndpoints.inboundFileReprocess(id),
			{ method: "POST" }
		),

	seedInboundProcessing: (_body?: { vendor_id?: string; force?: boolean }) =>
		unsupported("POST /inbound-files/seed/"),

	listInboundFileEvents: async (inboundFileId: string) => {
		const data = await vendorCoreFetch<
			| PaginatedResult<Record<string, unknown>>
			| Record<string, unknown>[]
		>(vendorCoreEndpoints.inboundFileEvents(inboundFileId));

		const rows = Array.isArray(data)
			? data
			: ((data as PaginatedResult<Record<string, unknown>>).results ?? []);
		return rows.map((row) => normalizeProcessingEvent(row));
	},

	listValidationResults: async (params?: {
		inbound_file_id?: string;
		search?: string;
	}) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.validationResults, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeValidationResult);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<ValidationResultDto>;
	},

	uploadInboundFile: async (input: {
		file: File;
		connection_id?: string;
		job_id?: string;
	}) => {
		const form = new FormData();
		form.append("file", input.file);
		if (input.connection_id) form.append("connection_id", input.connection_id);
		if (input.job_id) form.append("job_id", input.job_id);
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.uploads,
			{
				method: "POST",
				body: form,
				headers: {}, // let browser set multipart boundary
			}
		);
		return normalizeInboundFile(raw);
	},

	/** Alias used by older call sites */
	uploadIntake: async (input: {
		file: File;
		connection_id?: string;
		job_id?: string;
	}) => {
		const form = new FormData();
		form.append("file", input.file);
		if (input.connection_id) form.append("connection_id", input.connection_id);
		if (input.job_id) form.append("job_id", input.job_id);
		const token = getStoredAccessToken();
		const response = await fetch(
			`${getVendorCoreBaseUrl()}${vendorCoreEndpoints.uploads}`,
			{
				method: "POST",
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: form,
			}
		);
		const text = await response.text();
		const data = text ? JSON.parse(text) : undefined;
		if (!response.ok) {
			throw new Error(
				data?.message ?? data?.detail ?? `Upload failed (${response.status})`
			);
		}
		return (data?.result ?? data) as InboundFileDto;
	},

	getMonitoring: () =>
		vendorCoreFetch<MonitoringDashboardDto>(vendorCoreEndpoints.monitoring),

	listErrors: async (params?: { status?: string; category?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
				vendorCoreEndpoints.errors,
				{ params: pageParams({ ...params, limit, offset }) }
			);
			return mapPage(page, normalizeErrorRecord);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<ErrorRecordDto>;
	},

	getError: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.error(id)).then(
			(row) => normalizeErrorRecord(row)
		),

	retryError: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.errorRetry(id), {
			method: "POST",
		}).then((row) => normalizeErrorRecord(row)),

	resolveError: (id: string, resolution_notes?: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.errorResolve(id),
			{
				method: "POST",
				body: JSON.stringify({ resolution_notes: resolution_notes ?? "" }),
			}
		).then((row) => normalizeErrorRecord(row)),

	listProviders: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
				vendorCoreEndpoints.providers,
				{ params: pageParams({ limit, offset }) }
			);
			return mapPage(page, normalizeProvider);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<ProviderDto>;
	},

	listProviderRosters: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
				vendorCoreEndpoints.providerRosters,
				{ params: pageParams({ limit, offset }) }
			);
			return mapPage(page, normalizeProviderRoster);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<ProviderRosterDto>;
	},

	seedProviders: (_body?: {
		vendor_id?: string;
		count?: number;
		force?: boolean;
	}) => unsupported("POST /providers/seed/"),

	listClaimLines: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
				vendorCoreEndpoints.claimLines,
				{ params: pageParams({ limit, offset }) }
			);
			return mapPage(page, normalizeClaimLine);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<ClaimLineDto>;
	},

	getClaimLine: (_id: string) => unsupported("GET /claim-lines/{id}/"),

	createClaimLine: (_body: Record<string, unknown>) =>
		unsupported("POST /claim-lines/"),

	updateClaimLine: (_id: string, _body: Record<string, unknown>) =>
		unsupported("PATCH /claim-lines/{id}/"),

	deleteClaimLine: (_id: string) => unsupported("DELETE /claim-lines/{id}/"),

	hardDeleteClaimLine: (_id: string) =>
		unsupported("DELETE /claim-lines/{id}/hard-delete/"),

	restoreClaimLine: (_id: string) =>
		unsupported("POST /claim-lines/{id}/restore/"),

	seedClaimLines: (_body?: { vendor_id?: string; force?: boolean }) =>
		unsupported("POST /claim-lines/seed/"),

	listClaimVendorFiles: () =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.claimVendorFiles
		),

	getClaimVendorFile: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimVendorFile(id)
		),

	listClaimResponses: () =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.claimResponses
		),

	listClaimExceptions: () =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.claimExceptions
		),

	listSubmissionBatches: () =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.submissionBatches
		),

	listRoutingRules: () =>
		vendorCoreFetch<PaginatedResult<RoutingRuleDto>>(
			vendorCoreEndpoints.routingRules,
			{ params: pageParams() }
		),

	listAudit: (params?: { resource_type?: string; action?: string }) =>
		vendorCoreFetch<PaginatedResult<AuditRecordDto>>(vendorCoreEndpoints.audit, {
			params: pageParams(params),
		}),

	updateVendor: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendor(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	/** Soft-delete: set status to terminated (no dedicated DELETE route). */
	deleteVendor: (id: string) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendor(id), {
			method: "PATCH",
			body: JSON.stringify({ status: "terminated" }),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	hardDeleteVendor: (_id: string) =>
		unsupported("DELETE /vendors/{id}/hard-delete/"),

	/** Restore: move terminated/offboarded vendors back to prospect. */
	restoreVendor: (id: string) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendor(id), {
			method: "PATCH",
			body: JSON.stringify({ status: "prospect" }),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	listUsers: async (params?: { search?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<CoreUserDto>>(vendorCoreEndpoints.users, {
				params: pageParams({ ...params, limit, offset }),
			})
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<CoreUserDto>;
	},

	updateUser: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.userUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listLoginEvents: async (params?: { username?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<LoginEventDto>>(
				vendorCoreEndpoints.loginEvents,
				{ params: pageParams({ ...params, limit, offset }) }
			)
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<LoginEventDto>;
	},

	listUserLoginEvents: async (userId: string) => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<LoginEventDto>>(
				vendorCoreEndpoints.userLoginEvents(userId),
				{ params: pageParams({ limit, offset }) }
			)
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<LoginEventDto>;
	},

	listMyLoginEvents: async () => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<LoginEventDto>>(
				vendorCoreEndpoints.myLoginEvents,
				{ params: pageParams({ limit, offset }) }
			)
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<LoginEventDto>;
	},

	listCategories: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.categories),

	listIdentityGroups: () =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.identityGroups
		),

	getIdentityGroup: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.identityGroup(id)
		),

	createIdentityGroup: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.identityGroups,
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateIdentityGroup: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.identityGroup(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteIdentityGroup: (id: string) =>
		vendorCoreFetch<unknown>(vendorCoreEndpoints.identityGroup(id), {
			method: "DELETE",
		}),

	listRoles: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.roles),

	listSettings: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.settings),

	listOnboarding: (params?: { status?: string; vendor_id?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.onboarding,
			params
		),

	getOnboarding: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingDetail(id)
		),

	updateOnboarding: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingDetail(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	listDocuments: (params?: { vendor_id?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.documents,
			params
		),

	getDocument: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.document(id)),

	createDocument: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.documents, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateDocument: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.document(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listContracts: (params?: { vendor_id?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.contracts,
			params
		),

	getContract: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.contract(id)),

	createContract: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.contracts, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateContract: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.contract(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listRfx: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.rfx),

	getRfx: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.rfxDetail(id)),

	createRfx: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.rfx, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateRfx: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.rfxDetail(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listRfxBids: (rfxId: string) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.rfxBids(rfxId)
		),

	createRfxBid: (rfxId: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.rfxBids(rfxId),
			{ method: "POST", body: JSON.stringify(body) }
		),

	listPurchaseOrders: (params?: { vendor_id?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrders,
			params
		),

	getPurchaseOrder: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrder(id)
		),

	createPurchaseOrder: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrders,
			{ method: "POST", body: JSON.stringify(body) }
		),

	updatePurchaseOrder: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrder(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	listInvoices: (params?: { vendor_id?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.invoices,
			params
		),

	getInvoice: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.invoice(id)),

	createInvoice: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.invoices, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateInvoice: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.invoice(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listApprovals: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.approvals),

	updateApproval: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.approval(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listScorecards: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.scorecards),

	listCertificates: (params?: { vendor_id?: string; status?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.certificates,
			params
		),

	listNotifications: (params?: { status?: string }) =>
		listResourcePages<Record<string, unknown>>(
			vendorCoreEndpoints.notifications,
			params
		),

	markNotificationRead: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.notification(id),
			{ method: "PATCH", body: JSON.stringify({}) }
		),

	getVendorMe: () =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.vendorMe),

	listVendorTeam: () =>
		listResourcePages<Record<string, unknown>>(vendorCoreEndpoints.vendorTeam),
};
