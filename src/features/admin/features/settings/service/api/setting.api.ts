import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import type { ApiSettingDto } from "../../dto/setting.dto";
import type { AppSettingModel } from "../../types/setting.types";
import { toSettingModelList } from "../mappers/setting.mapper";
import { MOCK_SETTINGS } from "./setting.mock";

export const settingApi = {
	async list(): Promise<AppSettingModel[]> {
		const dtos = await withMockOrRemote(
			() => MOCK_SETTINGS,
			() =>
				apiClient<ApiSettingListResponseDto | ApiSettingDto[]>(
					settingEndpoints.list()
				).then((res) => (Array.isArray(res) ? res : (res.results ?? [])))
		);
		return toSettingModelList(dtos);
	},
};
