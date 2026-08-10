import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { settingsEndpoints } from "../../settings-endpoints";
import type {
	ApiSettingsDto,
	SettingsCreateDto,
	SettingsUpdateDto,
} from "../dto/settingsDto";

export async function listSettings() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiSettingsDto[]; count?: number }>(
				settingsEndpoints.list()
			)
	);
}

export async function getSettings(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSettingsDto>(settingsEndpoints.detail(id))
	);
}

export async function createSettings(body: SettingsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSettingsDto>(settingsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateSettings(id: string, body: SettingsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSettingsDto>(settingsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteSettings(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(settingsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
