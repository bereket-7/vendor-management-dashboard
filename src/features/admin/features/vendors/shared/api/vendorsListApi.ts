import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { vendorsEndpoints } from "../../vendors-endpoints";
import type { ApiVendorsRecordDto } from "../dto/vendorsRecordDto";

export { vendorsEndpoints };

export type VendorsListResponse = {
	results?: ApiVendorsRecordDto[] | null;
	count?: number | null;
};

export async function listVendorsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<VendorsListResponse>(vendorsEndpoints.list(), { params })
	);
}

export async function getVendorsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiVendorsRecordDto>(vendorsEndpoints.detail(id))
	);
}
