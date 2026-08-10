import { getStoredAccessToken, getVendorCoreBaseUrl, vendorCoreFetch } from "@/lib/vendor-core/client";
import type {
	AccountDto,
	AuditRecordDto,
	ConnectionDto,
	CoreUserDto,
	CredentialDto,
	ErrorRecordDto,
	IdentityGroupCreateDto,
	IdentityGroupDto,
	InboundFileDto,
	IntakeJobDto,
	IntakeJobRunDto,
	LoginEventDto,
	MemberCoverageDto,
	MonitoringDashboardDto,
	PaginatedResult,
	ProcessingEventDto,
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
 * Live vendor-core paths (api.vm.tillahealth.com):
 * - Most resources: GET …/list/ + POST …/create/
 * - Intake jobs, inbound files, uploads, monitoring: REST-style roots
 */
export const vendorCoreEndpoints = {
	vendorsList: "/api/v1/vendors/list/",
	vendorsCreate: "/api/v1/vendors/create/",
	vendor: (id: string) => `/api/v1/vendors/${id}/`,
	accountsList: "/api/v1/accounts/list/",
	accountsCreate: "/api/v1/accounts/create/",
	credentialsList: "/api/v1/credentials/list/",
	credentialsCreate: "/api/v1/credentials/create/",
	connectionsList: "/api/v1/connections/list/",
	connectionsCreate: "/api/v1/connections/create/",
	connection: (id: string) => `/api/v1/connections/${id}/`,
	connectionTest: (id: string) => `/api/v1/connections/${id}/test/`,
	intakeJobs: "/api/v1/intake-jobs/",
	intakeJob: (id: string) => `/api/v1/intake-jobs/${id}/`,
	intakeJobRun: (id: string) => `/api/v1/intake-jobs/${id}/run/`,
	intakeJobRunsList: "/api/v1/intake-job-runs/list/",
	memberCoveragesList: "/api/v1/member-coverages/list/",
	memberCoveragesCreate: "/api/v1/member-coverages/create/",
	memberCoveragesSeed: "/api/v1/member-coverages/seed/",
	providersList: "/api/v1/providers/list/",
	providersSeed: "/api/v1/providers/seed/",
	providerRostersList: "/api/v1/provider-rosters/list/",
	claimLinesList: "/api/v1/claim-lines/list/",
	claimLinesCreate: "/api/v1/claim-lines/create/",
	claimLinesSeed: "/api/v1/claim-lines/seed/",
	claimLine: (id: string) => `/api/v1/claim-lines/${id}/`,
	claimLineUpdate: (id: string) => `/api/v1/claim-lines/${id}/update/`,
	claimLineDelete: (id: string) => `/api/v1/claim-lines/${id}/delete/`,
	claimLineHardDelete: (id: string) => `/api/v1/claim-lines/${id}/hard-delete/`,
	claimLineRestore: (id: string) => `/api/v1/claim-lines/${id}/restore/`,
	eligibilityFilesList: "/api/v1/eligibility-files/list/",
	eligibilityFilesCreate: "/api/v1/eligibility-files/create/",
	inboundFiles: "/api/v1/inbound-files/",
	inboundFile: (id: string) => `/api/v1/inbound-files/${id}/`,
	inboundFileEvents: (id: string) => `/api/v1/inbound-files/${id}/events/`,
	inboundFileReprocess: (id: string) =>
		`/api/v1/inbound-files/${id}/reprocess/`,
	inboundFilesSeed: "/api/v1/inbound-files/seed/",
	validationResultsList: "/api/v1/validation-results/list/",
	uploads: "/api/v1/intake/uploads/",
	monitoring: "/api/v1/monitoring/",
	errorsList: "/api/v1/errors/list/",
	error: (id: string) => `/api/v1/errors/${id}/`,
	errorRetry: (id: string) => `/api/v1/errors/${id}/retry/`,
	errorResolve: (id: string) => `/api/v1/errors/${id}/resolve/`,
	routingRulesList: "/api/v1/routing-rules/list/",
	routingRulesCreate: "/api/v1/routing-rules/create/",
	auditList: "/api/v1/audit/list/",
	users: "/api/v1/users/",
	userUpdate: (id: string) => `/api/v1/users/${id}/update/`,
	userPassword: (id: string) => `/api/v1/users/${id}/password/`,
	userLoginEvents: (id: string) => `/api/v1/users/${id}/login-events/`,
	loginEvents: "/api/v1/users/login-events/",
	myLoginEvents: "/api/v1/users/me/login-events/",
	vendorUpdate: (id: string) => `/api/v1/vendors/${id}/update/`,
	vendorDelete: (id: string) => `/api/v1/vendors/${id}/delete/`,
	vendorHardDelete: (id: string) => `/api/v1/vendors/${id}/hard-delete/`,
	vendorRestore: (id: string) => `/api/v1/vendors/${id}/restore/`,
	health: "/health/",
} as const;

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
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendorsCreate, {
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
		vendorCoreFetch<AccountDto>(vendorCoreEndpoints.accountsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((a) => normalizeAccount(a as unknown as Record<string, unknown>)),

	createCredential: (body: {
		name: string;
		kind: string;
		secret_ref: string;
		metadata?: Record<string, unknown>;
	}) =>
		vendorCoreFetch<CredentialDto>(vendorCoreEndpoints.credentialsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	createConnection: (body: Record<string, unknown>) =>
		vendorCoreFetch<ConnectionDto>(vendorCoreEndpoints.connectionsCreate, {
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
		vendorCoreFetch<RoutingRuleDto>(vendorCoreEndpoints.routingRulesCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	listVendors: async (params?: { status?: string; search?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.vendorsList, {
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
			>(vendorCoreEndpoints.accountsList, {
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
			vendorCoreEndpoints.credentialsList,
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
			>(vendorCoreEndpoints.connectionsList, {
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
		// Intake jobs clamp page size (~50); page through until exhausted.
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
		// Runs grow quickly; return one page (UI can filter / refresh).
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.intakeJobRunsList, {
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
			>(vendorCoreEndpoints.memberCoveragesList, {
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

	createEligibilityFile: (body: {
		vendor_id?: string;
		original_filename?: string;
		received_at?: string;
		member_count?: number;
	}) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.eligibilityFilesCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	createMemberCoverage: (body: {
		eligibility_file_id: string;
		subscriber_id: string;
		group_or_policy_number?: string;
		member_first_name?: string;
		member_last_name?: string;
		maintenance_type_code?: string;
		raw_object_id?: string;
	}) =>
		vendorCoreFetch<MemberCoverageDto>(
			vendorCoreEndpoints.memberCoveragesCreate,
			{ method: "POST", body: JSON.stringify(body) }
		).then((row) =>
			normalizeMemberCoverage(row as unknown as Record<string, unknown>)
		),

	seedMemberCoverages: (body?: { vendor_id?: string; count?: number }) =>
		vendorCoreFetch<{
			created: number;
			skipped?: boolean;
			existing?: number;
			eligibility_file_id?: string | null;
		}>(vendorCoreEndpoints.memberCoveragesSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

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

	seedInboundProcessing: (body?: { vendor_id?: string; force?: boolean }) =>
		vendorCoreFetch<{
			created: number;
			skipped?: boolean;
			existing_inbound_files?: number;
			inbound_file_ids?: string[];
		}>(vendorCoreEndpoints.inboundFilesSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

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
			>(vendorCoreEndpoints.validationResultsList, {
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

	getInboundFile: (id: string) =>
		vendorCoreFetch<InboundFileDto>(vendorCoreEndpoints.inboundFileDetail(id)),

	reprocessInboundFile: (id: string) =>
		vendorCoreFetch<InboundFileDto>(
			vendorCoreEndpoints.inboundFileReprocess(id),
			{ method: "POST" }
		),

	listInboundFileEvents: (id: string) =>
		vendorCoreFetch<
			PaginatedResult<{
				id: string;
				stage: string;
				message: string;
				created_at?: string;
			}>
		>(vendorCoreEndpoints.inboundFileEvents(id)),

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
			`${getVendorCoreBaseUrl()}${vendorCoreEndpoints.intakeUploads}`,
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
				vendorCoreEndpoints.errorsList,
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
				vendorCoreEndpoints.providersList,
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
				vendorCoreEndpoints.providerRostersList,
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

	seedProviders: (body?: { vendor_id?: string; count?: number; force?: boolean }) =>
		vendorCoreFetch<{
			created: number;
			skipped?: boolean;
			existing_providers?: number;
			roster_file_id?: string | null;
			provider_ids?: string[];
		}>(vendorCoreEndpoints.providersSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

	listClaimLines: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
				vendorCoreEndpoints.claimLinesList,
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

	getClaimLine: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.claimLine(id)).then(
			(row) => normalizeClaimLine(row)
		),

	createClaimLine: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.claimLinesCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((row) => normalizeClaimLine(row)),

	updateClaimLine: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimLineUpdate(id),
			{
				method: "PATCH",
				body: JSON.stringify(body),
			}
		).then((row) => normalizeClaimLine(row)),

	deleteClaimLine: (id: string) =>
		vendorCoreFetch<{ id: string }>(vendorCoreEndpoints.claimLineDelete(id), {
			method: "DELETE",
		}),

	hardDeleteClaimLine: (id: string) =>
		vendorCoreFetch<{ id: string }>(vendorCoreEndpoints.claimLineHardDelete(id), {
			method: "DELETE",
		}),

	restoreClaimLine: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimLineRestore(id),
			{ method: "POST" }
		).then((row) => normalizeClaimLine(row)),

	seedClaimLines: (body?: { vendor_id?: string; force?: boolean }) =>
		vendorCoreFetch<{
			created: number;
			skipped?: boolean;
			existing_claim_lines?: number;
			batch_id?: string | null;
			claim_line_ids?: string[];
		}>(vendorCoreEndpoints.claimLinesSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

	listRoutingRules: () =>
		vendorCoreFetch<PaginatedResult<RoutingRuleDto>>(
			vendorCoreEndpoints.routingRulesList,
			{ params: pageParams() }
		),

	listAudit: (params?: { resource_type?: string; action?: string }) =>
		vendorCoreFetch<PaginatedResult<AuditRecordDto>>(
			vendorCoreEndpoints.auditList,
			{ params: pageParams(params) }
		),

	updateVendor: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendorUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	deleteVendor: (id: string) =>
		vendorCoreFetch<unknown>(vendorCoreEndpoints.vendorDelete(id), {
			method: "DELETE",
		}),

	hardDeleteVendor: (id: string) =>
		vendorCoreFetch<unknown>(vendorCoreEndpoints.vendorHardDelete(id), {
			method: "DELETE",
		}),

	restoreVendor: (id: string) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendorRestore(id), {
			method: "POST",
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
};
