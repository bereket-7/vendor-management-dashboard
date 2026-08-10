import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { approvalsEndpoints } from "../../approvals-endpoints";
import type {
	ApiApprovalsDto,
	ApprovalsCreateDto,
	ApprovalsUpdateDto,
} from "../dto/approvalsDto";

export async function listApprovals() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiApprovalsDto[]; count?: number }>(
				approvalsEndpoints.list()
			)
	);
}

export async function getApprovals(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiApprovalsDto>(approvalsEndpoints.detail(id))
	);
}

export async function createApprovals(body: ApprovalsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiApprovalsDto>(approvalsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateApprovals(id: string, body: ApprovalsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiApprovalsDto>(approvalsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteApprovals(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(approvalsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
