import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { invoicesEndpoints } from "../../invoices-endpoints";
import type {
	ApiInvoicesDto,
	InvoicesCreateDto,
	InvoicesUpdateDto,
} from "../dto/invoicesDto";

export async function listInvoices() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiInvoicesDto[]; count?: number }>(
				invoicesEndpoints.list()
			)
	);
}

export async function getInvoices(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiInvoicesDto>(invoicesEndpoints.detail(id))
	);
}

export async function createInvoices(body: InvoicesCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiInvoicesDto>(invoicesEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateInvoices(id: string, body: InvoicesUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiInvoicesDto>(invoicesEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteInvoices(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(invoicesEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
