import { vendorCoreApi } from "@/lib/vendor-core/api";
import type {
	MigrationCaseBlockerTransitionInput,
	MigrationCaseCreateInput,
	MigrationCaseEscalationInput,
	MigrationCaseListQuery,
	MigrationCaseProgressUpdateInput,
	MigrationCaseUpdateInput,
	MigrationStatusDto,
	WhitelistStatusDto,
	WorkQueueFilterQuery,
	WorkQueueSeedInput,
} from "@/lib/vendor-core/types";

import type { ConnectionProgress } from "../../progress-data";
import type { TpaTpvRow } from "../../work-queue-types";
import {
	analystStatsToProgressRows,
	blockerRowsToEscalationSummary,
	connectionProgressToApiInput,
	eventDtoToHistory,
	kpisToCards,
	kpisToProgressSummary,
	migrationCaseToRow,
	progressSummaryDtoToUi,
} from "../mappers/workQueueMappers";

export async function listWorkQueueRows(
	params?: MigrationCaseListQuery
): Promise<TpaTpvRow[]> {
	const page = await vendorCoreApi.listMigrationCases(params);
	return (page.results ?? []).map(migrationCaseToRow);
}

export async function listWorkQueueRowsPage(params?: MigrationCaseListQuery) {
	const page = await vendorCoreApi.listMigrationCasesPage(params);
	return {
		...page,
		results: (page.results ?? []).map(migrationCaseToRow),
	};
}

export async function getMigrationCaseDetail(
	id: string
): Promise<TpaTpvRow | null> {
	const dto = await vendorCoreApi.getMigrationCase(id);
	return migrationCaseToRow(dto);
}

export async function listMigrationCaseHistory(id: string) {
	const page = await vendorCoreApi.listMigrationCaseEvents(id, {
		limit: 50,
		offset: 0,
	});
	return (page.results ?? []).map(eventDtoToHistory);
}

export async function createMigrationCase(body: MigrationCaseCreateInput) {
	return vendorCoreApi.createMigrationCase(body).then(migrationCaseToRow);
}

export async function updateMigrationCase(
	id: string,
	body: MigrationCaseUpdateInput
) {
	return vendorCoreApi.updateMigrationCase(id, body).then(migrationCaseToRow);
}

export async function assignMigrationCase(
	id: string,
	assigned_to_id: string | null
) {
	return vendorCoreApi
		.assignMigrationCase(id, { assigned_to_id })
		.then(migrationCaseToRow);
}

export async function updateMigrationCaseProgress(
	id: string,
	track: "sftp" | "edi",
	progress: ConnectionProgress
) {
	const body: MigrationCaseProgressUpdateInput =
		connectionProgressToApiInput(progress);
	if (track === "sftp") {
		return vendorCoreApi.updateMigrationCaseSftpProgress(id, body);
	}
	return vendorCoreApi.updateMigrationCaseEdiProgress(id, body);
}

export async function setMigrationCaseStatus(
	id: string,
	migration_status: MigrationStatusDto | string
) {
	return vendorCoreApi
		.setMigrationCaseStatus(id, { migration_status })
		.then(migrationCaseToRow);
}

export async function markMigrationCaseTesting(id: string) {
	return vendorCoreApi.markMigrationCaseTesting(id).then(migrationCaseToRow);
}

export async function markMigrationCaseReady(id: string) {
	return vendorCoreApi.markMigrationCaseReady(id).then(migrationCaseToRow);
}

export async function markMigrationCaseWaitingOnVendor(id: string) {
	return vendorCoreApi
		.markMigrationCaseWaitingOnVendor(id)
		.then(migrationCaseToRow);
}

export async function bulkSetMigrationCaseStatus(
	ids: string[],
	migration_status: MigrationStatusDto | string
) {
	return vendorCoreApi.bulkSetMigrationCaseStatus({ ids, migration_status });
}

export async function importWorkQueueSpreadsheet(file: File) {
	return vendorCoreApi.importWorkQueueSpreadsheet(file);
}

export async function seedWorkQueue(body?: WorkQueueSeedInput) {
	return vendorCoreApi.seedWorkQueue(body);
}

export async function setMigrationCaseEscalation(
	id: string,
	body: MigrationCaseEscalationInput
) {
	return vendorCoreApi
		.setMigrationCaseEscalation(id, body)
		.then(migrationCaseToRow);
}

export async function listMigrationCaseDocuments(
	id: string,
	params?: { limit?: number; offset?: number }
) {
	const page = await vendorCoreApi.listMigrationCaseDocuments(id, params);
	return page.results ?? [];
}

export async function deleteMigrationCaseDocument(
	caseId: string,
	documentId: string
) {
	return vendorCoreApi.deleteMigrationCaseDocument(caseId, documentId);
}

export async function uploadMigrationCaseDocument(id: string, file: File) {
	return vendorCoreApi.uploadMigrationCaseDocument(id, file);
}

export async function getWorkQueueKpisRaw(params?: WorkQueueFilterQuery) {
	return vendorCoreApi.getWorkQueueKpis(params);
}

export async function getWorkQueueProgressSummary(
	params?: WorkQueueFilterQuery
) {
	const dto = await vendorCoreApi.getWorkQueueProgressSummary(params);
	return progressSummaryDtoToUi(dto);
}

export async function getWorkQueueAnalystStats(params?: WorkQueueFilterQuery) {
	const rows = await vendorCoreApi.getWorkQueueAnalystStats(params);
	return analystStatsToProgressRows(rows);
}

export async function listWorkQueueBlockers(params?: WorkQueueFilterQuery) {
	const page = await vendorCoreApi.listWorkQueueBlockers(params);
	return page.results ?? [];
}

export async function getWorkQueueEscalationSummary(
	params?: WorkQueueFilterQuery
) {
	const rows = await listWorkQueueBlockers({
		...params,
		limit: 100,
		offset: 0,
	});
	return blockerRowsToEscalationSummary(rows);
}

export async function markMigrationCaseException(id: string) {
	return vendorCoreApi.markMigrationCaseException(id).then(migrationCaseToRow);
}

export async function markMigrationCaseProductionReady(id: string) {
	return vendorCoreApi
		.markMigrationCaseProductionReady(id)
		.then(migrationCaseToRow);
}

export async function setMigrationCaseWhitelist(
	id: string,
	whitelist_status: WhitelistStatusDto | string
) {
	return vendorCoreApi
		.setMigrationCaseWhitelist(id, { whitelist_status })
		.then(migrationCaseToRow);
}

export async function transitionMigrationCaseBlocker(
	id: string,
	body: MigrationCaseBlockerTransitionInput
) {
	return vendorCoreApi
		.transitionMigrationCaseBlocker(id, body)
		.then(migrationCaseToRow);
}

export async function deleteMigrationCase(id: string) {
	return vendorCoreApi.deleteMigrationCase(id);
}

export async function restoreMigrationCase(id: string) {
	return vendorCoreApi.restoreMigrationCase(id).then(migrationCaseToRow);
}

export async function getWorkQueueKpiCards(params?: WorkQueueFilterQuery) {
	const kpis = await vendorCoreApi.getWorkQueueKpis(params);
	return kpisToCards(kpis);
}

export { kpisToProgressSummary };
