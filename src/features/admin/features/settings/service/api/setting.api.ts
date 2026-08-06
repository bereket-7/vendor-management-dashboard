import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { AppSettingDto, PaginatedResult } from "@/lib/vendor-core/types";

import type { ApiSettingDto } from "../../dto/setting.dto";
import type { AppSettingModel } from "../../types/setting.types";
import { toSettingModelList } from "../mappers/setting.mapper";
import { MOCK_SETTINGS } from "./setting.mock";

function isMockDataEnabled(): boolean {
	return process.env.NEXT_PUBLIC_USE_MOCK_SETTINGS === "true";
}

function unwrapList<T>(res: PaginatedResult<T> | T[]): T[] {
	return Array.isArray(res) ? res : (res.results ?? []);
}

async function withMockFallback<T>(
	remote: () => Promise<T>,
	fallback: () => T
): Promise<T> {
	if (isMockDataEnabled()) return fallback();
	return remote();
}

export const settingApi = {
	async list(): Promise<AppSettingModel[]> {
		const dtos = await withMockFallback(
			() =>
				vendorCoreApi.listSettings().then((res) => {
					const rows = unwrapList(
						res as PaginatedResult<AppSettingDto> | AppSettingDto[]
					);
					return rows.map(
						(s): ApiSettingDto => ({
							id: s.id,
							key: s.key,
							value: s.value,
							category: s.category,
						})
					);
				}),
			() => MOCK_SETTINGS
		);
		return toSettingModelList(dtos);
	},
};
