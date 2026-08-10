import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { vendorsEndpoints } from "../../vendors-endpoints";
import type {
	ApiVendorsDto,
	VendorsCreateDto,
	VendorsUpdateDto,
} from "../dto/vendorsDto";

export async function listVendors() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiVendorsDto[]; count?: number }>(
				vendorsEndpoints.list()
			)
	);
}

export async function getVendors(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiVendorsDto>(vendorsEndpoints.detail(id))
	);
}

export async function createVendors(body: VendorsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVendorsDto>(vendorsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateVendors(id: string, body: VendorsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVendorsDto>(vendorsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteVendors(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(vendorsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
