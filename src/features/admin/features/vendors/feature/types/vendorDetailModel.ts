import type { FileRun } from "@/features/admin/features/file-management/mock-data";
import type { ContractModel } from "@/features/shared/vms/types";
import type { VendorContact, VendorModel } from "@/features/shared/vms/types";
import type {
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
} from "@/lib/vendor-core/types";

import type {
	VendorAccountRow,
	VendorAlert,
	VendorConfigJob,
	VendorIntegrationProfile,
	VendorTrendPoint,
} from "../../vendor-types";
import type { VendorNoteUi } from "../mappers/noteMappers";

/** Per-resource load failures surfaced as banners (empty array ≠ failure). */
export type VendorDetailLoadError = {
	resource:
		| "connections"
		| "jobs"
		| "inbound_files"
		| "accounts"
		| "account_ops"
		| "integration_profile"
		| "contacts"
		| "contracts"
		| "notes"
		| "audit";
	message: string;
};

/** Header metadata cards (Primary Contact, SFTP, timezone, health, …). */
export type VendorDetailHeaderModel = {
	displayName: string;
	primaryContact: VendorContact | null;
	additionalContacts: VendorContact[];
	integration: VendorIntegrationProfile;
};

/** Overview tab — recent activity table + charts. */
export type VendorOverviewModel = {
	recentRuns: FileRun[];
	fileTypeSummary: { name: string; value: number }[];
	trend: VendorTrendPoint[];
	trendRangeDays: number;
};

/** Operations tab — summary KPIs + sub-tabs. */
export type VendorOperationsModel = {
	runs: FileRun[];
	configJobs: VendorConfigJob[];
	alerts: VendorAlert[];
	summary: {
		totalRuns: number;
		successful: number;
		warnings: number;
		failed: number;
		activeJobs: number;
		openAlerts: number;
	};
};

/** Accounts tab — table rows + summary cards. */
export type VendorAccountsSectionModel = {
	rows: VendorAccountRow[];
	summary: {
		total: number;
		active: number;
		warnings: number;
		errors: number;
	};
};

/** Contracts tab — all six sidebar sections read from the same contract list today. */
export type VendorContractsSectionModel = {
	contracts: ContractModel[];
	count: number;
};

export type VendorNotesSectionModel = {
	notes: VendorNoteUi[];
	count: number;
};

export type VendorAuditSectionModel = {
	activityCount: number;
};

/** Raw DTOs kept for mutations and N+1 fetches (e.g. inbound file events). */
export type VendorDetailBundleRaw = {
	connections: ConnectionDto[];
	jobs: IntakeJobDto[];
	inboundFiles: InboundFileDto[];
};

/** Unified vendor detail bundle returned by `getVendorDetailBundle()`. */
export type VendorDetailBundleModel = {
	vendor: VendorModel;
	header: VendorDetailHeaderModel;
	overview: VendorOverviewModel;
	operations: VendorOperationsModel;
	accounts: VendorAccountsSectionModel;
	contracts: VendorContractsSectionModel;
	notes: VendorNotesSectionModel;
	audit: VendorAuditSectionModel;
	raw: VendorDetailBundleRaw;
	errors: VendorDetailLoadError[];
	tabCounts: {
		accounts: number;
		contracts: number;
		notes: number;
		jobs: number;
		runs: number;
	};
};
