import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { vendorComparisonEndpoints } from "../../vendor-comparison-endpoints";
import type {
	ApiVendorComparisonDto,
	VendorComparisonCreateDto,
	VendorComparisonUpdateDto,
} from "../dto/vendorComparisonDto";

export async function listVendorComparison() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiVendorComparisonDto[]; count?: number }>(
				vendorComparisonEndpoints.list()
			)
	);
}

export async function getVendorComparison(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVendorComparisonDto>(vendorComparisonEndpoints.detail(id))
	);
}

export async function createVendorComparison(body: VendorComparisonCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVendorComparisonDto>(vendorComparisonEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateVendorComparison(
	id: string,
	body: VendorComparisonUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVendorComparisonDto>(vendorComparisonEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteVendorComparison(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(vendorComparisonEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
