import { apiClient } from "@/lib/api/client";
import {
	isLiveIntegrationEnabled,
	isMockEnabled,
	isNestApiEnabled,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import type {
	ApiSettingDto,
	ApiSettingListResponseDto,
} from "../../dto/setting.dto";
import type { AppSettingModel } from "../../types/setting.types";
import { toSettingModelList } from "../mappers/setting.mapper";
import { MOCK_SETTINGS } from "./setting.mock";
import { settingEndpoints } from "./setting.endpoints";

export const settingApi = {
	async list(): Promise<AppSettingModel[]> {
		if (isMockEnabled()) return toSettingModelList(MOCK_SETTINGS);
		if (isLiveIntegrationEnabled()) {
			const page = await vendorCoreApi.listSettings();
			return toSettingModelList((page.results ?? []) as ApiSettingDto[]);
		}
		if (isNestApiEnabled()) {
			const res = await apiClient<
				ApiSettingListResponseDto | ApiSettingDto[]
			>(settingEndpoints.list());
			return toSettingModelList(
				Array.isArray(res) ? res : (res.results ?? [])
			);
		}
		return [];
	},
};
