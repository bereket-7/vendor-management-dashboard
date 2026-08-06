import { getStoredAccessToken, getVendorCoreBaseUrl, vendorCoreFetch } from "@/lib/vendor-core/client";
import type {
	AccountDto,
	AppSettingDto,
	AuditRecordDto,
	ConnectionDto,
	CredentialDto,
	ErrorRecordDto,
	IdentityGroupCreateDto,
	IdentityGroupDto,
	InboundFileDto,
	IntakeJobDto,
	IntakeJobRunDto,
	MonitoringDashboardDto,
	PaginatedResult,
	RoleDto,
	RoutingRuleDto,
	UserListDto,
	VendorDto,
} from "@/lib/vendor-core/types";

export const vendorCoreEndpoints = {
	vendors: "/api/v1/vendors/",
	vendorDetail: (id: string) => `/api/v1/vendors/${id}/`,
	vendorInvite: "/api/v1/vendors/invite/",
	accounts: "/api/v1/accounts/",
	credentials: "/api/v1/credentials/",
	connections: "/api/v1/connections/",
	connectionTest: (id: string) => `/api/v1/connections/${id}/test/`,
	intakeJobs: "/api/v1/intake-jobs/",
	intakeJobDetail: (id: string) => `/api/v1/intake-jobs/${id}/`,
	intakeJobRun: (id: string) => `/api/v1/intake-jobs/${id}/run/`,
	intakeJobRuns: "/api/v1/intake-job-runs/",
	inboundFiles: "/api/v1/inbound-files/",
	inboundFileDetail: (id: string) => `/api/v1/inbound-files/${id}/`,
	inboundFileReprocess: (id: string) => `/api/v1/inbound-files/${id}/reprocess/`,
	inboundFileEvents: (id: string) => `/api/v1/inbound-files/${id}/events/`,
	intakeUploads: "/api/v1/intake/uploads/",
	monitoring: "/api/v1/monitoring/",
	errors: "/api/v1/errors/",
	errorRetry: (id: string) => `/api/v1/errors/${id}/retry/`,
	errorResolve: (id: string) => `/api/v1/errors/${id}/resolve/`,
	routingRules: "/api/v1/routing-rules/",
	audit: "/api/v1/audit/",
	validationResults: "/api/v1/validation-results/",
	identityGroups: "/api/v1/identity-groups/",
	identityGroupDetail: (id: string) => `/api/v1/identity-groups/${id}/`,
	roles: "/api/v1/roles/",
	settings: "/api/v1/settings/",
	users: "/api/v1/users/",
	categories: "/api/v1/categories/",
	onboarding: "/api/v1/onboarding/",
	onboardingDetail: (id: string) => `/api/v1/onboarding/${id}/`,
	documents: "/api/v1/documents/",
	documentDetail: (id: string) => `/api/v1/documents/${id}/`,
	certificates: "/api/v1/certificates/",
	contracts: "/api/v1/contracts/",
	contractDetail: (id: string) => `/api/v1/contracts/${id}/`,
	rfx: "/api/v1/rfx/",
	rfxDetail: (id: string) => `/api/v1/rfx/${id}/`,
	rfxBids: (id: string) => `/api/v1/rfx/${id}/bids/`,
	purchaseOrders: "/api/v1/purchase-orders/",
	purchaseOrderDetail: (id: string) => `/api/v1/purchase-orders/${id}/`,
	invoices: "/api/v1/invoices/",
	invoiceDetail: (id: string) => `/api/v1/invoices/${id}/`,
	approvals: "/api/v1/approvals/",
	approvalDetail: (id: string) => `/api/v1/approvals/${id}/`,
	scorecards: "/api/v1/scorecards/",
	notifications: "/api/v1/notifications/",
	vendorMe: "/api/v1/vendor/me/",
	vendorTeam: "/api/v1/vendor/team/",
	claimVendorFiles: "/api/v1/claim-vendor-files/",
	claimVendorFileDetail: (id: string) => `/api/v1/claim-vendor-files/${id}/`,
	claimLines: "/api/v1/claim-lines/",
	claimResponses: "/api/v1/claim-responses/",
	claimExceptions: "/api/v1/claim-exceptions/",
	submissionBatches: "/api/v1/submission-batches/",
	eligibilityFiles: "/api/v1/eligibility-files/",
	memberCoverages: "/api/v1/member-coverages/",
	providers: "/api/v1/providers/",
	providerRosters: "/api/v1/provider-rosters/",
} as const;

export const vendorCoreApi = {
	listVendors: (params?: { status?: string; search?: string }) =>
		vendorCoreFetch<PaginatedResult<VendorDto>>(vendorCoreEndpoints.vendors, {
			params,
		}),

	getVendor: (id: string) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendorDetail(id)),

	listAccounts: (params?: { vendor_id?: string }) =>
		vendorCoreFetch<PaginatedResult<AccountDto>>(vendorCoreEndpoints.accounts, {
			params,
		}),

	listCredentials: () =>
		vendorCoreFetch<PaginatedResult<CredentialDto>>(
			vendorCoreEndpoints.credentials
		),

	listConnections: (params?: {
		method?: string;
		status?: string;
		vendor_id?: string;
	}) =>
		vendorCoreFetch<PaginatedResult<ConnectionDto>>(
			vendorCoreEndpoints.connections,
			{ params }
		),

	testConnection: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.connectionTest(id),
			{ method: "POST" }
		),

	listIntakeJobs: (params?: { status?: string; vendor_id?: string }) =>
		vendorCoreFetch<PaginatedResult<IntakeJobDto>>(
			vendorCoreEndpoints.intakeJobs,
			{ params }
		),

	getIntakeJob: (id: string) =>
		vendorCoreFetch<IntakeJobDto>(vendorCoreEndpoints.intakeJobDetail(id)),

	runIntakeJob: (id: string) =>
		vendorCoreFetch<{ task_id: string; job_id: string }>(
			vendorCoreEndpoints.intakeJobRun(id),
			{ method: "POST" }
		),

	listIntakeJobRuns: (params?: { job_id?: string; stage?: string }) =>
		vendorCoreFetch<PaginatedResult<IntakeJobRunDto>>(
			vendorCoreEndpoints.intakeJobRuns,
			{ params }
		),

	listInboundFiles: (params?: { stage?: string; vendor_id?: string }) =>
		vendorCoreFetch<PaginatedResult<InboundFileDto>>(
			vendorCoreEndpoints.inboundFiles,
			{ params }
		),

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

	listErrors: (params?: { status?: string; category?: string }) =>
		vendorCoreFetch<PaginatedResult<ErrorRecordDto>>(
			vendorCoreEndpoints.errors,
			{ params }
		),

	retryError: (id: string) =>
		vendorCoreFetch<ErrorRecordDto>(vendorCoreEndpoints.errorRetry(id), {
			method: "POST",
		}),

	resolveError: (id: string, resolution_notes?: string) =>
		vendorCoreFetch<ErrorRecordDto>(vendorCoreEndpoints.errorResolve(id), {
			method: "POST",
			body: JSON.stringify({ resolution_notes: resolution_notes ?? "" }),
		}),

	listRoutingRules: () =>
		vendorCoreFetch<PaginatedResult<RoutingRuleDto>>(
			vendorCoreEndpoints.routingRules
		),

	listAudit: (params?: { resource_type?: string; action?: string }) =>
		vendorCoreFetch<PaginatedResult<AuditRecordDto>>(vendorCoreEndpoints.audit, {
			params,
		}),

	listValidationResults: (params?: { inbound_file?: string }) =>
		vendorCoreFetch<
			PaginatedResult<{
				id: string;
				inbound_file: string | null;
				profile: string;
				is_valid: boolean;
				errors: unknown;
				warnings: unknown;
				created_at?: string;
			}>
		>(vendorCoreEndpoints.validationResults, { params }),

	// Identity
	listIdentityGroups: () =>
		vendorCoreFetch<PaginatedResult<IdentityGroupDto> | IdentityGroupDto[]>(
			vendorCoreEndpoints.identityGroups
		),

	getIdentityGroup: (id: string) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupDetail(id)
		),

	createIdentityGroup: (data: IdentityGroupCreateDto) =>
		vendorCoreFetch<IdentityGroupDto>(vendorCoreEndpoints.identityGroups, {
			method: "POST",
			body: JSON.stringify(data),
		}),

	updateIdentityGroup: (id: string, data: Partial<IdentityGroupCreateDto>) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupDetail(id),
			{
				method: "PATCH",
				body: JSON.stringify(data),
			}
		),

	deleteIdentityGroup: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.identityGroupDetail(id), {
			method: "DELETE",
		}),

	listRoles: () =>
		vendorCoreFetch<PaginatedResult<RoleDto> | RoleDto[]>(
			vendorCoreEndpoints.roles
		),

	listSettings: () =>
		vendorCoreFetch<PaginatedResult<AppSettingDto> | AppSettingDto[]>(
			vendorCoreEndpoints.settings
		),

	listUsers: () =>
		vendorCoreFetch<PaginatedResult<UserListDto> | UserListDto[]>(
			vendorCoreEndpoints.users
		),
};
