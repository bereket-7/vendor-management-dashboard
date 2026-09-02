import type { FileRun } from "@/features/admin/features/file-management/mock-data";
import { vendorDtoToModel } from "@/features/shared/vms/map-vendor-core";
import type { VendorContact, VendorModel } from "@/features/shared/vms/types";

import {
	buildTrendFromRuns,
	buildVendorAlerts,
	buildVendorIntegrationProfile,
	inboundFilesToRuns,
	intakeJobsToConfigJobs,
	mapIntegrationProfileDto,
} from "../../live-vendor-detail";
import {
	summarizeRuns,
	type VendorIntegrationProfile,
} from "../../vendor-types";
import type { VendorDetailRawBundleDto } from "../dto/vendorDetailDto";
import {
	accountDtoToRow,
	mergeAccountOpsSummary,
} from "./accountMappers";
import { vendorNoteDtoToUi } from "./noteMappers";
import { contractDtoToModel } from "@/features/admin/features/contracts/feature/mappers/contractCoreMappers";
import type {
	VendorDetailBundleModel,
	VendorDetailHeaderModel,
	VendorDetailLoadError,
} from "../types/vendorDetailModel";

function mapHeaderContacts(
	vendor: VendorModel,
	contacts: VendorDetailRawBundleDto["contacts"]
): Pick<VendorDetailHeaderModel, "primaryContact" | "additionalContacts"> {
	const headerContacts: VendorContact[] =
		contacts.length > 0
			? contacts.map((contact) => ({
					id: contact.id,
					name: contact.name,
					email: contact.email,
					phone: contact.phone ?? null,
					role: contact.role ?? "",
					isPrimary: contact.is_primary,
				}))
			: vendor.contacts;
	const primary =
		headerContacts.find((contact) => contact.isPrimary) ?? headerContacts[0] ?? null;
	return {
		primaryContact: primary,
		additionalContacts: headerContacts.filter(
			(contact) => contact.id !== primary?.id
		),
	};
}

function buildIntegration(
	vendor: VendorModel,
	raw: VendorDetailRawBundleDto,
	accountsCount: number
): VendorIntegrationProfile {
	const fallback = buildVendorIntegrationProfile(
		vendor,
		raw.connections,
		raw.jobs,
		accountsCount
	);
	if (!raw.integrationProfile) return fallback;
	return mapIntegrationProfileDto(
		raw.integrationProfile,
		vendor,
		raw.connections,
		raw.jobs,
		accountsCount
	);
}

function buildFileTypeSummary(runs: FileRun[]) {
	const counts = new Map<string, number>();
	for (const run of runs) {
		counts.set(run.fileType, (counts.get(run.fileType) ?? 0) + 1);
	}
	return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

export function mapVendorDetailBundle(
	raw: VendorDetailRawBundleDto,
	errors: VendorDetailLoadError[] = []
): VendorDetailBundleModel {
	const vendor = vendorDtoToModel(raw.vendor);
	const displayName = vendor.tradeName ?? vendor.legalName ?? "Vendor";
	const opsByAccount = new Map(
		raw.accountOps.map((row) => [row.account_id, row])
	);
	const accountRows = raw.accounts.map((dto) =>
		mergeAccountOpsSummary(accountDtoToRow(dto), opsByAccount.get(dto.id))
	);
	const integration = buildIntegration(vendor, raw, accountRows.length);
	const runs = inboundFilesToRuns(raw.inboundFiles, vendor.id, displayName);
	const runSummary = summarizeRuns(runs);
	const configJobs = intakeJobsToConfigJobs(raw.jobs);
	const alerts = buildVendorAlerts(
		vendor.id,
		displayName,
		raw.connections,
		raw.inboundFiles,
		runs
	);
	const contracts = raw.contracts.map(contractDtoToModel);
	const notes = raw.notes.map(vendorNoteDtoToUi);
	const { primaryContact, additionalContacts } = mapHeaderContacts(
		vendor,
		raw.contacts
	);

	return {
		vendor,
		header: {
			displayName,
			primaryContact,
			additionalContacts,
			integration,
		},
		overview: {
			recentRuns: runs,
			fileTypeSummary: buildFileTypeSummary(runs),
			trend: buildTrendFromRuns(runs),
			trendRangeDays: 7,
		},
		operations: {
			runs,
			configJobs,
			alerts,
			summary: {
				totalRuns: runSummary.total,
				successful: runSummary.successful,
				warnings: runSummary.warnings,
				failed: runSummary.failed,
				activeJobs: configJobs.filter((job) => job.status === "Active").length,
				openAlerts: alerts.length,
			},
		},
		accounts: {
			rows: accountRows,
			summary: {
				total: accountRows.length,
				active: accountRows.filter((row) => row.active).length,
				warnings: accountRows.filter((row) => row.status === "warning").length,
				errors: accountRows.filter((row) => row.status === "error").length,
			},
		},
		contracts: {
			contracts,
			count: contracts.length,
		},
		notes: {
			notes,
			count: notes.length,
		},
		audit: {
			activityCount: raw.auditRecords.length,
		},
		raw: {
			connections: raw.connections,
			jobs: raw.jobs,
			inboundFiles: raw.inboundFiles,
		},
		errors,
		tabCounts: {
			accounts: accountRows.length,
			contracts: contracts.length,
			notes: notes.length,
			jobs: configJobs.filter((job) => job.status === "Active").length,
			runs: runs.length,
		},
	};
}
