import { apiClient } from "@/lib/api/client";
import {
	isMockEnabled,
	isNestApiEnabled,
	withMockOrRemote,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { settingsEndpoints } from "../../settings-endpoints";
import type {
	ApiSettingsDto,
	SettingsCreateDto,
	SettingsUpdateDto,
} from "../dto/settingsDto";

export async function listSettings() {
	if (isMockEnabled()) return { results: [] as ApiSettingsDto[], count: 0 };
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		const page = await vendorCoreApi.listAllAppSettings();
		return { results: page.results ?? [], count: page.count ?? 0 };
	}
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiSettingsDto[]; count?: number }>(
				settingsEndpoints.list()
			)
	);
}

export async function getSettings(id: string) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.getAppSetting(id);
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSettingsDto>(settingsEndpoints.detail(id))
	);
}

export async function createSettings(body: SettingsCreateDto) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.createAppSetting({
			key: body.name,
			value: "",
			category: "general",
		});
	}
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
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.updateAppSetting(id, {
			value: body.name ?? "",
		});
	}
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
	if (isMockEnabled()) return undefined;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		await vendorCoreApi.deleteAppSetting(id);
		return;
	}
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(settingsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
