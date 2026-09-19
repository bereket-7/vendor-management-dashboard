import {
	getStoredAccessToken,
	getVendorCoreBaseUrl,
	vendorCoreFetch,
	vendorCoreFetchBlob,
} from "@/lib/vendor-core/client";
import type {
	AccountCreateInput,
	AccountDto,
	AccountOpsSummaryDto,
	AccountUpdateInput,
	AccumulatorFileDto,
	AccumulatorFileListQuery,
	AccumulatorRowCreateInput,
	AccumulatorRowDetailDto,
	AccumulatorRowListDto,
	AccumulatorRowListQuery,
	AccumulatorRowUpdateInput,
	AppSettingCreateInput,
	AppSettingDto,
	AppSettingListQuery,
	AppSettingUpdateInput,
	AuditListQuery,
	AuditRecordDto,
	ClaimHeaderDetailDto,
	ClaimHeaderListDto,
	ClaimHeaderListQuery,
	ClaimHeaderSummaryDto,
	ClaimHeaderValidateResult,
	ClaimHeaderVoidReplaceInput,
	ClaimLineDto,
	CmsEdgeActivityDto,
	CmsEdgeAuditRequestDto,
	CmsEdgeCmsResponseDto,
	CmsEdgeDocumentDto,
	CmsEdgeFilePackageCreateInput,
	CmsEdgeFilePackageDto,
	CmsEdgeFilePackageListQuery,
	CmsEdgeListQuery,
	CmsEdgeOverviewExceptionDto,
	CmsEdgeOverviewStatsDto,
	CmsEdgeReportingPeriodDto,
	CmsEdgeSeedResultDto,
	CmsEdgeSettingsDto,
	CmsEdgeSettingsUpdateInput,
	CmsEdgeSubmissionDto,
	CmsEdgeValidationRunDto,
	CmsEdgeWorkflowDto,
	ConnectionCompactDto,
	ConnectionCreateInput,
	ConnectionDiscoverHostKeyResult,
	ConnectionDto,
	ConnectionTestResult,
	ConnectionUpdateInput,
	ContractCreateInput,
	ContractDetailDto,
	ContractDto,
	ContractListQuery,
	ContractUpdateInput,
	CoreUserDto,
	CredentialCreateInput,
	CredentialDto,
	EligibilityFileDto,
	ErrorRecordDto,
	IdentityGroupCreateInput,
	IdentityGroupDto,
	IdentityGroupListQuery,
	IdentityGroupUpdateInput,
	InboundFileDto,
	IntakeJobDto,
	LoginEventDto,
	MemberAccumulatorSummaryDto,
	MemberCoverageDto,
	MemberCreateBody,
	MemberDashboardStatsDto,
	MemberDashboardStatsQuery,
	MemberDetailDto,
	MemberListDto,
	MemberListQuery,
	MemberWriteBody,
	MigrationCaseBlockerTransitionInput,
	MigrationCaseBulkStatusInput,
	MigrationCaseBulkStatusResultDto,
	MigrationCaseCreateInput,
	MigrationCaseDto,
	MigrationCaseEscalationInput,
	MigrationCaseEventDto,
	MigrationCaseListQuery,
	MigrationCaseProgressUpdateInput,
	MigrationCaseUpdateInput,
	MigrationStatusDto,
	MonitoringDashboardDto,
	OnboardingSeedResultDto,
	PaginatedResult,
	PharmacyClaimFileDto,
	PharmacyClaimFileListQuery,
	PharmacyClaimRowCreateInput,
	PharmacyClaimRowDetailDto,
	PharmacyClaimRowListDto,
	PharmacyClaimRowListQuery,
	PharmacyClaimRowUpdateInput,
	ProcurementDocumentCreateInput,
	ProcurementDocumentDto,
	ProcurementDocumentListQuery,
	ProviderCreateInput,
	ProviderCredentialCreateInput,
	ProviderCredentialDto,
	ProviderCredentialUpdateInput,
	ProviderDashboardStatsDto,
	ProviderDashboardStatsQuery,
	ProviderDto,
	ProviderExceptionCreateInput,
	ProviderExceptionDto,
	ProviderExceptionUpdateInput,
	ProviderIdentifierCreateInput,
	ProviderIdentifierDto,
	ProviderIdentifierUpdateInput,
	ProviderListQuery,
	ProviderLocationCreateInput,
	ProviderLocationDto,
	ProviderLocationUpdateInput,
	ProviderMonthlyVolumeDto,
	ProviderNetworkCreateInput,
	ProviderNetworkDto,
	ProviderNetworkUpdateInput,
	ProviderProfileDto,
	ProviderProfileUpdateInput,
	ProviderRecentActivityDto,
	ProviderRecentActivityQuery,
	ProviderRejectionReasonDto,
	ProviderRosterCreateInput,
	ProviderRosterDto,
	ProviderRosterListQuery,
	ProviderRosterUpdateInput,
	ProviderStatusInput,
	ProviderSummaryDto,
	ProviderUpdateInput,
	ProviderVendorSourceDto,
	RoleCreateInput,
	RoleDto,
	RoleListQuery,
	RoleUpdateInput,
	RoutingRuleDto,
	ValidationResultDto,
	VendorCategoryAssignmentCreateInput,
	VendorCategoryAssignmentDto,
	VendorCategoryAssignmentListQuery,
	VendorCategoryDto,
	VendorCategoryListQuery,
	VendorContactCreateInput,
	VendorContactDto,
	VendorContactUpdateInput,
	VendorCreateInput,
	VendorDto,
	VendorIntegrationProfileDto,
	VendorIntegrationProfileUpdateInput,
	VendorInviteCreateInput,
	VendorInviteDto,
	VendorNoteCreateInput,
	VendorNoteDto,
	VendorNoteUpdateInput,
	VendorTeamMemberDto,
	WhitelistStatusDto,
	WorkQueueFilterQuery,
	WorkQueueImportResultDto,
	WorkQueueSeedInput,
	WorkQueueSeedResultDto,
} from "@/lib/vendor-core/types";
import {
	normalizeAccount,
	normalizeClaimLine,
	normalizeConnection,
	normalizeEligibilityFile,
	normalizeErrorRecord,
	normalizeInboundFile,
	normalizeJob,
	normalizeJobRun,
	normalizeMemberCoverage,
	normalizeMigrationCase,
	normalizeMigrationCaseDocument,
	normalizeProcessingEvent,
	normalizeProvider,
	normalizeProviderRoster,
	normalizeValidationResult,
	normalizeVendor,
	normalizeWorkQueueAnalystStatsRow,
	normalizeWorkQueueBlockerRow,
	normalizeWorkQueueKpis,
	normalizeWorkQueueProgressSummary,
} from "@/lib/vendor-core/types";

/**
 * Live vendor-core paths (api.vm.tillahealth.com):
 * - Most resources: GET …/list/ + POST …/create/
 * - Intake jobs, inbound files, uploads, monitoring: REST-style roots
 */
export const vendorCoreEndpoints = {
	vendorsList: "/api/v1/vendors/list/",
	vendorsCreate: "/api/v1/vendors/create/",
	vendorsInvite: "/api/v1/vendors/invite/",
	vendorsMe: "/api/v1/vendors/me/",
	vendorsTeam: "/api/v1/vendors/team/",
	vendor: (id: string) => `/api/v1/vendors/${id}/`,
	vendorIntegrationProfile: (id: string) =>
		`/api/v1/vendors/${id}/integration-profile/`,
	vendorIntegrationProfileUpdate: (id: string) =>
		`/api/v1/vendors/${id}/integration-profile/update/`,
	accountsList: "/api/v1/accounts/list/",
	accountsCreate: "/api/v1/accounts/create/",
	account: (id: string) => `/api/v1/accounts/${id}/`,
	accountUpdate: (id: string) => `/api/v1/accounts/${id}/update/`,
	accountDelete: (id: string) => `/api/v1/accounts/${id}/delete/`,
	accountRestore: (id: string) => `/api/v1/accounts/${id}/restore/`,
	accountHardDelete: (id: string) => `/api/v1/accounts/${id}/hard-delete/`,
	accountOpsSummaryList: "/api/v1/accounts/ops-summary/list/",
	categoriesList: "/api/v1/categories/list/",
	vendorCategoryAssignmentsList: "/api/v1/vendor-category-assignments/list/",
	vendorCategoryAssignmentsCreate:
		"/api/v1/vendor-category-assignments/create/",
	contractsList: "/api/v1/contracts/list/",
	contractsCreate: "/api/v1/contracts/create/",
	contract: (id: string) => `/api/v1/contracts/${id}/`,
	contractUpdate: (id: string) => `/api/v1/contracts/${id}/update/`,
	documentsList: "/api/v1/documents/list/",
	documentsCreate: "/api/v1/documents/create/",
	document: (id: string) => `/api/v1/documents/${id}/`,
	documentUpdate: (id: string) => `/api/v1/documents/${id}/update/`,
	documentDownload: (id: string) => `/api/v1/documents/${id}/download/`,
	onboardingList: "/api/v1/onboarding/list/",
	onboardingCreate: "/api/v1/onboarding/create/",
	onboardingSeed: "/api/v1/onboarding/seed/",
	onboarding: (id: string) => `/api/v1/onboarding/${id}/`,
	onboardingUpdate: (id: string) => `/api/v1/onboarding/${id}/update/`,
	onboardingSubmit: (id: string) => `/api/v1/onboarding/${id}/submit/`,
	onboardingApprove: (id: string) => `/api/v1/onboarding/${id}/approve/`,
	onboardingReject: (id: string) => `/api/v1/onboarding/${id}/reject/`,
	certificatesList: "/api/v1/certificates/list/",
	certificatesCreate: "/api/v1/certificates/create/",
	certificateUpdate: (id: string) => `/api/v1/certificates/${id}/update/`,
	rfxList: "/api/v1/rfx/list/",
	rfxCreate: "/api/v1/rfx/create/",
	rfx: (id: string) => `/api/v1/rfx/${id}/`,
	rfxUpdate: (id: string) => `/api/v1/rfx/${id}/update/`,
	rfxPublish: (id: string) => `/api/v1/rfx/${id}/publish/`,
	rfxAward: (id: string) => `/api/v1/rfx/${id}/award/`,
	rfxBidsList: (id: string) => `/api/v1/rfx/${id}/bids/list/`,
	rfxBidsCreate: (id: string) => `/api/v1/rfx/${id}/bids/create/`,
	purchaseOrdersList: "/api/v1/purchase-orders/list/",
	purchaseOrdersCreate: "/api/v1/purchase-orders/create/",
	purchaseOrder: (id: string) => `/api/v1/purchase-orders/${id}/`,
	purchaseOrderUpdate: (id: string) => `/api/v1/purchase-orders/${id}/update/`,
	purchaseOrderAcknowledge: (id: string) =>
		`/api/v1/purchase-orders/${id}/acknowledge/`,
	purchaseOrderReceive: (id: string) =>
		`/api/v1/purchase-orders/${id}/receive/`,
	invoicesList: "/api/v1/invoices/list/",
	invoicesCreate: "/api/v1/invoices/create/",
	invoice: (id: string) => `/api/v1/invoices/${id}/`,
	invoiceUpdate: (id: string) => `/api/v1/invoices/${id}/update/`,
	invoiceMatch: (id: string) => `/api/v1/invoices/${id}/match/`,
	invoiceDispute: (id: string) => `/api/v1/invoices/${id}/dispute/`,
	invoiceApprove: (id: string) => `/api/v1/invoices/${id}/approve/`,
	approvalsList: "/api/v1/approvals/list/",
	approval: (id: string) => `/api/v1/approvals/${id}/`,
	approvalUpdate: (id: string) => `/api/v1/approvals/${id}/update/`,
	approvalDecide: (id: string) => `/api/v1/approvals/${id}/decide/`,
	scorecardsList: "/api/v1/scorecards/list/",
	scorecardsCreate: "/api/v1/scorecards/create/",
	scorecard: (id: string) => `/api/v1/scorecards/${id}/`,
	notificationsList: "/api/v1/notifications/list/",
	notificationMarkRead: (id: string) =>
		`/api/v1/notifications/${id}/mark-read/`,
	vendorContactsList: "/api/v1/vendor-contacts/list/",
	vendorContactsCreate: "/api/v1/vendor-contacts/create/",
	vendorContact: (id: string) => `/api/v1/vendor-contacts/${id}/`,
	vendorContactUpdate: (id: string) => `/api/v1/vendor-contacts/${id}/update/`,
	vendorContactDelete: (id: string) => `/api/v1/vendor-contacts/${id}/delete/`,
	vendorContactRestore: (id: string) =>
		`/api/v1/vendor-contacts/${id}/restore/`,
	vendorContactHardDelete: (id: string) =>
		`/api/v1/vendor-contacts/${id}/hard-delete/`,
	vendorNotesList: "/api/v1/vendor-notes/list/",
	vendorNotesCreate: "/api/v1/vendor-notes/create/",
	vendorNote: (id: string) => `/api/v1/vendor-notes/${id}/`,
	vendorNoteUpdate: (id: string) => `/api/v1/vendor-notes/${id}/update/`,
	vendorNoteDelete: (id: string) => `/api/v1/vendor-notes/${id}/delete/`,
	vendorNoteRestore: (id: string) => `/api/v1/vendor-notes/${id}/restore/`,
	vendorNoteHardDelete: (id: string) =>
		`/api/v1/vendor-notes/${id}/hard-delete/`,
	credentialsList: "/api/v1/credentials/list/",
	credentialsCreate: "/api/v1/credentials/create/",
	credential: (id: string) => `/api/v1/credentials/${id}/`,
	credentialUpdate: (id: string) => `/api/v1/credentials/${id}/update/`,
	credentialDelete: (id: string) => `/api/v1/credentials/${id}/delete/`,
	credentialRestore: (id: string) => `/api/v1/credentials/${id}/restore/`,
	credentialHardDelete: (id: string) =>
		`/api/v1/credentials/${id}/hard-delete/`,
	connectionsList: "/api/v1/connections/list/",
	connectionsCreate: "/api/v1/connections/create/",
	connection: (id: string) => `/api/v1/connections/${id}/`,
	connectionUpdate: (id: string) => `/api/v1/connections/${id}/update/`,
	connectionDelete: (id: string) => `/api/v1/connections/${id}/delete/`,
	connectionRestore: (id: string) => `/api/v1/connections/${id}/restore/`,
	connectionHardDelete: (id: string) =>
		`/api/v1/connections/${id}/hard-delete/`,
	connectionTest: (id: string) => `/api/v1/connections/${id}/test/`,
	intakeJobs: "/api/v1/intake-jobs/",
	intakeJob: (id: string) => `/api/v1/intake-jobs/${id}/`,
	intakeJobRun: (id: string) => `/api/v1/intake-jobs/${id}/run/`,
	intakeJobDisable: (id: string) => `/api/v1/intake-jobs/${id}/disable/`,
	intakeCompletionSftp: "/api/v1/intake/completion/sftp/",
	intakeCompletionEdi: "/api/v1/intake/completion/edi/",
	intakeJobRunsList: "/api/v1/intake-job-runs/list/",
	memberCoveragesList: "/api/v1/member-coverages/list/",
	memberCoveragesCreate: "/api/v1/member-coverages/create/",
	memberCoveragesSeed: "/api/v1/member-coverages/seed/",
	membersList: "/api/v1/members/list/",
	membersStats: "/api/v1/members/stats/",
	membersFacets: "/api/v1/members/facets/",
	membersListExportCsv: "/api/v1/members/list/export/csv/",
	membersCreate: "/api/v1/members/create/",
	membersSeed: "/api/v1/members/seed/",
	member: (id: string) => `/api/v1/members/${id}/`,
	memberUpdate: (id: string) => `/api/v1/members/${id}/update/`,
	memberDelete: (id: string) => `/api/v1/members/${id}/delete/`,
	memberHardDelete: (id: string) => `/api/v1/members/${id}/hard-delete/`,
	memberRestore: (id: string) => `/api/v1/members/${id}/restore/`,
	memberDetailExportCsv: (id: string) => `/api/v1/members/${id}/export/csv/`,
	memberDetailExportPdf: (id: string) => `/api/v1/members/${id}/export/pdf/`,
	memberPrint: (id: string) => `/api/v1/members/${id}/print/`,
	memberDocumentSummaryPdf: (id: string) =>
		`/api/v1/members/${id}/documents/summary/pdf/`,
	memberDocumentEligibilityLetterPdf: (id: string) =>
		`/api/v1/members/${id}/documents/eligibility-letter/pdf/`,
	memberDocumentCoverageCardPdf: (id: string) =>
		`/api/v1/members/${id}/documents/coverage-card/pdf/`,
	memberSourceRecordsList: (id: string) =>
		`/api/v1/members/${id}/source-records/list/`,
	memberSourceRecord: (id: string, rid: string) =>
		`/api/v1/members/${id}/source-records/${rid}/`,
	memberEligibilityHistoryList: (id: string) =>
		`/api/v1/members/${id}/eligibility-history/list/`,
	memberPlanHistoryList: (id: string) =>
		`/api/v1/members/${id}/plan-history/list/`,
	memberExceptionsList: (id: string) =>
		`/api/v1/members/${id}/exceptions/list/`,
	memberExceptionsCreate: (id: string) =>
		`/api/v1/members/${id}/exceptions/create/`,
	memberExceptionUpdate: (id: string, exceptionId: string) =>
		`/api/v1/members/${id}/exceptions/${exceptionId}/update/`,
	memberExceptionDelete: (id: string, exceptionId: string) =>
		`/api/v1/members/${id}/exceptions/${exceptionId}/delete/`,
	memberAccumulatorsList: (id: string) =>
		`/api/v1/members/${id}/accumulators/list/`,
	memberAccumulatorsSummary: (id: string) =>
		`/api/v1/members/${id}/accumulators/summary/`,
	memberAccumulatorsCreate: (id: string) =>
		`/api/v1/members/${id}/accumulators/create/`,
	memberAccumulatorUpdate: (id: string, accumulatorId: string) =>
		`/api/v1/members/${id}/accumulators/${accumulatorId}/update/`,
	memberAccumulatorDelete: (id: string, accumulatorId: string) =>
		`/api/v1/members/${id}/accumulators/${accumulatorId}/delete/`,
	accumulatorFilesList: "/api/v1/accumulator-files/list/",
	accumulatorFile: (id: string) => `/api/v1/accumulator-files/${id}/`,
	accumulatorRowsList: "/api/v1/accumulator-rows/list/",
	accumulatorRowsCreate: "/api/v1/accumulator-rows/create/",
	accumulatorRow: (id: string) => `/api/v1/accumulator-rows/${id}/`,
	accumulatorRowUpdate: (id: string) =>
		`/api/v1/accumulator-rows/${id}/update/`,
	accumulatorRowDelete: (id: string) =>
		`/api/v1/accumulator-rows/${id}/delete/`,
	pharmacyClaimFilesList: "/api/v1/pharmacy-claim-files/list/",
	pharmacyClaimFile: (id: string) => `/api/v1/pharmacy-claim-files/${id}/`,
	pharmacyClaimRowsList: "/api/v1/pharmacy-claim-rows/list/",
	pharmacyClaimRowsCreate: "/api/v1/pharmacy-claim-rows/create/",
	pharmacyClaimRowsSeed: "/api/v1/pharmacy-claim-rows/seed/",
	pharmacyClaimRow: (id: string) => `/api/v1/pharmacy-claim-rows/${id}/`,
	pharmacyClaimRowUpdate: (id: string) =>
		`/api/v1/pharmacy-claim-rows/${id}/update/`,
	pharmacyClaimRowDelete: (id: string) =>
		`/api/v1/pharmacy-claim-rows/${id}/delete/`,
	pharmacyClaimRowVoid: (id: string) =>
		`/api/v1/pharmacy-claim-rows/${id}/void/`,
	memberClaimsList: (id: string) => `/api/v1/members/${id}/claims/list/`,
	memberClaimsCreate: (id: string) => `/api/v1/members/${id}/claims/create/`,
	memberClaimUpdate: (id: string, claimId: string) =>
		`/api/v1/members/${id}/claims/${claimId}/update/`,
	memberClaimDelete: (id: string, claimId: string) =>
		`/api/v1/members/${id}/claims/${claimId}/delete/`,
	memberChangeEventsList: (id: string) =>
		`/api/v1/members/${id}/change-events/list/`,
	memberFamilyLinksList: (id: string) =>
		`/api/v1/members/${id}/family-links/list/`,
	memberFamilyLinksCreate: (id: string) =>
		`/api/v1/members/${id}/family-links/create/`,
	memberFamilyLinksSync: (id: string) =>
		`/api/v1/members/${id}/family-links/sync/`,
	memberFamilyLink: (id: string, linkId: string) =>
		`/api/v1/members/${id}/family-links/${linkId}/`,
	memberFamilyLinkUpdate: (id: string, linkId: string) =>
		`/api/v1/members/${id}/family-links/${linkId}/update/`,
	memberFamilyLinkDelete: (id: string, linkId: string) =>
		`/api/v1/members/${id}/family-links/${linkId}/delete/`,
	memberFamilyLinkTransfer: (id: string, linkId: string) =>
		`/api/v1/members/${id}/family-links/${linkId}/transfer/`,
	providersList: "/api/v1/providers/list/",
	providersCreate: "/api/v1/providers/create/",
	providersStats: "/api/v1/providers/stats/",
	providersFacets: "/api/v1/providers/facets/",
	providersListExportCsv: "/api/v1/providers/list/export/csv/",
	providersSeed: "/api/v1/providers/seed/",
	provider: (id: string) => `/api/v1/providers/${id}/`,
	providerUpdate: (id: string) => `/api/v1/providers/${id}/update/`,
	providerDelete: (id: string) => `/api/v1/providers/${id}/delete/`,
	providerRestore: (id: string) => `/api/v1/providers/${id}/restore/`,
	providerHardDelete: (id: string) => `/api/v1/providers/${id}/hard-delete/`,
	providerStatus: (id: string) => `/api/v1/providers/${id}/status/`,
	providerProfile: (id: string) => `/api/v1/providers/${id}/profile/`,
	providerProfileUpdate: (id: string) =>
		`/api/v1/providers/${id}/profile/update/`,
	providerSummary: (id: string) => `/api/v1/providers/${id}/summary/`,
	providerVendorSourcesList: (id: string) =>
		`/api/v1/providers/${id}/vendor-sources/list/`,
	providerLocationsList: (id: string) =>
		`/api/v1/providers/${id}/locations/list/`,
	providerIdentifiersList: (id: string) =>
		`/api/v1/providers/${id}/identifiers/list/`,
	providerIdentifiersCreate: (id: string) =>
		`/api/v1/providers/${id}/identifiers/create/`,
	providerIdentifierUpdate: (id: string, identifierId: string) =>
		`/api/v1/providers/${id}/identifiers/${identifierId}/update/`,
	providerNetworksList: (id: string) =>
		`/api/v1/providers/${id}/networks/list/`,
	providerCredentialsList: (id: string) =>
		`/api/v1/providers/${id}/credentials/list/`,
	providerExceptionsList: (id: string) =>
		`/api/v1/providers/${id}/exceptions/list/`,
	providerMonthlyVolumeList: (id: string) =>
		`/api/v1/providers/${id}/claims/monthly-volume/list/`,
	providerRejectionReasonsList: (id: string) =>
		`/api/v1/providers/${id}/claims/rejection-reasons/list/`,
	providerRecentActivityList: (id: string) =>
		`/api/v1/providers/${id}/claims/recent/list/`,
	providerLocationCreate: (id: string) =>
		`/api/v1/providers/${id}/locations/create/`,
	providerLocationUpdate: (id: string, locationId: string) =>
		`/api/v1/providers/${id}/locations/${locationId}/update/`,
	providerLocationDelete: (id: string, locationId: string) =>
		`/api/v1/providers/${id}/locations/${locationId}/delete/`,
	providerIdentifierDelete: (id: string, identifierId: string) =>
		`/api/v1/providers/${id}/identifiers/${identifierId}/delete/`,
	providerNetworkCreate: (id: string) =>
		`/api/v1/providers/${id}/networks/create/`,
	providerNetworkUpdate: (id: string, networkId: string) =>
		`/api/v1/providers/${id}/networks/${networkId}/update/`,
	providerNetworkDelete: (id: string, networkId: string) =>
		`/api/v1/providers/${id}/networks/${networkId}/delete/`,
	providerCredentialCreate: (id: string) =>
		`/api/v1/providers/${id}/credentials/create/`,
	providerCredentialUpdate: (id: string, credentialId: string) =>
		`/api/v1/providers/${id}/credentials/${credentialId}/update/`,
	providerCredentialDelete: (id: string, credentialId: string) =>
		`/api/v1/providers/${id}/credentials/${credentialId}/delete/`,
	providerExceptionCreate: (id: string) =>
		`/api/v1/providers/${id}/exceptions/create/`,
	providerExceptionUpdate: (id: string, exceptionId: string) =>
		`/api/v1/providers/${id}/exceptions/${exceptionId}/update/`,
	providerExceptionDelete: (id: string, exceptionId: string) =>
		`/api/v1/providers/${id}/exceptions/${exceptionId}/delete/`,
	providerRosterProvidersList: (id: string) =>
		`/api/v1/provider-rosters/${id}/providers/list/`,
	providerRostersList: "/api/v1/provider-rosters/list/",
	providerRostersCreate: "/api/v1/provider-rosters/create/",
	providerRoster: (id: string) => `/api/v1/provider-rosters/${id}/`,
	providerRosterUpdate: (id: string) =>
		`/api/v1/provider-rosters/${id}/update/`,
	providerRosterDelete: (id: string) =>
		`/api/v1/provider-rosters/${id}/delete/`,
	providerRosterRestore: (id: string) =>
		`/api/v1/provider-rosters/${id}/restore/`,
	providerRosterHardDelete: (id: string) =>
		`/api/v1/provider-rosters/${id}/hard-delete/`,
	providerRosterRecount: (id: string) =>
		`/api/v1/provider-rosters/${id}/recount/`,
	migrationCasesList: "/api/v1/migration-cases/list/",
	migrationCasesCreate: "/api/v1/migration-cases/create/",
	migrationCasesBulkStatus: "/api/v1/migration-cases/bulk-status/",
	migrationCase: (id: string) => `/api/v1/migration-cases/${id}/`,
	migrationCaseUpdate: (id: string) => `/api/v1/migration-cases/${id}/update/`,
	migrationCaseDelete: (id: string) => `/api/v1/migration-cases/${id}/delete/`,
	migrationCaseRestore: (id: string) =>
		`/api/v1/migration-cases/${id}/restore/`,
	migrationCaseHardDelete: (id: string) =>
		`/api/v1/migration-cases/${id}/hard-delete/`,
	migrationCaseAssign: (id: string) => `/api/v1/migration-cases/${id}/assign/`,
	migrationCaseSftpProgressUpdate: (id: string) =>
		`/api/v1/migration-cases/${id}/sftp-progress/update/`,
	migrationCaseEdiProgressUpdate: (id: string) =>
		`/api/v1/migration-cases/${id}/edi-progress/update/`,
	migrationCaseEscalation: (id: string) =>
		`/api/v1/migration-cases/${id}/escalation/`,
	migrationCaseStatus: (id: string) => `/api/v1/migration-cases/${id}/status/`,
	migrationCaseWhitelist: (id: string) =>
		`/api/v1/migration-cases/${id}/whitelist/`,
	migrationCaseMarkTesting: (id: string) =>
		`/api/v1/migration-cases/${id}/mark-testing/`,
	migrationCaseMarkReady: (id: string) =>
		`/api/v1/migration-cases/${id}/mark-ready/`,
	migrationCaseMarkWaitingOnVendor: (id: string) =>
		`/api/v1/migration-cases/${id}/mark-waiting-on-vendor/`,
	migrationCaseMarkException: (id: string) =>
		`/api/v1/migration-cases/${id}/mark-exception/`,
	migrationCaseMarkProductionReady: (id: string) =>
		`/api/v1/migration-cases/${id}/mark-production-ready/`,
	migrationCaseBlockerTransition: (id: string) =>
		`/api/v1/migration-cases/${id}/blocker/transition/`,
	migrationCaseEvents: (id: string) => `/api/v1/migration-cases/${id}/events/`,
	migrationCaseDocumentsUpload: (id: string) =>
		`/api/v1/migration-cases/${id}/documents/upload/`,
	migrationCaseDocumentsList: (id: string) =>
		`/api/v1/migration-cases/${id}/documents/list/`,
	migrationCaseDocument: (caseId: string, docId: string) =>
		`/api/v1/migration-cases/${caseId}/documents/${docId}/`,
	migrationCaseDocumentDelete: (caseId: string, docId: string) =>
		`/api/v1/migration-cases/${caseId}/documents/${docId}/delete/`,
	migrationCaseDocumentRestore: (caseId: string, docId: string) =>
		`/api/v1/migration-cases/${caseId}/documents/${docId}/restore/`,
	migrationCaseDocumentHardDelete: (caseId: string, docId: string) =>
		`/api/v1/migration-cases/${caseId}/documents/${docId}/hard-delete/`,
	workQueueKpis: "/api/v1/work-queue/kpis/",
	workQueueProgressSummary: "/api/v1/work-queue/progress-summary/",
	workQueueAnalystStats: "/api/v1/work-queue/analyst-stats/",
	workQueueBlockersList: "/api/v1/work-queue/blockers/list/",
	workQueueImport: "/api/v1/work-queue/import/",
	workQueueSeed: "/api/v1/work-queue/seed/",
	claimLinesList: "/api/v1/claim-lines/list/",
	claimLinesCreate: "/api/v1/claim-lines/create/",
	claimLinesSeed: "/api/v1/claim-lines/seed/",
	claimLine: (id: string) => `/api/v1/claim-lines/${id}/`,
	claimLineUpdate: (id: string) => `/api/v1/claim-lines/${id}/update/`,
	claimLineDelete: (id: string) => `/api/v1/claim-lines/${id}/delete/`,
	claimLineHardDelete: (id: string) => `/api/v1/claim-lines/${id}/hard-delete/`,
	claimLineRestore: (id: string) => `/api/v1/claim-lines/${id}/restore/`,
	claimVendorFilesList: "/api/v1/claim-vendor-files/list/",
	claimVendorFilesSeed: "/api/v1/claim-vendor-files/seed/",
	claimVendorFilesSummary: "/api/v1/claim-vendor-files/summary/",
	claimVendorFilesExportCsv: "/api/v1/claim-vendor-files/export/csv/",
	claimVendorFile: (id: string) => `/api/v1/claim-vendor-files/${id}/`,
	claimVendorFileAccept: (id: string) =>
		`/api/v1/claim-vendor-files/${id}/accept/`,
	claimVendorFileReject: (id: string) =>
		`/api/v1/claim-vendor-files/${id}/reject/`,
	claimVendorFileSend: (id: string) => `/api/v1/claim-vendor-files/${id}/send/`,
	claimVendorFileDownload: (id: string) =>
		`/api/v1/claim-vendor-files/${id}/download/`,
	claimResponsesList: "/api/v1/claim-responses/list/",
	claimResponse: (id: string) => `/api/v1/claim-responses/${id}/`,
	claimExceptionsList: "/api/v1/claim-exceptions/list/",
	claimException: (id: string) => `/api/v1/claim-exceptions/${id}/`,
	claimExceptionAssign: (id: string) =>
		`/api/v1/claim-exceptions/${id}/assign/`,
	claimExceptionResolve: (id: string) =>
		`/api/v1/claim-exceptions/${id}/resolve/`,
	submissionBatchesList: "/api/v1/submission-batches/list/",
	submissionBatch: (id: string) => `/api/v1/submission-batches/${id}/`,
	submissionBatchGenerateOutbound: (id: string) =>
		`/api/v1/submission-batches/${id}/generate-outbound/`,
	claimDiagnosesList: "/api/v1/claim-diagnoses/list/",
	claimDiagnosis: (id: string) => `/api/v1/claim-diagnoses/${id}/`,
	remittanceFilesList: "/api/v1/remittance-files/list/",
	remittanceFilesSummary: "/api/v1/remittance-files/summary/",
	remittanceFile: (id: string) => `/api/v1/remittance-files/${id}/`,
	remittanceFileExport: (id: string) =>
		`/api/v1/remittance-files/${id}/export/`,
	remittanceClaimsList: "/api/v1/remittance-claims/list/",
	remittanceClaim: (id: string) => `/api/v1/remittance-claims/${id}/`,
	remittanceServiceLinesList: "/api/v1/remittance-service-lines/list/",
	eligibilityFilesList: "/api/v1/eligibility-files/list/",
	eligibilityFilesCreate: "/api/v1/eligibility-files/create/",
	inboundFiles: "/api/v1/inbound-files/",
	inboundFile: (id: string) => `/api/v1/inbound-files/${id}/`,
	inboundFileEvents: (id: string) => `/api/v1/inbound-files/${id}/events/`,
	inboundFileReprocess: (id: string) =>
		`/api/v1/inbound-files/${id}/reprocess/`,
	inboundFileDownload: (id: string) => `/api/v1/inbound-files/${id}/download/`,
	inboundFilesSeed: "/api/v1/inbound-files/seed/",
	claimHeadersList: "/api/v1/claim-headers/list/",
	claimHeadersSummary: "/api/v1/claim-headers/summary/",
	claimHeader: (id: string) => `/api/v1/claim-headers/${id}/`,
	claimHeaderVoid: (id: string) => `/api/v1/claim-headers/${id}/void/`,
	claimHeaderReplace: (id: string) => `/api/v1/claim-headers/${id}/replace/`,
	cmsEdgeSettings: "/api/v1/cms-edge/settings/",
	cmsEdgeSettingsUpdate: "/api/v1/cms-edge/settings/update/",
	cmsEdgeSettingsSeed: "/api/v1/cms-edge/settings/seed/",
	cmsEdgeReportingPeriodsList: "/api/v1/cms-edge/reporting-periods/list/",
	cmsEdgeOverviewStats: "/api/v1/cms-edge/overview/stats/",
	cmsEdgeOverviewWorkflow: "/api/v1/cms-edge/overview/workflow/",
	cmsEdgeOverviewActivityList: "/api/v1/cms-edge/overview/activity/list/",
	cmsEdgeOverviewExceptionsList: "/api/v1/cms-edge/overview/exceptions/list/",
	cmsEdgeFilePackagesList: "/api/v1/cms-edge/file-packages/list/",
	cmsEdgeFilePackagesCreate: "/api/v1/cms-edge/file-packages/create/",
	cmsEdgeFilePackage: (id: string) => `/api/v1/cms-edge/file-packages/${id}/`,
	cmsEdgeFilePackageGenerate: (id: string) =>
		`/api/v1/cms-edge/file-packages/${id}/generate/`,
	cmsEdgeFilePackagePackage: (id: string) =>
		`/api/v1/cms-edge/file-packages/${id}/package/`,
	cmsEdgeFilePackageSubmit: (id: string) =>
		`/api/v1/cms-edge/file-packages/${id}/submit/`,
	cmsEdgeSubmissionsList: "/api/v1/cms-edge/submissions/list/",
	cmsEdgeCmsResponsesList: "/api/v1/cms-edge/cms-responses/list/",
	cmsEdgeValidationRunsList: "/api/v1/cms-edge/validation-runs/list/",
	cmsEdgeAuditRequestsList: "/api/v1/cms-edge/audit-requests/list/",
	cmsEdgeDocumentsList: "/api/v1/cms-edge/documents/list/",
	validationResultsList: "/api/v1/validation-results/list/",
	uploads: "/api/v1/intake/uploads/",
	monitoring: "/api/v1/monitoring/",
	errorsList: "/api/v1/errors/list/",
	error: (id: string) => `/api/v1/errors/${id}/`,
	errorRetry: (id: string) => `/api/v1/errors/${id}/retry/`,
	errorResolve: (id: string) => `/api/v1/errors/${id}/resolve/`,
	routingRulesList: "/api/v1/routing-rules/list/",
	routingRulesCreate: "/api/v1/routing-rules/create/",
	routingRule: (id: string) => `/api/v1/routing-rules/${id}/`,
	routingRuleUpdate: (id: string) => `/api/v1/routing-rules/${id}/update/`,
	routingRuleDelete: (id: string) => `/api/v1/routing-rules/${id}/delete/`,
	routingRuleRestore: (id: string) => `/api/v1/routing-rules/${id}/restore/`,
	routingRuleHardDelete: (id: string) =>
		`/api/v1/routing-rules/${id}/hard-delete/`,
	auditList: "/api/v1/audit/list/",
	users: "/api/v1/users/",
	usersList: "/api/v1/users/list/",
	usersCreate: "/api/v1/users/create/",
	user: (id: string) => `/api/v1/users/${id}/`,
	userUpdate: (id: string) => `/api/v1/users/${id}/update/`,
	userDelete: (id: string) => `/api/v1/users/${id}/delete/`,
	userRestore: (id: string) => `/api/v1/users/${id}/restore/`,
	userHardDelete: (id: string) => `/api/v1/users/${id}/hard-delete/`,
	userPassword: (id: string) => `/api/v1/users/${id}/password/`,
	userRolesSet: (id: string) => `/api/v1/users/${id}/roles/`,
	userRolesAdd: (id: string) => `/api/v1/users/${id}/roles/add/`,
	userRolesRemove: (id: string) => `/api/v1/users/${id}/roles/remove/`,
	userLoginEvents: (id: string) => `/api/v1/users/${id}/login-events/`,
	loginEvents: "/api/v1/users/login-events/",
	myLoginEvents: "/api/v1/users/me/login-events/",
	vendorUpdate: (id: string) => `/api/v1/vendors/${id}/update/`,
	vendorDelete: (id: string) => `/api/v1/vendors/${id}/delete/`,
	vendorHardDelete: (id: string) => `/api/v1/vendors/${id}/hard-delete/`,
	vendorRestore: (id: string) => `/api/v1/vendors/${id}/restore/`,
	tokenVerify: "/api/v1/authentication/token/verify/",
	health: "/health/",
	identityGroupsList: "/api/v1/identity-groups/list/",
	identityGroupsCreate: "/api/v1/identity-groups/create/",
	identityGroup: (id: string) => `/api/v1/identity-groups/${id}/`,
	identityGroupUpdate: (id: string) => `/api/v1/identity-groups/${id}/update/`,
	identityGroupDelete: (id: string) => `/api/v1/identity-groups/${id}/delete/`,
	identityGroupRestore: (id: string) =>
		`/api/v1/identity-groups/${id}/restore/`,
	identityGroupMembersAdd: (id: string) =>
		`/api/v1/identity-groups/${id}/members/add/`,
	identityGroupMembersRemove: (id: string) =>
		`/api/v1/identity-groups/${id}/members/remove/`,
	identityGroupMemberLinkUser: (id: string) =>
		`/api/v1/identity-groups/${id}/members/link-user/`,
	rolesList: "/api/v1/roles/list/",
	rolesCreate: "/api/v1/roles/create/",
	role: (id: string) => `/api/v1/roles/${id}/`,
	roleUpdate: (id: string) => `/api/v1/roles/${id}/update/`,
	roleDelete: (id: string) => `/api/v1/roles/${id}/delete/`,
	roleRestore: (id: string) => `/api/v1/roles/${id}/restore/`,
	roleHardDelete: (id: string) => `/api/v1/roles/${id}/hard-delete/`,
	roleUsersAssign: (id: string) => `/api/v1/roles/${id}/users/assign/`,
	roleUsersUnassign: (id: string) => `/api/v1/roles/${id}/users/unassign/`,
	settingsList: "/api/v1/settings/list/",
	settingsCreate: "/api/v1/settings/create/",
	setting: (id: string) => `/api/v1/settings/${id}/`,
	settingUpdate: (id: string) => `/api/v1/settings/${id}/update/`,
	settingDelete: (id: string) => `/api/v1/settings/${id}/delete/`,
	settingRestore: (id: string) => `/api/v1/settings/${id}/restore/`,
	categories: "/api/v1/vendor-categories/",
	vendorCategoryAssignmentDelete: (id: string) =>
		`/api/v1/vendor-category-assignments/${id}/delete/`,
	vendorCategoryAssignmentRestore: (id: string) =>
		`/api/v1/vendor-category-assignments/${id}/restore/`,
	vendorCategoryAssignmentHardDelete: (id: string) =>
		`/api/v1/vendor-category-assignments/${id}/hard-delete/`,
	connectionDiscoverHostKey: "/api/v1/connections/discover-host-key/",
	connectionDiscoverHostKeyById: (id: string) =>
		`/api/v1/connections/${id}/discover-host-key/`,
	claimHeadersValidate: "/api/v1/claim-headers/validate/",
} as const;

function pageParams(
	extra?: Record<string, string | number | undefined | null>
) {
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
	createVendor: (body: VendorCreateInput) =>
		vendorCoreFetch<VendorDto>(vendorCoreEndpoints.vendorsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((v) => normalizeVendor(v as unknown as Record<string, unknown>)),

	createAccount: (body: AccountCreateInput) =>
		vendorCoreFetch<AccountDto>(vendorCoreEndpoints.accountsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((a) => normalizeAccount(a as unknown as Record<string, unknown>)),

	getAccount: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.account(id)
		);
		return normalizeAccount(raw);
	},

	updateAccount: (id: string, body: AccountUpdateInput) =>
		vendorCoreFetch<AccountDto>(vendorCoreEndpoints.accountUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}).then((a) => normalizeAccount(a as unknown as Record<string, unknown>)),

	deleteAccount: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.accountDelete(id), {
			method: "DELETE",
			raw: true,
		}),

	restoreAccount: (id: string) =>
		vendorCoreFetch<AccountDto>(vendorCoreEndpoints.accountRestore(id), {
			method: "POST",
		}).then((a) => normalizeAccount(a as unknown as Record<string, unknown>)),

	hardDeleteAccount: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.accountHardDelete(id), {
			method: "DELETE",
		}),

	createCredential: (body: CredentialCreateInput) =>
		vendorCoreFetch<CredentialDto>(vendorCoreEndpoints.credentialsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	getCredential: (id: string) =>
		vendorCoreFetch<CredentialDto>(vendorCoreEndpoints.credential(id)),

	updateCredential: (id: string, body: Partial<CredentialCreateInput>) =>
		vendorCoreFetch<CredentialDto>(vendorCoreEndpoints.credentialUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	deleteCredential: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.credentialDelete(id), {
			method: "DELETE",
		}),

	restoreCredential: (id: string) =>
		vendorCoreFetch<CredentialDto>(vendorCoreEndpoints.credentialRestore(id), {
			method: "POST",
		}),

	hardDeleteCredential: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.credentialHardDelete(id), {
			method: "DELETE",
		}),

	createConnection: (body: ConnectionCreateInput) =>
		vendorCoreFetch<ConnectionCompactDto>(
			vendorCoreEndpoints.connectionsCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	getConnection: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.connection(id)
		);
		return normalizeConnection(raw);
	},

	deleteConnection: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.connectionDelete(id), {
			method: "DELETE",
		}),

	restoreConnection: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.connectionRestore(id),
			{ method: "POST" }
		);
		return normalizeConnection(raw);
	},

	hardDeleteConnection: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.connectionHardDelete(id), {
			method: "DELETE",
		}),

	createIntakeJob: (body: Record<string, unknown>) =>
		vendorCoreFetch<IntakeJobDto>(vendorCoreEndpoints.intakeJobs, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((j) => normalizeJob(j as unknown as Record<string, unknown>)),

	disableIntakeJob: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.intakeJobDisable(id),
			{ method: "POST" }
		);
		return normalizeJob(raw);
	},

	getIntakeCompletionSftp: () =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.intakeCompletionSftp
		),

	getIntakeCompletionEdi: () =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.intakeCompletionEdi
		),

	createRoutingRule: (body: Record<string, unknown>) =>
		vendorCoreFetch<RoutingRuleDto>(vendorCoreEndpoints.routingRulesCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	getRoutingRule: (id: string) =>
		vendorCoreFetch<RoutingRuleDto>(vendorCoreEndpoints.routingRule(id)),

	updateRoutingRule: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<RoutingRuleDto>(vendorCoreEndpoints.routingRuleUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	deleteRoutingRule: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.routingRuleDelete(id), {
			method: "DELETE",
		}),

	restoreRoutingRule: (id: string) =>
		vendorCoreFetch<RoutingRuleDto>(
			vendorCoreEndpoints.routingRuleRestore(id),
			{ method: "POST" }
		),

	hardDeleteRoutingRule: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.routingRuleHardDelete(id), {
			method: "DELETE",
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

	getVendorIntegrationProfile: async (id: string) =>
		vendorCoreFetch<VendorIntegrationProfileDto>(
			vendorCoreEndpoints.vendorIntegrationProfile(id)
		),

	updateVendorIntegrationProfile: async (
		id: string,
		body: VendorIntegrationProfileUpdateInput
	) =>
		vendorCoreFetch<VendorIntegrationProfileDto>(
			vendorCoreEndpoints.vendorIntegrationProfileUpdate(id),
			{
				method: "PATCH",
				body: JSON.stringify(body),
			}
		),

	listAccounts: async (params?: {
		vendor_id?: string;
		is_visible?: boolean;
		is_deleted?: boolean;
	}) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.accountsList, {
				params: pageParams({
					vendor_id: params?.vendor_id,
					is_visible:
						params?.is_visible != null ? String(params.is_visible) : undefined,
					is_deleted:
						params?.is_deleted != null ? String(params.is_deleted) : undefined,
					limit,
					offset,
				}),
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

	listCredentials: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.credentialsList, {
				params: pageParams({ limit, offset }),
			});
			return mapPage(page, (raw) => raw as unknown as CredentialDto);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<CredentialDto>;
	},

	listEligibilityFiles: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.eligibilityFilesList, {
				params: pageParams({ limit, offset }),
			});
			return mapPage(page, normalizeEligibilityFile);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<EligibilityFileDto>;
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
		).then(normalizeEligibilityFile),

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
		vendorCoreFetch<ConnectionTestResult>(
			vendorCoreEndpoints.connectionTest(id),
			{ method: "POST" }
		),

	discoverHostKey: (body: { host: string; port?: number }) =>
		vendorCoreFetch<ConnectionDiscoverHostKeyResult>(
			vendorCoreEndpoints.connectionDiscoverHostKey,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	discoverHostKeyById: (
		id: string,
		body?: { host?: string; port?: number; pin?: boolean }
	) =>
		vendorCoreFetch<ConnectionDiscoverHostKeyResult>(
			vendorCoreEndpoints.connectionDiscoverHostKeyById(id),
			{
				method: "POST",
				body: JSON.stringify(body ?? {}),
			}
		),

	updateConnection: (id: string, body: ConnectionUpdateInput) =>
		vendorCoreFetch<ConnectionCompactDto>(
			vendorCoreEndpoints.connectionUpdate(id),
			{
				method: "PATCH",
				body: JSON.stringify(body),
			}
		),

	listIntakeJobs: async (params?: { status?: string; vendor_id?: string }) => {
		// Intake jobs clamp page size (~50); page through until exhausted.
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.intakeJobs, {
				params: pageParams({ ...params, limit, offset }),
			});
			return mapPage(page, normalizeJob);
		}, 50);
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

	getMemberFacets: async (params?: { fields?: string }) => {
		return vendorCoreFetch<{
			plan_name?: string[];
			account_group?: string[];
		}>(vendorCoreEndpoints.membersFacets, {
			params: pageParams({
				fields: params?.fields ?? "plan_name,account_group",
			}),
		});
	},

	getMemberDashboardStats: async (params?: MemberDashboardStatsQuery) => {
		const raw = await vendorCoreFetch<MemberDashboardStatsDto>(
			vendorCoreEndpoints.membersStats,
			{
				params: pageParams({
					search: params?.search || undefined,
					vendor_id: params?.vendor_id || undefined,
					status: params?.status || undefined,
					cardholder_id: params?.cardholder_id || undefined,
					group_id: params?.group_id || undefined,
					account_group: params?.account_group || undefined,
					alternate_id: params?.alternate_id || undefined,
					newtech_member_id: params?.newtech_member_id || undefined,
					newtech_family_id: params?.newtech_family_id || undefined,
					first_name: params?.first_name || undefined,
					last_name: params?.last_name || undefined,
					date_of_birth: params?.date_of_birth || undefined,
					gender: params?.gender || undefined,
					plan_name: params?.plan_name || undefined,
					eligibility_status: params?.eligibility_status || undefined,
					program: params?.program || undefined,
					lob: params?.lob || undefined,
					coverage_effective_from: params?.coverage_effective_from || undefined,
					coverage_effective_to: params?.coverage_effective_to || undefined,
				}),
			}
		);
		return {
			total: Number(raw.total ?? 0),
			active: Number(raw.active ?? 0),
			pending: Number(raw.pending ?? 0),
			termed: Number(raw.termed ?? 0),
			inactive: Number(raw.inactive ?? 0),
			program: raw.program ?? "",
			vendor_id: raw.vendor_id ?? null,
		} satisfies MemberDashboardStatsDto;
	},

	/** Single page — use for directory pagination. */
	listMembersPage: async (params?: MemberListQuery) => {
		const page = await vendorCoreFetch<PaginatedResult<MemberListDto>>(
			vendorCoreEndpoints.membersList,
			{
				params: pageParams({
					...params,
					limit: params?.limit ?? 50,
					offset: params?.offset ?? 0,
				}),
			}
		);
		return {
			...page,
			results: (page.results ?? []).map((row) => ({
				...row,
				id: String(row.id),
			})),
		} satisfies PaginatedResult<MemberListDto>;
	},

	/** All pages (ops / fallback). Prefer `listMembersPage` for UI tables. */
	listMembers: async (params?: MemberListQuery) => {
		const { limit: _l, offset: _o, ...filters } = params ?? {};
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<PaginatedResult<MemberListDto>>(
				vendorCoreEndpoints.membersList,
				{
					params: pageParams({ ...filters, limit, offset }),
				}
			);
			return {
				...page,
				results: (page.results ?? []).map((row) => ({
					...row,
					id: String(row.id),
				})),
			};
		}, 50);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<MemberListDto>;
	},

	getMember: (id: string) =>
		vendorCoreFetch<MemberDetailDto>(vendorCoreEndpoints.member(id)),

	createMember: (body: MemberCreateBody | Record<string, unknown>) =>
		vendorCoreFetch<MemberDetailDto>(vendorCoreEndpoints.membersCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateMember: (id: string, body: MemberWriteBody | Record<string, unknown>) =>
		vendorCoreFetch<MemberDetailDto>(vendorCoreEndpoints.memberUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	deleteMember: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.memberDelete(id), {
			method: "DELETE",
		}),

	hardDeleteMember: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.memberHardDelete(id), {
			method: "DELETE",
		}),

	restoreMember: (id: string) =>
		vendorCoreFetch<MemberDetailDto>(vendorCoreEndpoints.memberRestore(id), {
			method: "POST",
		}),

	seedMembers: (body?: Record<string, unknown>) =>
		vendorCoreFetch<{ created?: number; skipped?: boolean }>(
			vendorCoreEndpoints.membersSeed,
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	listMemberSourceRecords: async (
		memberId: string,
		params?: { record_status?: string }
	) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.memberSourceRecordsList(memberId), {
			params: pageParams(params),
		});
		return page;
	},

	getMemberSourceRecord: (memberId: string, recordId: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberSourceRecord(memberId, recordId)
		),

	listMemberEligibilityHistory: (memberId: string) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberEligibilityHistoryList(memberId),
			{ params: pageParams() }
		),

	listMemberPlanHistory: (memberId: string) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberPlanHistoryList(memberId),
			{ params: pageParams() }
		),

	listMemberExceptions: (memberId: string) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberExceptionsList(memberId),
			{ params: pageParams() }
		),

	createMemberException: (memberId: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberExceptionsCreate(memberId),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateMemberException: (
		memberId: string,
		exceptionId: string,
		body: Record<string, unknown>
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberExceptionUpdate(memberId, exceptionId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteMemberException: (memberId: string, exceptionId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.memberExceptionDelete(memberId, exceptionId),
			{ method: "DELETE" }
		),

	listMemberAccumulators: (memberId: string) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberAccumulatorsList(memberId),
			{ params: pageParams() }
		),

	/**
	 * Accumulators tab summary (KPI + Medical/Pharmacy tables + transactions).
	 * BE may not ship yet — callers should fall back to reshape from flat list.
	 */
	getMemberAccumulatorSummary: (memberId: string) =>
		vendorCoreFetch<MemberAccumulatorSummaryDto>(
			vendorCoreEndpoints.memberAccumulatorsSummary(memberId)
		),

	createMemberAccumulator: (memberId: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberAccumulatorsCreate(memberId),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateMemberAccumulator: (
		memberId: string,
		accumulatorId: string,
		body: Record<string, unknown>
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberAccumulatorUpdate(memberId, accumulatorId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteMemberAccumulator: (memberId: string, accumulatorId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.memberAccumulatorDelete(memberId, accumulatorId),
			{ method: "DELETE" }
		),

	listAccumulatorFiles: (params?: AccumulatorFileListQuery) =>
		vendorCoreFetch<PaginatedResult<AccumulatorFileDto>>(
			vendorCoreEndpoints.accumulatorFilesList,
			{ params: pageParams(params) }
		),

	getAccumulatorFile: (id: string) =>
		vendorCoreFetch<AccumulatorFileDto>(
			vendorCoreEndpoints.accumulatorFile(id)
		),

	listAccumulatorRows: (params?: AccumulatorRowListQuery) =>
		vendorCoreFetch<PaginatedResult<AccumulatorRowListDto>>(
			vendorCoreEndpoints.accumulatorRowsList,
			{ params: pageParams(params) }
		),

	getAccumulatorRow: (id: string) =>
		vendorCoreFetch<AccumulatorRowDetailDto>(
			vendorCoreEndpoints.accumulatorRow(id)
		),

	createAccumulatorRow: (body: AccumulatorRowCreateInput) =>
		vendorCoreFetch<AccumulatorRowDetailDto>(
			vendorCoreEndpoints.accumulatorRowsCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateAccumulatorRow: (id: string, body: AccumulatorRowUpdateInput) =>
		vendorCoreFetch<AccumulatorRowDetailDto>(
			vendorCoreEndpoints.accumulatorRowUpdate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	deleteAccumulatorRow: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.accumulatorRowDelete(id), {
			method: "POST",
		}),

	listPharmacyClaimFiles: (params?: PharmacyClaimFileListQuery) =>
		vendorCoreFetch<PaginatedResult<PharmacyClaimFileDto>>(
			vendorCoreEndpoints.pharmacyClaimFilesList,
			{ params: pageParams(params) }
		),

	getPharmacyClaimFile: (id: string) =>
		vendorCoreFetch<PharmacyClaimFileDto>(
			vendorCoreEndpoints.pharmacyClaimFile(id)
		),

	listPharmacyClaimRows: (params?: PharmacyClaimRowListQuery) =>
		vendorCoreFetch<PaginatedResult<PharmacyClaimRowListDto>>(
			vendorCoreEndpoints.pharmacyClaimRowsList,
			{ params: pageParams(params) }
		),

	getPharmacyClaimRow: (id: string) =>
		vendorCoreFetch<PharmacyClaimRowDetailDto>(
			vendorCoreEndpoints.pharmacyClaimRow(id)
		),

	createPharmacyClaimRow: (body: PharmacyClaimRowCreateInput) =>
		vendorCoreFetch<PharmacyClaimRowDetailDto>(
			vendorCoreEndpoints.pharmacyClaimRowsCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	seedPharmacyClaimRows: (body?: {
		vendor_id?: string;
		count?: number;
		force?: boolean;
	}) =>
		vendorCoreFetch<{
			created: number;
			skipped?: boolean;
			existing_files?: number;
			existing_rows?: number;
			file_id?: string | null;
			row_ids?: string[];
		}>(vendorCoreEndpoints.pharmacyClaimRowsSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

	updatePharmacyClaimRow: (id: string, body: PharmacyClaimRowUpdateInput) =>
		vendorCoreFetch<PharmacyClaimRowDetailDto>(
			vendorCoreEndpoints.pharmacyClaimRowUpdate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	deletePharmacyClaimRow: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.pharmacyClaimRowDelete(id), {
			method: "POST",
		}),

	voidPharmacyClaimRow: (id: string) =>
		vendorCoreFetch<PharmacyClaimRowDetailDto>(
			vendorCoreEndpoints.pharmacyClaimRowVoid(id),
			{ method: "POST", body: JSON.stringify({}) }
		),

	listMemberClaims: (memberId: string, params?: { claim_kind?: string }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberClaimsList(memberId),
			{ params: pageParams(params) }
		),

	createMemberClaim: (memberId: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberClaimsCreate(memberId),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateMemberClaim: (
		memberId: string,
		claimId: string,
		body: Record<string, unknown>
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberClaimUpdate(memberId, claimId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteMemberClaim: (memberId: string, claimId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.memberClaimDelete(memberId, claimId),
			{ method: "DELETE" }
		),

	listMemberChangeEvents: (memberId: string) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberChangeEventsList(memberId),
			{ params: pageParams() }
		),

	listMemberFamilyLinks: (memberId: string) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberFamilyLinksList(memberId),
			{ params: pageParams() }
		),

	getMemberFamilyLink: (memberId: string, linkId: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberFamilyLink(memberId, linkId)
		),

	createMemberFamilyLink: (
		memberId: string,
		body: {
			dependent_id: string;
			relationship_code?: string;
			relationship_label?: string;
		}
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberFamilyLinksCreate(memberId),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateMemberFamilyLink: (
		memberId: string,
		linkId: string,
		body: { relationship_code?: string; relationship_label?: string }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberFamilyLinkUpdate(memberId, linkId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteMemberFamilyLink: (memberId: string, linkId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.memberFamilyLinkDelete(memberId, linkId),
			{ method: "DELETE" }
		),

	syncMemberFamilyLinks: (memberId: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberFamilyLinksSync(memberId),
			{ method: "POST", body: JSON.stringify({}) }
		),

	transferMemberFamilyLink: (
		memberId: string,
		linkId: string,
		body: { new_subscriber_id: string }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.memberFamilyLinkTransfer(memberId, linkId),
			{ method: "POST", body: JSON.stringify(body) }
		),

	exportMemberListCsv: (params?: MemberListQuery) => {
		const { limit: _l, offset: _o, ...filters } = params ?? {};
		return vendorCoreFetchBlob(vendorCoreEndpoints.membersListExportCsv, {
			params: filters,
		});
	},

	exportMemberDetailCsv: (memberId: string) =>
		vendorCoreFetchBlob(vendorCoreEndpoints.memberDetailExportCsv(memberId)),

	exportMemberDetailPdf: (
		memberId: string,
		params?: { variant?: "full" | "summary" }
	) =>
		vendorCoreFetchBlob(vendorCoreEndpoints.memberDetailExportPdf(memberId), {
			params,
		}),

	exportMemberPrintHtml: (memberId: string) =>
		vendorCoreFetchBlob(vendorCoreEndpoints.memberPrint(memberId)),

	exportMemberDocumentPdf: (
		memberId: string,
		document: "summary" | "eligibility-letter" | "coverage-card"
	) => {
		const path =
			document === "summary"
				? vendorCoreEndpoints.memberDocumentSummaryPdf(memberId)
				: document === "eligibility-letter"
					? vendorCoreEndpoints.memberDocumentEligibilityLetterPdf(memberId)
					: vendorCoreEndpoints.memberDocumentCoverageCardPdf(memberId);
		return vendorCoreFetchBlob(path);
	},

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
		vendorCoreFetch<
			{ task_id?: string; id?: string } | Record<string, unknown>
		>(vendorCoreEndpoints.inboundFileReprocess(id), { method: "POST" }),

	downloadInboundFile: async (id: string) => {
		const result = await vendorCoreFetchBlob(
			vendorCoreEndpoints.inboundFileDownload(id)
		);
		return {
			blob: result.blob,
			text: await result.blob.text(),
			contentType: result.contentType,
			filename: result.filename,
		};
	},

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
			PaginatedResult<Record<string, unknown>> | Record<string, unknown>[]
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

	getMonitoring: () =>
		vendorCoreFetch<MonitoringDashboardDto>(vendorCoreEndpoints.monitoring),

	listErrors: async (params?: { status?: string; category?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.errorsList, {
				params: pageParams({ ...params, limit, offset }),
			});
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
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.error(id)
		).then((row) => normalizeErrorRecord(row)),

	retryError: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.errorRetry(id),
			{
				method: "POST",
			}
		).then((row) => normalizeErrorRecord(row)),

	resolveError: (id: string, resolution_notes?: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.errorResolve(id),
			{
				method: "POST",
				body: JSON.stringify({ resolution_notes: resolution_notes ?? "" }),
			}
		).then((row) => normalizeErrorRecord(row)),

	listProviders: async (params?: ProviderListQuery) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.providersList, {
				params: pageParams({
					...params,
					limit,
					offset,
					is_visible:
						params?.is_visible === undefined
							? undefined
							: params.is_visible
								? "true"
								: "false",
					is_deleted:
						params?.is_deleted === undefined
							? undefined
							: params.is_deleted
								? "true"
								: "false",
				}),
			});
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

	getProvider: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.provider(id)
		);
		return normalizeProvider(raw);
	},

	/** Single page — use for npi lookup / directory pagination. */
	listProvidersPage: async (params?: ProviderListQuery) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.providersList, {
			params: pageParams({
				...params,
				limit: params?.limit ?? 50,
				offset: params?.offset ?? 0,
				is_visible:
					params?.is_visible === undefined
						? undefined
						: params.is_visible
							? "true"
							: "false",
				is_deleted:
					params?.is_deleted === undefined
						? undefined
						: params.is_deleted
							? "true"
							: "false",
			}),
		});
		return mapPage(page, normalizeProvider);
	},

	getProviderFacets: async (params?: { fields?: string }) => {
		return vendorCoreFetch<{
			specialty?: string[];
		}>(vendorCoreEndpoints.providersFacets, {
			params: pageParams({
				fields: params?.fields ?? "specialty",
			}),
		});
	},

	exportProviderListCsv: (params?: ProviderListQuery) => {
		const { limit: _l, offset: _o, ...filters } = params ?? {};
		return vendorCoreFetchBlob(vendorCoreEndpoints.providersListExportCsv, {
			params: {
				...filters,
				is_visible:
					filters.is_visible === undefined
						? undefined
						: filters.is_visible
							? "true"
							: "false",
				is_deleted:
					filters.is_deleted === undefined
						? undefined
						: filters.is_deleted
							? "true"
							: "false",
			},
		});
	},

	getProviderDashboardStats: async (params?: ProviderDashboardStatsQuery) => {
		const raw = await vendorCoreFetch<ProviderDashboardStatsDto>(
			vendorCoreEndpoints.providersStats,
			{
				params: pageParams({
					program: params?.program || undefined,
					vendor_id: params?.vendor_id || undefined,
					roster_file_id: params?.roster_file_id || undefined,
				}),
			}
		);
		return {
			total: Number(raw.total ?? 0),
			active: Number(raw.active ?? 0),
			pending: Number(raw.pending ?? 0),
			termed: Number(raw.termed ?? 0),
			inactive: Number(raw.inactive ?? 0),
			program: raw.program ?? "",
			vendor_id: raw.vendor_id ?? null,
			roster_file_id: raw.roster_file_id ?? null,
		} satisfies ProviderDashboardStatsDto;
	},

	createProvider: (body: ProviderCreateInput) =>
		vendorCoreFetch<ProviderDto>(vendorCoreEndpoints.providersCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}).then((row) =>
			normalizeProvider(row as unknown as Record<string, unknown>)
		),

	updateProvider: (id: string, body: ProviderUpdateInput) =>
		vendorCoreFetch<ProviderDto>(vendorCoreEndpoints.providerUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}).then((row) =>
			normalizeProvider(row as unknown as Record<string, unknown>)
		),

	deleteProvider: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.providerDelete(id), {
			method: "DELETE",
		}),

	restoreProvider: (id: string) =>
		vendorCoreFetch<ProviderDto>(vendorCoreEndpoints.providerRestore(id), {
			method: "POST",
		}).then((row) =>
			normalizeProvider(row as unknown as Record<string, unknown>)
		),

	setProviderStatus: (id: string, body: ProviderStatusInput) =>
		vendorCoreFetch<ProviderDto>(vendorCoreEndpoints.providerStatus(id), {
			method: "POST",
			body: JSON.stringify(body),
		}).then((row) =>
			normalizeProvider(row as unknown as Record<string, unknown>)
		),

	getProviderProfile: (id: string) =>
		vendorCoreFetch<ProviderProfileDto>(
			vendorCoreEndpoints.providerProfile(id)
		),

	updateProviderProfile: (id: string, body: ProviderProfileUpdateInput) =>
		vendorCoreFetch<ProviderProfileDto>(
			vendorCoreEndpoints.providerProfileUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	getProviderSummary: (id: string) =>
		vendorCoreFetch<ProviderSummaryDto>(
			vendorCoreEndpoints.providerSummary(id)
		),

	listProviderVendorSources: (id: string) =>
		vendorCoreFetch<PaginatedResult<ProviderVendorSourceDto>>(
			vendorCoreEndpoints.providerVendorSourcesList(id),
			{ params: pageParams({ limit: 100 }) }
		),

	listProviderLocations: (id: string) =>
		vendorCoreFetch<PaginatedResult<ProviderLocationDto>>(
			vendorCoreEndpoints.providerLocationsList(id),
			{ params: pageParams({ limit: 200 }) }
		),

	listProviderIdentifiers: (id: string) =>
		vendorCoreFetch<PaginatedResult<ProviderIdentifierDto>>(
			vendorCoreEndpoints.providerIdentifiersList(id),
			{ params: pageParams({ limit: 200 }) }
		),

	createProviderIdentifier: (id: string, body: ProviderIdentifierCreateInput) =>
		vendorCoreFetch<ProviderIdentifierDto>(
			vendorCoreEndpoints.providerIdentifiersCreate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateProviderIdentifier: (
		id: string,
		identifierId: string,
		body: ProviderIdentifierUpdateInput
	) =>
		vendorCoreFetch<ProviderIdentifierDto>(
			vendorCoreEndpoints.providerIdentifierUpdate(id, identifierId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	listProviderNetworks: (id: string) =>
		vendorCoreFetch<PaginatedResult<ProviderNetworkDto>>(
			vendorCoreEndpoints.providerNetworksList(id),
			{ params: pageParams({ limit: 200 }) }
		),

	listProviderCredentials: (id: string) =>
		vendorCoreFetch<PaginatedResult<ProviderCredentialDto>>(
			vendorCoreEndpoints.providerCredentialsList(id),
			{ params: pageParams({ limit: 200 }) }
		),

	listProviderExceptions: (id: string) =>
		vendorCoreFetch<PaginatedResult<ProviderExceptionDto>>(
			vendorCoreEndpoints.providerExceptionsList(id),
			{ params: pageParams({ limit: 200 }) }
		),

	listProviderMonthlyVolume: (id: string) =>
		vendorCoreFetch<ProviderMonthlyVolumeDto[]>(
			vendorCoreEndpoints.providerMonthlyVolumeList(id)
		).then((rows) => rows ?? []),

	listProviderRejectionReasons: (id: string) =>
		vendorCoreFetch<ProviderRejectionReasonDto[]>(
			vendorCoreEndpoints.providerRejectionReasonsList(id)
		).then((rows) => rows ?? []),

	listProviderRecentActivity: (
		id: string,
		params?: ProviderRecentActivityQuery
	) =>
		vendorCoreFetch<ProviderRecentActivityDto[]>(
			vendorCoreEndpoints.providerRecentActivityList(id),
			{
				params: pageParams({
					kind: params?.kind ?? "claim",
					limit: params?.limit ?? 25,
				}),
			}
		).then((rows) => rows ?? []),

	deleteProviderIdentifier: (id: string, identifierId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.providerIdentifierDelete(id, identifierId),
			{ method: "DELETE" }
		),

	createProviderLocation: (id: string, body: ProviderLocationCreateInput) =>
		vendorCoreFetch<ProviderLocationDto>(
			vendorCoreEndpoints.providerLocationCreate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateProviderLocation: (
		id: string,
		locationId: string,
		body: ProviderLocationUpdateInput
	) =>
		vendorCoreFetch<ProviderLocationDto>(
			vendorCoreEndpoints.providerLocationUpdate(id, locationId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteProviderLocation: (id: string, locationId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.providerLocationDelete(id, locationId),
			{ method: "DELETE" }
		),

	createProviderNetwork: (id: string, body: ProviderNetworkCreateInput) =>
		vendorCoreFetch<ProviderNetworkDto>(
			vendorCoreEndpoints.providerNetworkCreate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateProviderNetwork: (
		id: string,
		networkId: string,
		body: ProviderNetworkUpdateInput
	) =>
		vendorCoreFetch<ProviderNetworkDto>(
			vendorCoreEndpoints.providerNetworkUpdate(id, networkId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteProviderNetwork: (id: string, networkId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.providerNetworkDelete(id, networkId),
			{ method: "DELETE" }
		),

	createProviderCredential: (id: string, body: ProviderCredentialCreateInput) =>
		vendorCoreFetch<ProviderCredentialDto>(
			vendorCoreEndpoints.providerCredentialCreate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateProviderCredential: (
		id: string,
		credentialId: string,
		body: ProviderCredentialUpdateInput
	) =>
		vendorCoreFetch<ProviderCredentialDto>(
			vendorCoreEndpoints.providerCredentialUpdate(id, credentialId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteProviderCredential: (id: string, credentialId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.providerCredentialDelete(id, credentialId),
			{ method: "DELETE" }
		),

	createProviderException: (id: string, body: ProviderExceptionCreateInput) =>
		vendorCoreFetch<ProviderExceptionDto>(
			vendorCoreEndpoints.providerExceptionCreate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateProviderException: (
		id: string,
		exceptionId: string,
		body: ProviderExceptionUpdateInput
	) =>
		vendorCoreFetch<ProviderExceptionDto>(
			vendorCoreEndpoints.providerExceptionUpdate(id, exceptionId),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	deleteProviderException: (id: string, exceptionId: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.providerExceptionDelete(id, exceptionId),
			{ method: "DELETE" }
		),

	hardDeleteProvider: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.providerHardDelete(id), {
			method: "DELETE",
		}),

	hardDeleteProviderRoster: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.providerRosterHardDelete(id), {
			method: "DELETE",
		}),

	listProviderRosterProviders: (id: string, params?: ProviderListQuery) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.providerRosterProvidersList(id),
			{
				params: pageParams({
					...params,
					limit: params?.limit ?? 50,
					offset: params?.offset ?? 0,
					is_visible:
						params?.is_visible === undefined
							? undefined
							: params.is_visible
								? "true"
								: "false",
					is_deleted:
						params?.is_deleted === undefined
							? undefined
							: params.is_deleted
								? "true"
								: "false",
				}),
			}
		).then((page) => mapPage(page, normalizeProvider)),

	listProviderRosters: async (params?: ProviderRosterListQuery) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.providerRostersList, {
				params: pageParams({
					...params,
					limit,
					offset,
					is_visible:
						params?.is_visible === undefined
							? undefined
							: params.is_visible
								? "true"
								: "false",
					is_deleted:
						params?.is_deleted === undefined
							? undefined
							: params.is_deleted
								? "true"
								: "false",
				}),
			});
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

	getProviderRoster: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.providerRoster(id)
		);
		return normalizeProviderRoster(raw);
	},

	createProviderRoster: (body: ProviderRosterCreateInput) =>
		vendorCoreFetch<ProviderRosterDto>(
			vendorCoreEndpoints.providerRostersCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		).then((row) =>
			normalizeProviderRoster(row as unknown as Record<string, unknown>)
		),

	updateProviderRoster: (id: string, body: ProviderRosterUpdateInput) =>
		vendorCoreFetch<ProviderRosterDto>(
			vendorCoreEndpoints.providerRosterUpdate(id),
			{
				method: "PATCH",
				body: JSON.stringify(body),
			}
		).then((row) =>
			normalizeProviderRoster(row as unknown as Record<string, unknown>)
		),

	deleteProviderRoster: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.providerRosterDelete(id), {
			method: "DELETE",
		}),

	restoreProviderRoster: (id: string) =>
		vendorCoreFetch<ProviderRosterDto>(
			vendorCoreEndpoints.providerRosterRestore(id),
			{ method: "POST" }
		).then((row) =>
			normalizeProviderRoster(row as unknown as Record<string, unknown>)
		),

	recountProviderRoster: (id: string) =>
		vendorCoreFetch<ProviderRosterDto>(
			vendorCoreEndpoints.providerRosterRecount(id),
			{ method: "POST" }
		).then((row) =>
			normalizeProviderRoster(row as unknown as Record<string, unknown>)
		),

	seedProviders: (body?: {
		vendor_id?: string;
		count?: number;
		force?: boolean;
	}) =>
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

	/** Single page — use for CMS EDGE medical claims pagination. */
	listClaimLinesPage: async (params?: {
		limit?: number;
		offset?: number;
		order_by?: string;
		claim_reference_id?: string;
		vendor_file_id?: string;
	}) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.claimLinesList, {
			params: pageParams({
				limit: params?.limit ?? 50,
				offset: params?.offset ?? 0,
				order_by: params?.order_by,
				claim_reference_id: params?.claim_reference_id,
				vendor_file_id: params?.vendor_file_id,
			}),
		});
		return mapPage(page, normalizeClaimLine);
	},

	listClaimLines: async () => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.claimLinesList, {
				params: pageParams({ limit, offset }),
			});
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
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimLine(id)
		).then((row) => normalizeClaimLine(row)),

	createClaimLine: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimLinesCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		).then((row) => normalizeClaimLine(row)),

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
		vendorCoreFetch<{ id: string }>(
			vendorCoreEndpoints.claimLineHardDelete(id),
			{
				method: "DELETE",
			}
		),

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
			existing_vendor_files?: number;
			batch_id?: string | null;
			vendor_file_ids?: string[];
			claim_line_ids?: string[];
			exception_ids?: string[];
			response_ids?: string[];
		}>(vendorCoreEndpoints.claimLinesSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

	seedClaimVendorFiles: (body?: { vendor_id?: string; force?: boolean }) =>
		vendorCoreFetch<{
			created: number;
			skipped?: boolean;
			existing_vendor_files?: number;
			vendor_id?: string;
			vendor_file_ids?: string[];
			claim_line_ids?: string[];
			exception_ids?: string[];
			response_ids?: string[];
			cleared?: Record<string, number>;
		}>(vendorCoreEndpoints.claimVendorFilesSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

	listRoutingRules: () =>
		vendorCoreFetch<PaginatedResult<RoutingRuleDto>>(
			vendorCoreEndpoints.routingRulesList,
			{ params: pageParams() }
		),

	listAudit: (params?: AuditListQuery) =>
		vendorCoreFetch<PaginatedResult<AuditRecordDto>>(
			vendorCoreEndpoints.auditList,
			{ params: pageParams(params) }
		),

	listContracts: async (params?: ContractListQuery) => {
		const page = await vendorCoreFetch<PaginatedResult<ContractDto>>(
			vendorCoreEndpoints.contractsList,
			{ params: pageParams(params) }
		);
		return mapPage(page, (row) => row as ContractDto);
	},

	getContract: (id: string) =>
		vendorCoreFetch<ContractDetailDto>(vendorCoreEndpoints.contract(id)),

	createContract: (body: ContractCreateInput) =>
		vendorCoreFetch<ContractDto>(vendorCoreEndpoints.contractsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateContract: (id: string, body: ContractUpdateInput) =>
		vendorCoreFetch<ContractDto>(vendorCoreEndpoints.contractUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	listDocuments: async (params?: ProcurementDocumentListQuery) => {
		const page = await vendorCoreFetch<PaginatedResult<ProcurementDocumentDto>>(
			vendorCoreEndpoints.documentsList,
			{ params: pageParams(params) }
		);
		return mapPage(page, (row) => row as ProcurementDocumentDto);
	},

	createDocument: (body: ProcurementDocumentCreateInput) =>
		vendorCoreFetch<ProcurementDocumentDto>(
			vendorCoreEndpoints.documentsCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	getDocument: (id: string) =>
		vendorCoreFetch<ProcurementDocumentDto>(vendorCoreEndpoints.document(id)),

	updateDocument: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<ProcurementDocumentDto>(
			vendorCoreEndpoints.documentUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	downloadDocument: (id: string, asAttachment = false) =>
		vendorCoreFetchBlob(vendorCoreEndpoints.documentDownload(id), {
			params: asAttachment ? { download: "1" } : undefined,
		}),

	listOnboarding: (params?: {
		status?: string;
		vendor_id?: string;
		limit?: number;
	offset?: number;
	}) =>
		vendorCoreApi.listOnboardingCases(params),

	listOnboardingCases: (params?: {
		status?: string;
		vendor_id?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.onboardingList,
			{ params: pageParams(params) }
		),

	getOnboardingCase: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboarding(id)
		),

	createOnboardingCase: (body: {
		vendor_id: string;
		assigned_to_id?: string | null;
	}) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	seedOnboardingCases: (body?: { force?: boolean }) =>
		vendorCoreFetch<OnboardingSeedResultDto>(
			vendorCoreEndpoints.onboardingSeed,
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	updateOnboardingCase: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	submitOnboardingCase: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingSubmit(id),
			{ method: "POST" }
		),

	approveOnboardingCase: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingApprove(id),
			{ method: "POST" }
		),

	rejectOnboardingCase: (id: string, body?: { rejection_reason?: string }) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.onboardingReject(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	listCertificates: (params?: {
		vendor_id?: string;
		status?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.certificatesList,
			{ params: pageParams(params) }
		),

	createCertificate: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.certificatesCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateCertificate: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.certificateUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	listRfx: (params?: { status?: string; limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.rfxList,
			{ params: pageParams(params) }
		),

	getRfx: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.rfx(id)),

	createRfx: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.rfxCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateRfx: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.rfxUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	publishRfx: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.rfxPublish(id),
			{ method: "POST" }
		),

	awardRfx: (id: string, body: { bid_id: string }) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.rfxAward(id), {
			method: "POST",
			body: JSON.stringify(body),
		}),

	listRfxBids: (id: string, params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.rfxBidsList(id),
			{ params: pageParams(params) }
		),

	createRfxBid: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.rfxBidsCreate(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	listPurchaseOrders: (params?: {
		vendor_id?: string;
		status?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.purchaseOrdersList,
			{ params: pageParams(params) }
		),

	getPurchaseOrder: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrder(id)
		),

	createPurchaseOrder: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrdersCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	updatePurchaseOrder: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrderUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	acknowledgePurchaseOrder: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrderAcknowledge(id),
			{ method: "POST" }
		),

	receivePurchaseOrder: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.purchaseOrderReceive(id),
			{ method: "POST" }
		),

	listInvoices: (params?: {
		vendor_id?: string;
		status?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.invoicesList,
			{ params: pageParams(params) }
		),

	getInvoice: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.invoice(id)),

	createInvoice: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.invoicesCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	updateInvoice: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.invoiceUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	matchInvoice: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.invoiceMatch(id),
			{ method: "POST" }
		),

	disputeInvoice: (id: string, body?: { rejection_reason?: string }) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.invoiceDispute(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	approveInvoice: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.invoiceApprove(id),
			{ method: "POST" }
		),

	listApprovals: (params?: {
		status?: string;
		entity_type?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.approvalsList,
			{ params: pageParams(params) }
		),

	getApproval: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.approval(id)),

	updateApproval: (id: string, body: { status: string }) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.approvalUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		),

	decideApproval: (
		id: string,
		body: { decision: "approved" | "rejected" | "changes_requested" }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.approvalDecide(id),
			{ method: "POST", body: JSON.stringify(body) }
		),

	listScorecards: (params?: {
		vendor_id?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.scorecardsList,
			{ params: pageParams(params) }
		),

	getScorecard: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(vendorCoreEndpoints.scorecard(id)),

	createScorecard: (body: Record<string, unknown>) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.scorecardsCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	listNotifications: (params?: {
		status?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.notificationsList,
			{ params: pageParams(params) }
		),

	markNotificationRead: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.notificationMarkRead(id),
			{ method: "POST" }
		),

	listVendorContacts: async (params?: { vendor_id?: string }) => {
		const page = await vendorCoreFetch<PaginatedResult<VendorContactDto>>(
			vendorCoreEndpoints.vendorContactsList,
			{ params: pageParams(params) }
		);
		return mapPage(page, (row) => row as VendorContactDto);
	},

	createVendorContact: (body: VendorContactCreateInput) =>
		vendorCoreFetch<VendorContactDto>(
			vendorCoreEndpoints.vendorContactsCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	updateVendorContact: (id: string, body: VendorContactUpdateInput) =>
		vendorCoreFetch<VendorContactDto>(
			vendorCoreEndpoints.vendorContactUpdate(id),
			{
				method: "PATCH",
				body: JSON.stringify(body),
			}
		),

	getVendorContact: (id: string) =>
		vendorCoreFetch<VendorContactDto>(vendorCoreEndpoints.vendorContact(id)),

	deleteVendorContact: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.vendorContactDelete(id), {
			method: "DELETE",
		}),

	restoreVendorContact: (id: string) =>
		vendorCoreFetch<VendorContactDto>(
			vendorCoreEndpoints.vendorContactRestore(id),
			{ method: "POST" }
		),

	hardDeleteVendorContact: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.vendorContactHardDelete(id), {
			method: "DELETE",
		}),

	listVendorNotes: async (params?: { vendor_id?: string }) => {
		const page = await vendorCoreFetch<PaginatedResult<VendorNoteDto>>(
			vendorCoreEndpoints.vendorNotesList,
			{ params: pageParams(params) }
		);
		return mapPage(page, (row) => row as VendorNoteDto);
	},

	createVendorNote: (body: VendorNoteCreateInput) =>
		vendorCoreFetch<VendorNoteDto>(vendorCoreEndpoints.vendorNotesCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateVendorNote: (id: string, body: VendorNoteUpdateInput) =>
		vendorCoreFetch<VendorNoteDto>(vendorCoreEndpoints.vendorNoteUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	getVendorNote: (id: string) =>
		vendorCoreFetch<VendorNoteDto>(vendorCoreEndpoints.vendorNote(id)),

	deleteVendorNote: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.vendorNoteDelete(id), {
			method: "DELETE",
		}),

	restoreVendorNote: (id: string) =>
		vendorCoreFetch<VendorNoteDto>(vendorCoreEndpoints.vendorNoteRestore(id), {
			method: "POST",
		}),

	hardDeleteVendorNote: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.vendorNoteHardDelete(id), {
			method: "DELETE",
		}),

	listAccountOpsSummaries: async (vendorId: string) => {
		const data = await vendorCoreFetch<
			AccountOpsSummaryDto[] | PaginatedResult<AccountOpsSummaryDto>
		>(vendorCoreEndpoints.accountOpsSummaryList, {
			params: pageParams({ vendor_id: vendorId }),
		});
		if (Array.isArray(data)) return data;
		return data.results ?? [];
	},

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

	inviteVendor: (body: VendorInviteCreateInput) =>
		vendorCoreFetch<VendorInviteDto>(vendorCoreEndpoints.vendorsInvite, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	getVendorMe: async () => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.vendorsMe
		);
		return normalizeVendor(raw);
	},

	listVendorTeam: () =>
		vendorCoreFetch<VendorTeamMemberDto[]>(vendorCoreEndpoints.vendorsTeam),

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

	listCategories: async (params?: VendorCategoryListQuery) =>
		vendorCoreApi.listVendorCategories(params),

	listVendorCategories: async (params?: VendorCategoryListQuery) => {
		const query: Record<string, string | number | undefined> = {
			limit: params?.limit,
			offset: params?.offset,
		};
		if (params?.is_active != null) {
			query.is_active = params.is_active ? "true" : "false";
		}
		const page = await vendorCoreFetch<PaginatedResult<VendorCategoryDto>>(
			vendorCoreEndpoints.categoriesList,
			{ params: pageParams(query) }
		);
		return mapPage(page, (row) => row as VendorCategoryDto);
	},

	createVendorCategoryAssignment: (body: VendorCategoryAssignmentCreateInput) =>
		vendorCoreFetch<VendorCategoryAssignmentDto>(
			vendorCoreEndpoints.vendorCategoryAssignmentsCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	listVendorCategoryAssignments: async (
		params?: VendorCategoryAssignmentListQuery
	) => {
		const query: Record<string, string | number | undefined> = {
			limit: params?.limit,
			offset: params?.offset,
			vendor_id: params?.vendor_id,
		};
		if (params?.is_visible != null)
			query.is_visible = String(params.is_visible);
		if (params?.is_deleted != null)
			query.is_deleted = String(params.is_deleted);
		const page = await vendorCoreFetch<
			PaginatedResult<VendorCategoryAssignmentDto>
		>(vendorCoreEndpoints.vendorCategoryAssignmentsList, {
			params: pageParams(query),
		});
		return mapPage(page, (row) => row as VendorCategoryAssignmentDto);
	},

	deleteVendorCategoryAssignment: (id: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.vendorCategoryAssignmentDelete(id),
			{ method: "DELETE" }
		),

	restoreVendorCategoryAssignment: (id: string) =>
		vendorCoreFetch<VendorCategoryAssignmentDto>(
			vendorCoreEndpoints.vendorCategoryAssignmentRestore(id),
			{ method: "POST" }
		),

	hardDeleteVendorCategoryAssignment: (id: string) =>
		vendorCoreFetch<void>(
			vendorCoreEndpoints.vendorCategoryAssignmentHardDelete(id),
			{ method: "DELETE" }
		),

	listUsers: async (params?: { search?: string }) => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<CoreUserDto>>(
				vendorCoreEndpoints.usersList,
				{
					params: pageParams({ ...params, limit, offset }),
				}
			)
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

	getUser: (id: string) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.user(id)),

	createUser: (body: Record<string, unknown>) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.usersCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateUser: (id: string, body: Record<string, unknown>) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.userUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	deleteUser: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.userDelete(id), {
			method: "DELETE",
		}),

	restoreUser: (id: string) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.userRestore(id), {
			method: "POST",
		}),

	hardDeleteUser: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.userHardDelete(id), {
			method: "DELETE",
		}),

	setUserRoles: (id: string, body: { role_ids: string[] }) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.userRolesSet(id), {
			method: "POST",
			body: JSON.stringify(body),
		}),

	addUserRoles: (id: string, body: { role_ids: string[] }) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.userRolesAdd(id), {
			method: "POST",
			body: JSON.stringify(body),
		}),

	removeUserRoles: (id: string, body: { role_ids: string[] }) =>
		vendorCoreFetch<CoreUserDto>(vendorCoreEndpoints.userRolesRemove(id), {
			method: "POST",
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

	listIdentityGroups: async (params?: IdentityGroupListQuery) => {
		const page = await vendorCoreFetch<PaginatedResult<IdentityGroupDto>>(
			vendorCoreEndpoints.identityGroupsList,
			{
				params: pageParams({
					search: params?.search,
					limit: params?.limit,
					offset: params?.offset,
					is_active:
						params?.is_active === undefined
							? undefined
							: params.is_active
								? "true"
								: "false",
				}),
			}
		);
		return page;
	},

	listAllIdentityGroups: async (
		params?: Omit<IdentityGroupListQuery, "limit" | "offset">
	) => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<IdentityGroupDto>>(
				vendorCoreEndpoints.identityGroupsList,
				{
					params: pageParams({
						search: params?.search,
						is_active:
							params?.is_active === undefined
								? undefined
								: params.is_active
									? "true"
									: "false",
						limit,
						offset,
					}),
				}
			)
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<IdentityGroupDto>;
	},

	getIdentityGroup: (id: string) =>
		vendorCoreFetch<IdentityGroupDto>(vendorCoreEndpoints.identityGroup(id)),

	createIdentityGroup: (body: IdentityGroupCreateInput) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupsCreate,
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	updateIdentityGroup: (id: string, body: IdentityGroupUpdateInput) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupUpdate(id),
			{
				method: "PATCH",
				body: JSON.stringify(body),
			}
		),

	deleteIdentityGroup: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.identityGroupDelete(id), {
			method: "DELETE",
		}),

	restoreIdentityGroup: (id: string) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupRestore(id),
			{ method: "POST" }
		),

	addIdentityGroupMembers: (
		id: string,
		members: IdentityGroupCreateInput["members"]
	) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupMembersAdd(id),
			{
				method: "POST",
				body: JSON.stringify({ members }),
			}
		),

	removeIdentityGroupMembers: (
		id: string,
		body: { member_ids?: string[]; external_ids?: string[] }
	) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupMembersRemove(id),
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	linkIdentityGroupMemberUser: (
		id: string,
		body: { member_id: string; user_id: string }
	) =>
		vendorCoreFetch<IdentityGroupDto>(
			vendorCoreEndpoints.identityGroupMemberLinkUser(id),
			{
				method: "POST",
				body: JSON.stringify(body),
			}
		),

	listRoles: async (params?: RoleListQuery) =>
		vendorCoreFetch<PaginatedResult<RoleDto>>(vendorCoreEndpoints.rolesList, {
			params: pageParams(params),
		}),

	listAllRoles: async () => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<RoleDto>>(vendorCoreEndpoints.rolesList, {
				params: pageParams({ limit, offset }),
			})
		);
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<RoleDto>;
	},

	getRole: (id: string) =>
		vendorCoreFetch<RoleDto>(vendorCoreEndpoints.role(id)),

	createRole: (body: RoleCreateInput) =>
		vendorCoreFetch<RoleDto>(vendorCoreEndpoints.rolesCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateRole: (id: string, body: RoleUpdateInput) =>
		vendorCoreFetch<RoleDto>(vendorCoreEndpoints.roleUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	deleteRole: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.roleDelete(id), {
			method: "DELETE",
		}),

	restoreRole: (id: string) =>
		vendorCoreFetch<RoleDto>(vendorCoreEndpoints.roleRestore(id), {
			method: "POST",
		}),

	assignRoleUsers: (id: string, user_ids: string[]) =>
		vendorCoreFetch<RoleDto>(vendorCoreEndpoints.roleUsersAssign(id), {
			method: "POST",
			body: JSON.stringify({ user_ids }),
		}),

	unassignRoleUsers: (id: string, user_ids: string[]) =>
		vendorCoreFetch<RoleDto>(vendorCoreEndpoints.roleUsersUnassign(id), {
			method: "POST",
			body: JSON.stringify({ user_ids }),
		}),

	listSettings: async (params?: AppSettingListQuery) =>
		vendorCoreApi.listAppSettings(params),

	listAppSettings: async (params?: AppSettingListQuery) =>
		vendorCoreFetch<PaginatedResult<AppSettingDto>>(
			vendorCoreEndpoints.settingsList,
			{ params: pageParams(params) }
		),

	listAllAppSettings: async () => {
		const results = await listAllPages(async ({ limit, offset }) =>
			vendorCoreFetch<PaginatedResult<AppSettingDto>>(
				vendorCoreEndpoints.settingsList,
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
		} satisfies PaginatedResult<AppSettingDto>;
	},

	getAppSetting: (id: string) =>
		vendorCoreFetch<AppSettingDto>(vendorCoreEndpoints.setting(id)),

	createAppSetting: (body: AppSettingCreateInput) =>
		vendorCoreFetch<AppSettingDto>(vendorCoreEndpoints.settingsCreate, {
			method: "POST",
			body: JSON.stringify(body),
		}),

	updateAppSetting: (id: string, body: AppSettingUpdateInput) =>
		vendorCoreFetch<AppSettingDto>(vendorCoreEndpoints.settingUpdate(id), {
			method: "PATCH",
			body: JSON.stringify(body),
		}),

	deleteAppSetting: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.settingDelete(id), {
			method: "DELETE",
		}),

	restoreAppSetting: (id: string) =>
		vendorCoreFetch<AppSettingDto>(vendorCoreEndpoints.settingRestore(id), {
			method: "POST",
		}),

	listMigrationCasesPage: async (params?: MigrationCaseListQuery) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.migrationCasesList, {
			params: pageParams({
				...params,
				is_visible:
					params?.is_visible === undefined
						? undefined
						: params.is_visible
							? "true"
							: "false",
				is_deleted:
					params?.is_deleted === undefined
						? undefined
						: params.is_deleted
							? "true"
							: "false",
			}),
		});
		return mapPage(page, normalizeMigrationCase);
	},

	listMigrationCases: async (params?: MigrationCaseListQuery) => {
		const results = await listAllPages(async ({ limit, offset }) => {
			const page = await vendorCoreFetch<
				PaginatedResult<Record<string, unknown>>
			>(vendorCoreEndpoints.migrationCasesList, {
				params: pageParams({
					...params,
					limit,
					offset,
					is_visible:
						params?.is_visible === undefined
							? undefined
							: params.is_visible
								? "true"
								: "false",
					is_deleted:
						params?.is_deleted === undefined
							? undefined
							: params.is_deleted
								? "true"
								: "false",
				}),
			});
			return mapPage(page, normalizeMigrationCase);
		});
		return {
			limit: results.length,
			offset: 0,
			count: results.length,
			next: null,
			previous: null,
			results,
		} satisfies PaginatedResult<MigrationCaseDto>;
	},

	getMigrationCase: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCase(id)
		);
		return normalizeMigrationCase(raw);
	},

	createMigrationCase: async (body: MigrationCaseCreateInput) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCasesCreate,
			{ method: "POST", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	updateMigrationCase: async (id: string, body: MigrationCaseUpdateInput) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	deleteMigrationCase: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.migrationCaseDelete(id), {
			method: "DELETE",
		}),

	restoreMigrationCase: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseRestore(id),
			{ method: "POST" }
		);
		return normalizeMigrationCase(raw);
	},

	assignMigrationCase: async (
		id: string,
		body: { assigned_to_id?: string | null }
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseAssign(id),
			{ method: "POST", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	updateMigrationCaseSftpProgress: async (
		id: string,
		body: MigrationCaseProgressUpdateInput
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseSftpProgressUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	updateMigrationCaseEdiProgress: async (
		id: string,
		body: MigrationCaseProgressUpdateInput
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseEdiProgressUpdate(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	setMigrationCaseEscalation: async (
		id: string,
		body: MigrationCaseEscalationInput
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseEscalation(id),
			{ method: "POST", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	setMigrationCaseStatus: async (
		id: string,
		body: { migration_status: MigrationStatusDto | string }
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseStatus(id),
			{ method: "POST", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	setMigrationCaseWhitelist: async (
		id: string,
		body: { whitelist_status: WhitelistStatusDto | string }
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseWhitelist(id),
			{ method: "POST", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	markMigrationCaseTesting: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseMarkTesting(id),
			{ method: "POST" }
		);
		return normalizeMigrationCase(raw);
	},

	markMigrationCaseReady: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseMarkReady(id),
			{ method: "POST" }
		);
		return normalizeMigrationCase(raw);
	},

	markMigrationCaseWaitingOnVendor: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseMarkWaitingOnVendor(id),
			{ method: "POST" }
		);
		return normalizeMigrationCase(raw);
	},

	markMigrationCaseException: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseMarkException(id),
			{ method: "POST" }
		);
		return normalizeMigrationCase(raw);
	},

	markMigrationCaseProductionReady: async (id: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseMarkProductionReady(id),
			{ method: "POST" }
		);
		return normalizeMigrationCase(raw);
	},

	transitionMigrationCaseBlocker: async (
		id: string,
		body: MigrationCaseBlockerTransitionInput
	) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseBlockerTransition(id),
			{ method: "POST", body: JSON.stringify(body) }
		);
		return normalizeMigrationCase(raw);
	},

	bulkSetMigrationCaseStatus: (body: MigrationCaseBulkStatusInput) =>
		vendorCoreFetch<MigrationCaseBulkStatusResultDto>(
			vendorCoreEndpoints.migrationCasesBulkStatus,
			{ method: "POST", body: JSON.stringify(body) }
		),

	listMigrationCaseEvents: async (
		id: string,
		params?: { event_type?: string; limit?: number; offset?: number }
	) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.migrationCaseEvents(id), {
			params: pageParams(params),
		});
		return mapPage(page, (row): MigrationCaseEventDto => {
			const actorRaw =
				row.actor && typeof row.actor === "object"
					? (row.actor as Record<string, unknown>)
					: null;
			return {
				id: String(row.id ?? ""),
				event_type: String(row.event_type ?? ""),
				message: String(row.message ?? ""),
				tone: String(row.tone ?? "blue"),
				actor: actorRaw
					? {
							id: String(actorRaw.id ?? ""),
							username:
								typeof actorRaw.username === "string"
									? actorRaw.username
									: undefined,
							email:
								typeof actorRaw.email === "string" ? actorRaw.email : undefined,
							first_name:
								typeof actorRaw.first_name === "string"
									? actorRaw.first_name
									: undefined,
							last_name:
								typeof actorRaw.last_name === "string"
									? actorRaw.last_name
									: undefined,
							full_name:
								typeof actorRaw.full_name === "string"
									? actorRaw.full_name
									: undefined,
						}
					: null,
				created_at: String(row.created_at ?? ""),
			};
		});
	},

	getWorkQueueKpis: async (params?: WorkQueueFilterQuery) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.workQueueKpis,
			{ params: params as Record<string, string | number | undefined> }
		);
		return normalizeWorkQueueKpis(raw);
	},

	getWorkQueueProgressSummary: async (params?: WorkQueueFilterQuery) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.workQueueProgressSummary,
			{ params: params as Record<string, string | number | undefined> }
		);
		return normalizeWorkQueueProgressSummary(raw);
	},

	getWorkQueueAnalystStats: async (params?: WorkQueueFilterQuery) => {
		const raw = await vendorCoreFetch<unknown>(
			vendorCoreEndpoints.workQueueAnalystStats,
			{ params: params as Record<string, string | number | undefined> }
		);
		const rows = Array.isArray(raw) ? raw : [];
		return rows
			.filter(
				(row): row is Record<string, unknown> =>
					!!row && typeof row === "object"
			)
			.map(normalizeWorkQueueAnalystStatsRow);
	},

	listWorkQueueBlockers: async (params?: WorkQueueFilterQuery) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.workQueueBlockersList, {
			params: pageParams(params),
		});
		return mapPage(page, normalizeWorkQueueBlockerRow);
	},

	importWorkQueueSpreadsheet: async (file: File) => {
		const form = new FormData();
		form.append("file", file);
		return vendorCoreFetch<WorkQueueImportResultDto>(
			vendorCoreEndpoints.workQueueImport,
			{
				method: "POST",
				body: form,
				headers: {},
			}
		);
	},

	seedWorkQueue: (body?: WorkQueueSeedInput) =>
		vendorCoreFetch<WorkQueueSeedResultDto>(vendorCoreEndpoints.workQueueSeed, {
			method: "POST",
			body: JSON.stringify(body ?? {}),
		}),

	uploadMigrationCaseDocument: async (id: string, file: File) => {
		const form = new FormData();
		form.append("file", file);
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseDocumentsUpload(id),
			{
				method: "POST",
				body: form,
				headers: {},
			}
		);
		return normalizeMigrationCaseDocument(raw);
	},

	listMigrationCaseDocuments: async (
		id: string,
		params?: { limit?: number; offset?: number }
	) => {
		const page = await vendorCoreFetch<
			PaginatedResult<Record<string, unknown>>
		>(vendorCoreEndpoints.migrationCaseDocumentsList(id), {
			params: pageParams(params),
		});
		return mapPage(page, normalizeMigrationCaseDocument);
	},

	getMigrationCaseDocument: async (caseId: string, documentId: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseDocument(caseId, documentId)
		);
		return normalizeMigrationCaseDocument(raw);
	},

	deleteMigrationCaseDocument: async (caseId: string, documentId: string) => {
		await vendorCoreFetch<void>(
			vendorCoreEndpoints.migrationCaseDocumentDelete(caseId, documentId),
			{ method: "POST" }
		);
	},

	restoreMigrationCaseDocument: async (caseId: string, documentId: string) => {
		const raw = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.migrationCaseDocumentRestore(caseId, documentId),
			{ method: "POST" }
		);
		return normalizeMigrationCaseDocument(raw);
	},

	hardDeleteMigrationCaseDocument: async (
		caseId: string,
		documentId: string
	) => {
		await vendorCoreFetch<void>(
			vendorCoreEndpoints.migrationCaseDocumentHardDelete(caseId, documentId),
			{ method: "POST" }
		);
	},

	hardDeleteMigrationCase: (id: string) =>
		vendorCoreFetch<void>(vendorCoreEndpoints.migrationCaseHardDelete(id), {
			method: "DELETE",
		}),

	listClaimVendorFiles: (params?: {
		limit?: number;
		offset?: number;
		search?: string;
		vendor_id?: string;
		status?: string;
		direction?: string;
		review_status?: string;
		wait_bucket?: string;
		outbound_send_status?: string;
		transaction_type?: string;
		program?: string;
		reject_reason?: string;
		order_by?: string;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.claimVendorFilesList,
			{ params: pageParams(params) }
		),

	getClaimVendorFilesSummary: (
		params?: Record<string, string | number | null | undefined>
	) =>
		vendorCoreFetch<{
			total_files: number;
			awaiting_review: number;
			accepted: number;
			rejected: number;
			age_buckets: Record<string, number>;
			by_status: Record<string, number>;
			by_review_status: Record<string, number>;
			by_vendor: Record<string, number>;
		}>(vendorCoreEndpoints.claimVendorFilesSummary, {
			params: pageParams(params),
		}),

	exportClaimVendorFilesCsv: (
		params?: Record<string, string | number | null | undefined>
	) =>
		vendorCoreFetchBlob(vendorCoreEndpoints.claimVendorFilesExportCsv, {
			params: pageParams(params),
		}),

	getClaimVendorFile: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimVendorFile(id)
		),

	acceptClaimVendorFile: (
		id: string,
		body?: { notes?: string; claim_line_ids?: string[] }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimVendorFileAccept(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	rejectClaimVendorFile: (
		id: string,
		body?: { reasons?: string[]; notes?: string; claim_line_ids?: string[] }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimVendorFileReject(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	sendClaimVendorFile: (
		id: string,
		body?: { notes?: string; sync?: boolean; force?: boolean }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimVendorFileSend(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	downloadClaimVendorFile: async (id: string) => {
		const result = await vendorCoreFetchBlob(
			vendorCoreEndpoints.claimVendorFileDownload(id)
		);
		const text = await result.blob.text();
		return {
			text,
			contentType: result.contentType,
			filename: result.filename,
		};
	},

	listClaimResponses: (params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.claimResponsesList,
			{ params: pageParams(params) }
		),

	getClaimResponse: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimResponse(id)
		),

	listClaimExceptions: (params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.claimExceptionsList,
			{ params: pageParams(params) }
		),

	getClaimException: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimException(id)
		),

	assignClaimException: (
		id: string,
		body?: { assigned_to_id?: string | null }
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimExceptionAssign(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	resolveClaimException: (id: string, body?: { notes?: string }) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimExceptionResolve(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	listSubmissionBatches: (params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.submissionBatchesList,
			{ params: pageParams(params) }
		),

	getSubmissionBatch: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.submissionBatch(id)
		),

	generateSubmissionBatchOutbound: (
		id: string,
		body?: Record<string, unknown>
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.submissionBatchGenerateOutbound(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	listClaimDiagnoses: (params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.claimDiagnosesList,
			{ params: pageParams(params) }
		),

	getClaimDiagnosis: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.claimDiagnosis(id)
		),

	listRemittanceFiles: (params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.remittanceFilesList,
			{ params: pageParams(params) }
		),

	getRemittanceFile: (id: string) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.remittanceFile(id)
		),

	getRemittanceFilesSummary: (
		params?: Record<string, string | number | undefined | null>
	) =>
		vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.remittanceFilesSummary,
			{ params: pageParams(params) }
		),

	exportRemittanceFile: (id: string) =>
		vendorCoreFetchBlob(vendorCoreEndpoints.remittanceFileExport(id)),

	listRemittanceClaims: (params?: {
		limit?: number;
		offset?: number;
		remittance_file_id?: string;
	}) =>
		vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.remittanceClaimsList,
			{ params: pageParams(params) }
		),

	listClaimHeaders: (params?: ClaimHeaderListQuery) =>
		vendorCoreFetch<PaginatedResult<ClaimHeaderListDto>>(
			vendorCoreEndpoints.claimHeadersList,
			{ params: pageParams(params) }
		),

	getClaimHeadersSummary: (params?: ClaimHeaderListQuery) =>
		vendorCoreFetch<ClaimHeaderSummaryDto>(
			vendorCoreEndpoints.claimHeadersSummary,
			{ params: pageParams(params) }
		),

	getClaimHeader: (id: string) =>
		vendorCoreFetch<ClaimHeaderDetailDto>(vendorCoreEndpoints.claimHeader(id)),

	voidClaimHeader: (id: string, body?: ClaimHeaderVoidReplaceInput) =>
		vendorCoreFetch<ClaimHeaderDetailDto>(
			vendorCoreEndpoints.claimHeaderVoid(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	replaceClaimHeader: (id: string, body?: ClaimHeaderVoidReplaceInput) =>
		vendorCoreFetch<ClaimHeaderDetailDto>(
			vendorCoreEndpoints.claimHeaderReplace(id),
			{ method: "POST", body: JSON.stringify(body ?? {}) }
		),

	revalidateClaimHeaders: (claimHeaderIds: string[]) =>
		vendorCoreFetch<ClaimHeaderValidateResult>(
			vendorCoreEndpoints.claimHeadersValidate,
			{
				method: "POST",
				body: JSON.stringify({ claim_header_ids: claimHeaderIds }),
			}
		),

	getCmsEdgeSettings: () =>
		vendorCoreFetch<CmsEdgeSettingsDto>(vendorCoreEndpoints.cmsEdgeSettings),

	updateCmsEdgeSettings: (body: CmsEdgeSettingsUpdateInput) =>
		vendorCoreFetch<CmsEdgeSettingsDto>(
			vendorCoreEndpoints.cmsEdgeSettingsUpdate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	seedCmsEdgeDemo: (body?: { force?: boolean }) =>
		vendorCoreFetch<CmsEdgeSeedResultDto>(
			vendorCoreEndpoints.cmsEdgeSettingsSeed,
			{ method: "POST", body: JSON.stringify(body ?? { force: true }) }
		),

	listCmsEdgeReportingPeriods: (params?: {
		is_current?: boolean;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeReportingPeriodDto>>(
			vendorCoreEndpoints.cmsEdgeReportingPeriodsList,
			{
				params: pageParams({
					limit: params?.limit,
					offset: params?.offset,
					is_current:
						params?.is_current === undefined
							? undefined
							: params.is_current
								? "true"
								: "false",
				}),
			}
		),

	getCmsEdgeOverviewStats: (params?: { reporting_period?: string }) =>
		vendorCoreFetch<CmsEdgeOverviewStatsDto>(
			vendorCoreEndpoints.cmsEdgeOverviewStats,
			{ params: pageParams(params) }
		),

	getCmsEdgeOverviewWorkflow: (params?: { reporting_period?: string }) =>
		vendorCoreFetch<CmsEdgeWorkflowDto>(
			vendorCoreEndpoints.cmsEdgeOverviewWorkflow,
			{ params: pageParams(params) }
		),

	listCmsEdgeOverviewActivity: (params?: { limit?: number; offset?: number }) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeActivityDto>>(
			vendorCoreEndpoints.cmsEdgeOverviewActivityList,
			{ params: pageParams(params) }
		),

	listCmsEdgeOverviewExceptions: (params?: {
		reporting_period?: string;
		limit?: number;
		offset?: number;
	}) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeOverviewExceptionDto>>(
			vendorCoreEndpoints.cmsEdgeOverviewExceptionsList,
			{ params: pageParams(params) }
		),

	listCmsEdgeFilePackages: (params?: CmsEdgeFilePackageListQuery) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeFilePackageDto>>(
			vendorCoreEndpoints.cmsEdgeFilePackagesList,
			{ params: pageParams(params) }
		),

	createCmsEdgeFilePackage: (body: CmsEdgeFilePackageCreateInput) =>
		vendorCoreFetch<CmsEdgeFilePackageDto>(
			vendorCoreEndpoints.cmsEdgeFilePackagesCreate,
			{ method: "POST", body: JSON.stringify(body) }
		),

	getCmsEdgeFilePackage: (id: string) =>
		vendorCoreFetch<CmsEdgeFilePackageDto>(
			vendorCoreEndpoints.cmsEdgeFilePackage(id)
		),

	generateCmsEdgeFilePackage: (id: string) =>
		vendorCoreFetch<CmsEdgeFilePackageDto>(
			vendorCoreEndpoints.cmsEdgeFilePackageGenerate(id),
			{ method: "POST", body: JSON.stringify({}) }
		),

	packageCmsEdgeFilePackage: (id: string) =>
		vendorCoreFetch<CmsEdgeFilePackageDto>(
			vendorCoreEndpoints.cmsEdgeFilePackagePackage(id),
			{ method: "POST", body: JSON.stringify({}) }
		),

	submitCmsEdgeFilePackage: (id: string) =>
		vendorCoreFetch<CmsEdgeFilePackageDto>(
			vendorCoreEndpoints.cmsEdgeFilePackageSubmit(id),
			{ method: "POST", body: JSON.stringify({}) }
		),

	listCmsEdgeSubmissions: (params?: CmsEdgeListQuery) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeSubmissionDto>>(
			vendorCoreEndpoints.cmsEdgeSubmissionsList,
			{ params: pageParams(params) }
		),

	listCmsEdgeCmsResponses: (params?: CmsEdgeListQuery) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeCmsResponseDto>>(
			vendorCoreEndpoints.cmsEdgeCmsResponsesList,
			{ params: pageParams(params) }
		),

	listCmsEdgeValidationRuns: (params?: CmsEdgeListQuery) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeValidationRunDto>>(
			vendorCoreEndpoints.cmsEdgeValidationRunsList,
			{ params: pageParams(params) }
		),

	listCmsEdgeAuditRequests: (params?: CmsEdgeListQuery) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeAuditRequestDto>>(
			vendorCoreEndpoints.cmsEdgeAuditRequestsList,
			{ params: pageParams(params) }
		),

	listCmsEdgeDocuments: (params?: CmsEdgeListQuery) =>
		vendorCoreFetch<PaginatedResult<CmsEdgeDocumentDto>>(
			vendorCoreEndpoints.cmsEdgeDocumentsList,
			{ params: pageParams(params) }
		),

	verifyToken: (token: string) =>
		vendorCoreFetch<{ detail?: string }>(vendorCoreEndpoints.tokenVerify, {
			method: "POST",
			body: JSON.stringify({ token }),
			auth: false,
		}),
};
