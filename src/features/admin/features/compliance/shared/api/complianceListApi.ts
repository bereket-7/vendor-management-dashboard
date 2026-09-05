import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { complianceEndpoints } from "../../compliance-endpoints";

export { complianceEndpoints };

export type ComplianceListResponse = {
	results?: Record<string, unknown>[] | null;
	count?: number | null;
};

export async function listComplianceRecords(params?: Record<string, string>) {
	if (isVendorCoreLive()) {
		const page = await vendorCoreApi.listCertificates({
			limit: 100,
			vendor_id: params?.vendor_id,
			status: params?.status,
		});
		return { results: page.results ?? [], count: page.count ?? 0 };
	}
	return { results: [], count: 0 };
}

export async function getComplianceRecord(id: string) {
	if (isVendorCoreLive()) {
		const page = await vendorCoreApi.listCertificates({ limit: 100 });
		const match = (page.results ?? []).find((row) => String(row.id) === id);
		if (!match) throw new Error("Certificate not found.");
		return match;
	}
	throw new Error("Certificate detail requires the live API.");
}
