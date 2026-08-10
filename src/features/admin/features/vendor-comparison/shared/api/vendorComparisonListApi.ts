import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { vendorComparisonEndpoints } from "../../vendor-comparison-endpoints";
import type { ApiVendorComparisonRecordDto } from "../dto/vendorComparisonRecordDto";

export { vendorComparisonEndpoints };

export type VendorComparisonListResponse = {
	results?: ApiVendorComparisonRecordDto[] | null;
	count?: number | null;
};

export async function listVendorComparisonRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<VendorComparisonListResponse>(
				vendorComparisonEndpoints.list(),
				{ params }
			)
	);
}

export async function getVendorComparisonRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVendorComparisonRecordDto>(
				vendorComparisonEndpoints.detail(id)
			)
	);
}
