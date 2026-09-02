import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { VendorCoreApiError } from "@/lib/vendor-core/client";
import type {
	ProviderCreateInput,
	ProviderDashboardStatsQuery,
	ProviderDto,
	ProviderIdentifierDto,
	ProviderListQuery,
	ProviderRosterCreateInput,
	ProviderRosterListQuery,
	ProviderRosterUpdateInput,
	ProviderStatusInput,
	ProviderUpdateInput,
} from "@/lib/vendor-core/types";

import {
	isProviderUuid,
	providerDtoToDetail,
	providersToSummaries,
} from "../../live-providers";
import {
	type ProviderSummary,
	getProvider,
	getProviderSummaries,
} from "../../mock-data";
import type { ProviderWizardValues } from "../../pages/ProviderFormWizard";
import {
	valuesFromProviderDto,
	wizardValuesToProfileUpdate,
} from "../../pages/ProviderFormWizard";

export {
	displayProviderName,
	formatCompact,
	formatCurrency,
	formatDate,
	getProvider,
	initials,
	providerAge,
} from "../../mock-data";
export type {
	ClaimActivityStatus,
	CredentialStatus,
	ExceptionStatus,
	FeedStatus,
	NetworkStatus,
	ProviderDetail,
	ProviderStatus,
	ProviderSummary,
} from "../../mock-data";

export async function listProviderSummaries() {
	if (isMockEnabled()) return getProviderSummaries();
	const page = await vendorCoreApi.listProviders();
	return providersToSummaries(page.results ?? []);
}

/** Walk list pages until `id` found. Used when GET /providers/:id/ fails (500/403). */
async function findProviderDtoById(id: string): Promise<ProviderDto | null> {
	const pageSize = 100;
	let offset = 0;
	for (;;) {
		const page = await vendorCoreApi.listProvidersPage({
			limit: pageSize,
			offset,
		});
		const hit = page.results?.find((row) => row.id === id);
		if (hit) return hit;
		const chunk = page.results?.length ?? 0;
		offset += chunk;
		if (!chunk) break;
		if (typeof page.count === "number" && offset >= page.count) break;
		if (chunk < pageSize) break;
	}
	return null;
}

/**
 * Load one provider DTO by UUID.
 * Prefers GET /providers/:id/; falls back to list scan when detail endpoint errors.
 */
export async function getProviderDto(id: string): Promise<ProviderDto | null> {
	if (!id) return null;
	if (isMockEnabled()) return null;
	if (!isProviderUuid(id)) return null;
	try {
		return await vendorCoreApi.getProvider(id);
	} catch (err) {
		const listed = await findProviderDtoById(id);
		if (listed) return listed;
		if (err instanceof VendorCoreApiError && err.status === 404) return null;
		throw err;
	}
}

export async function getProviderDetail(
	idOrNpi: string,
	program?: ProviderSummary["program"]
) {
	if (isMockEnabled()) return getProvider(idOrNpi);
	const programCode = program ?? "DHCF";

	async function loadById(id: string) {
		const [
			dto,
			profile,
			summary,
			locationsPage,
			identifiersPage,
			networksPage,
			credentialsPage,
			exceptionsPage,
			vendorSourcesPage,
			monthlyVolume,
			rejectionReasons,
			recentClaims,
			recentEncounters,
		] = await Promise.all([
			getProviderDto(id),
			vendorCoreApi.getProviderProfile(id).catch(() => null),
			vendorCoreApi.getProviderSummary(id).catch(() => null),
			vendorCoreApi.listProviderLocations(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderIdentifiers(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderNetworks(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderCredentials(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderExceptions(id).catch(() => ({ results: [] })),
			vendorCoreApi
				.listProviderVendorSources(id)
				.catch(() => ({ results: [] })),
			vendorCoreApi.listProviderMonthlyVolume(id).catch(() => []),
			vendorCoreApi.listProviderRejectionReasons(id).catch(() => []),
			vendorCoreApi
				.listProviderRecentActivity(id, { kind: "claim", limit: 25 })
				.catch(() => []),
			vendorCoreApi
				.listProviderRecentActivity(id, { kind: "encounter", limit: 25 })
				.catch(() => []),
		]);
		if (!dto) return null;
		return providerDtoToDetail(dto, programCode, {
			profile,
			summary,
			locations: locationsPage.results ?? [],
			identifiers: identifiersPage.results ?? [],
			networks: networksPage.results ?? [],
			credentials: credentialsPage.results ?? [],
			exceptions: exceptionsPage.results ?? [],
			vendorSources: vendorSourcesPage.results ?? [],
			monthlyVolume,
			rejectionReasons,
			recentClaims,
			recentEncounters,
		});
	}

	if (isProviderUuid(idOrNpi)) {
		return loadById(idOrNpi);
	}

	const page = await vendorCoreApi.listProvidersPage({
		npi: idOrNpi,
		limit: 5,
		offset: 0,
	});
	const hit = page.results?.[0];
	if (hit?.id) return loadById(hit.id);
	const byName = await vendorCoreApi.listProvidersPage({
		name: idOrNpi,
		limit: 5,
		offset: 0,
	});
	const named = byName.results?.[0];
	return named?.id ? loadById(named.id) : null;
}

const WIZARD_IDENTIFIER_FIELDS: Array<{
	key: keyof Pick<ProviderWizardValues, "tax_id" | "upin" | "medicaid_id">;
	label: string;
}> = [
	{ key: "tax_id", label: "Tax ID" },
	{ key: "upin", label: "UPIN" },
	{ key: "medicaid_id", label: "Medicaid ID" },
];

async function syncProviderIdentifiers(
	providerId: string,
	values: ProviderWizardValues,
	existing?: ProviderIdentifierDto[]
) {
	const rows =
		existing ??
		(await vendorCoreApi.listProviderIdentifiers(providerId)).results ??
		[];

	for (const { key, label } of WIZARD_IDENTIFIER_FIELDS) {
		const value = values[key].trim();
		const hit = rows.find(
			(row) => row.label.trim().toLowerCase() === label.toLowerCase()
		);
		if (value && !hit) {
			await vendorCoreApi.createProviderIdentifier(providerId, {
				label,
				value,
			});
		} else if (value && hit) {
			await vendorCoreApi.updateProviderIdentifier(providerId, hit.id, {
				label,
				value,
			});
		}
	}
}

/** Persist wizard profile + identifier fields after create/update. */
export async function syncProviderWizardExtras(
	providerId: string,
	values: ProviderWizardValues
) {
	await vendorCoreApi.updateProviderProfile(
		providerId,
		wizardValuesToProfileUpdate(values)
	);
	await syncProviderIdentifiers(providerId, values);
}

export async function loadProviderWizardValues(
	providerId: string,
	fallbackRosterId = ""
): Promise<ProviderWizardValues | null> {
	const [dto, profile, identifiersPage] = await Promise.all([
		getProviderDto(providerId),
		vendorCoreApi.getProviderProfile(providerId).catch(() => null),
		vendorCoreApi.listProviderIdentifiers(providerId).catch(() => ({
			results: [] as ProviderIdentifierDto[],
		})),
	]);
	if (!dto) return null;
	return valuesFromProviderDto(dto, fallbackRosterId, {
		profile,
		identifiers: identifiersPage.results ?? [],
	});
}

export async function listProviders(params?: ProviderListQuery) {
	const page = await vendorCoreApi.listProviders(params);
	return page.results ?? [];
}

export async function getProviderDashboardStats(
	params?: ProviderDashboardStatsQuery
) {
	return vendorCoreApi.getProviderDashboardStats(params);
}

export async function seedProviders(body?: { force?: boolean }) {
	return vendorCoreApi.seedProviders(body);
}

export async function createProvider(body: ProviderCreateInput) {
	return vendorCoreApi.createProvider(body);
}

export async function updateProvider(id: string, body: ProviderUpdateInput) {
	return vendorCoreApi.updateProvider(id, body);
}

export async function setProviderStatus(id: string, body: ProviderStatusInput) {
	return vendorCoreApi.setProviderStatus(id, body);
}

export async function deleteProvider(id: string) {
	return vendorCoreApi.deleteProvider(id);
}

export async function restoreProvider(id: string) {
	return vendorCoreApi.restoreProvider(id);
}

export async function hardDeleteProvider(id: string) {
	return vendorCoreApi.hardDeleteProvider(id);
}

export async function listProviderRosterProviders(
	rosterId: string,
	params?: ProviderListQuery
) {
	const page = await vendorCoreApi.listProviderRosterProviders(rosterId, params);
	return page.results ?? [];
}

export async function deleteProviderIdentifier(
	providerId: string,
	identifierId: string
) {
	return vendorCoreApi.deleteProviderIdentifier(providerId, identifierId);
}

export async function listProviderRosters(params?: ProviderRosterListQuery) {
	const page = await vendorCoreApi.listProviderRosters(params);
	return page.results ?? [];
}

export async function createProviderRoster(body: ProviderRosterCreateInput) {
	return vendorCoreApi.createProviderRoster(body);
}

export async function updateProviderRoster(
	id: string,
	body: ProviderRosterUpdateInput
) {
	return vendorCoreApi.updateProviderRoster(id, body);
}

export async function recountProviderRoster(id: string) {
	return vendorCoreApi.recountProviderRoster(id);
}

export async function deleteProviderRoster(id: string) {
	return vendorCoreApi.deleteProviderRoster(id);
}

export async function restoreProviderRoster(id: string) {
	return vendorCoreApi.restoreProviderRoster(id);
}

export async function hardDeleteProviderRoster(id: string) {
	return vendorCoreApi.hardDeleteProviderRoster(id);
}
