import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { notificationsEndpoints } from "../../notifications-endpoints";
import type { ApiNotificationsRecordDto } from "../dto/notificationsRecordDto";

export { notificationsEndpoints };

export type NotificationsListResponse = {
	results?: ApiNotificationsRecordDto[] | null;
	count?: number | null;
};

export async function listNotificationsRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<NotificationsListResponse>(notificationsEndpoints.list(), {
				params,
			})
	);
}

export async function getNotificationsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiNotificationsRecordDto>(notificationsEndpoints.detail(id))
	);
}
