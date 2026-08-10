import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { purchaseOrdersEndpoints } from "../../purchase-orders-endpoints";
import type {
	ApiPurchaseOrdersDto,
	PurchaseOrdersCreateDto,
	PurchaseOrdersUpdateDto,
} from "../dto/purchaseOrdersDto";

export async function listPurchaseOrders() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiPurchaseOrdersDto[]; count?: number }>(
				purchaseOrdersEndpoints.list()
			)
	);
}

export async function getPurchaseOrders(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiPurchaseOrdersDto>(purchaseOrdersEndpoints.detail(id))
	);
}

export async function createPurchaseOrders(body: PurchaseOrdersCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiPurchaseOrdersDto>(purchaseOrdersEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updatePurchaseOrders(
	id: string,
	body: PurchaseOrdersUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiPurchaseOrdersDto>(purchaseOrdersEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deletePurchaseOrders(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(purchaseOrdersEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
