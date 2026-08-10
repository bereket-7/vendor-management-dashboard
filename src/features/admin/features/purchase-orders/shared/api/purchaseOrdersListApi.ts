import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { purchaseOrdersEndpoints } from "../../purchase-orders-endpoints";
import type { ApiPurchaseOrdersRecordDto } from "../dto/purchaseOrdersRecordDto";

export { purchaseOrdersEndpoints };

export type PurchaseOrdersListResponse = {
	results?: ApiPurchaseOrdersRecordDto[] | null;
	count?: number | null;
};

export async function listPurchaseOrdersRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<PurchaseOrdersListResponse>(purchaseOrdersEndpoints.list(), {
				params,
			})
	);
}

export async function getPurchaseOrdersRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiPurchaseOrdersRecordDto>(purchaseOrdersEndpoints.detail(id))
	);
}
