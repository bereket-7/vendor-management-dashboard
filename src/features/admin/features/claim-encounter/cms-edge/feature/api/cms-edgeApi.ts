/** CMS EDGE analytics + pharmacy / medical claim live reads. */
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { PharmacyClaimRowListQuery } from "@/lib/vendor-core/types";

import {
	type CmsEdgeMedicalClaimGroup,
	claimLineDtosToMedicalClaimGroups,
	deriveMedicalClaimKpis,
	medicalMockRowsToGroups,
} from "../../live-medical-claims";
import {
	type CmsEdgePharmacyClaimDetailView,
	derivePharmacyClaimKpis,
	pharmacyClaimRowDetailDtoToView,
	pharmacyClaimRowListDtosToRows,
} from "../../live-pharmacy-claims";
import * as mock from "../../mock-data";
import type { CmsEdgePharmacyClaimRow } from "../../mock-data";

export async function listAuditRequests() {
	if (isMockEnabled()) return mock.CMS_EDGE_AUDIT_REQUESTS;
	return [];
}

export async function listAuditReports() {
	if (isMockEnabled()) return mock.CMS_EDGE_AUDIT_REPORTS;
	return [];
}

export async function listSubmissionHistory() {
	if (isMockEnabled()) return mock.CMS_EDGE_SUBMISSION_HISTORY;
	return [];
}

export async function listCmsResponses() {
	if (isMockEnabled()) return mock.CMS_EDGE_RESPONSES_LIST;
	return [];
}

export async function listDocumentLibrary() {
	if (isMockEnabled()) return mock.CMS_EDGE_DOCUMENT_LIBRARY;
	return [];
}

export type ListPharmacyClaimsParams = {
	claim_no?: string;
	cardholder_id?: string;
	search?: string;
	limit?: number;
	offset?: number;
};

export type ListPharmacyClaimsResult = {
	items: CmsEdgePharmacyClaimRow[];
	total: number;
	kpis: ReturnType<typeof derivePharmacyClaimKpis>;
};

export async function listPharmacyClaims(
	params: ListPharmacyClaimsParams = {}
): Promise<ListPharmacyClaimsResult> {
	if (isMockEnabled()) {
		const items = [...mock.CMS_EDGE_PHARMACY_CLAIMS_LIST];
		return {
			items,
			total: items.length,
			kpis: derivePharmacyClaimKpis(items),
		};
	}

	const query: PharmacyClaimRowListQuery = {
		limit: params.limit ?? 100,
		offset: params.offset ?? 0,
		ordering: "-created_at",
	};

	const search = params.search?.trim();
	if (params.claim_no) {
		query.claim_no = params.claim_no;
	} else if (params.cardholder_id) {
		query.cardholder_id = params.cardholder_id;
	} else if (search) {
		if (/^clm|pcl|rx|claim/i.test(search) || search.includes("-")) {
			query.claim_no = search;
		} else {
			query.cardholder_id = search;
		}
	}

	const page = await vendorCoreApi.listPharmacyClaimRows(query);
	const items = pharmacyClaimRowListDtosToRows(page.results ?? []);
	return {
		items,
		total: page.count ?? items.length,
		kpis: derivePharmacyClaimKpis(items),
	};
}

export async function getPharmacyClaim(
	id: string
): Promise<CmsEdgePharmacyClaimDetailView | null> {
	if (isMockEnabled()) {
		const base = mock.CMS_EDGE_PHARMACY_CLAIM_DETAIL;
		const match = mock.CMS_EDGE_PHARMACY_CLAIMS_LIST.find(
			(row) => row.id === id
		);
		return {
			...base,
			id: match?.id ?? base.id,
			claimId: match?.claimId ?? base.claimId,
			sourceFileName: "BHP_PHARM_MOCK.dat",
		} as unknown as CmsEdgePharmacyClaimDetailView;
	}

	const row = await vendorCoreApi.getPharmacyClaimRow(id);
	let sourceFileName = "—";
	if (row.file_id) {
		try {
			const file = await vendorCoreApi.getPharmacyClaimFile(row.file_id);
			sourceFileName = file.original_filename || file.reference_id || "—";
		} catch {
			sourceFileName = "—";
		}
	}
	return pharmacyClaimRowDetailDtoToView(row, sourceFileName);
}

export type ListMedicalClaimsResult = {
	items: CmsEdgeMedicalClaimGroup[];
	total: number;
	kpis: ReturnType<typeof deriveMedicalClaimKpis>;
};

export async function listMedicalClaims(): Promise<ListMedicalClaimsResult> {
	if (isMockEnabled()) {
		const items = medicalMockRowsToGroups(mock.CMS_EDGE_MEDICAL_CLAIMS_LIST);
		return {
			items,
			total: items.length,
			kpis: deriveMedicalClaimKpis(items),
		};
	}

	const page = await vendorCoreApi.listClaimLines();
	const items = claimLineDtosToMedicalClaimGroups(page.results ?? []);
	return {
		items,
		total: items.length,
		kpis: deriveMedicalClaimKpis(items),
	};
}

export async function seedPharmacyClaims(body?: {
	vendor_id?: string;
	count?: number;
	force?: boolean;
}) {
	if (isMockEnabled()) {
		return {
			created: 0,
			skipped: true,
			existing_rows: mock.CMS_EDGE_PHARMACY_CLAIMS_LIST.length,
		};
	}
	return vendorCoreApi.seedPharmacyClaimRows(body);
}
