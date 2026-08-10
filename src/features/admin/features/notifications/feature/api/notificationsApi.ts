import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { notificationsEndpoints } from "../../notifications-endpoints";
import type {
	ApiNotificationsDto,
	NotificationsCreateDto,
	NotificationsUpdateDto,
} from "../dto/notificationsDto";

export async function listNotifications() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiNotificationsDto[]; count?: number }>(
				notificationsEndpoints.list()
			)
	);
}

export async function getNotifications(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiNotificationsDto>(notificationsEndpoints.detail(id))
	);
}

export async function createNotifications(body: NotificationsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiNotificationsDto>(notificationsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateNotifications(
	id: string,
	body: NotificationsUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiNotificationsDto>(notificationsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteNotifications(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(notificationsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
