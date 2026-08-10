import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { invoicesEndpoints } from "../../invoices-endpoints";
import type { ApiInvoicesRecordDto } from "../dto/invoicesRecordDto";

export { invoicesEndpoints };

export type InvoicesListResponse = {
	results?: ApiInvoicesRecordDto[] | null;
	count?: number | null;
};

export async function listInvoicesRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<InvoicesListResponse>(invoicesEndpoints.list(), { params })
	);
}

export async function getInvoicesRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiInvoicesRecordDto>(invoicesEndpoints.detail(id))
	);
}
