import { apiClient } from "@/lib/api/client";
import { isMockEnabled, isNestApiEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { AppSettingDto } from "@/lib/vendor-core/types";

import type {
	ApiSettingDto,
	ApiSettingListResponseDto,
} from "../../dto/setting.dto";
import type { AppSettingModel } from "../../types/setting.types";
import { toSettingModel, toSettingModelList } from "../mappers/setting.mapper";
import { settingEndpoints } from "./setting.endpoints";
import { MOCK_SETTINGS } from "./setting.mock";

function coreDtoToApiDto(dto: AppSettingDto): ApiSettingDto {
	return {
		id: dto.id,
		key: dto.key,
		value: dto.value,
		value_type: dto.value_type,
		category: dto.category,
		description: dto.description,
		is_secret: dto.is_secret,
	};
}

async function fetchNestList(): Promise<ApiSettingDto[]> {
	const res = await apiClient<ApiSettingListResponseDto | ApiSettingDto[]>(
		settingEndpoints.list()
	);
	return Array.isArray(res) ? res : (res.results ?? []);
}

async function fetchRemoteList(): Promise<ApiSettingDto[]> {
	if (isNestApiEnabled()) {
		return fetchNestList();
	}
	const page = await vendorCoreApi.listAllAppSettings();
	return (page.results ?? []).map(coreDtoToApiDto);
}

export const settingApi = {
	async list(): Promise<AppSettingModel[]> {
		const dtos = isMockEnabled() ? MOCK_SETTINGS : await fetchRemoteList();
		return toSettingModelList(dtos);
	},

	async getById(id: string): Promise<AppSettingModel | null> {
		if (isMockEnabled()) {
			return toSettingModelList(MOCK_SETTINGS).find((s) => s.id === id) ?? null;
		}
		try {
			return (
				toSettingModel(
					coreDtoToApiDto(await vendorCoreApi.getAppSetting(id))
				) ?? null
			);
		} catch {
			return null;
		}
	},

	async create(input: {
		key: string;
		value: string;
		category: string;
		valueType?: string;
		description?: string | null;
		isSecret?: boolean;
	}): Promise<AppSettingModel> {
		if (isMockEnabled()) {
			const model = toSettingModel({
				id: `setting-${Date.now()}`,
				key: input.key,
				value: input.value,
				category: input.category,
				value_type: input.valueType,
				description: input.description,
				is_secret: input.isSecret,
			});
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		const model = toSettingModel(
			coreDtoToApiDto(
				await vendorCoreApi.createAppSetting({
					key: input.key,
					value: input.value,
					category: input.category,
					value_type: input.valueType,
					description: input.description,
					is_secret: input.isSecret,
				})
			)
		);
		if (!model) throw new Error("Invalid create response");
		return model;
	},

	async update(
		id: string,
		input: {
			value?: string;
			category?: string;
			valueType?: string;
			description?: string | null;
			isSecret?: boolean;
		}
	): Promise<AppSettingModel> {
		if (isMockEnabled()) {
			const existing = MOCK_SETTINGS.find((s) => String(s.id) === id);
			const model = toSettingModel({
				...(existing ?? { id, key: "key", value: "", category: "general" }),
				value: input.value,
				category: input.category,
				value_type: input.valueType,
				description: input.description,
				is_secret: input.isSecret,
			} as ApiSettingDto);
			if (!model) throw new Error("Invalid update response");
			return model;
		}
		const model = toSettingModel(
			coreDtoToApiDto(
				await vendorCoreApi.updateAppSetting(id, {
					value: input.value,
					category: input.category,
					value_type: input.valueType,
					description: input.description,
					is_secret: input.isSecret,
				})
			)
		);
		if (!model) throw new Error("Invalid update response");
		return model;
	},

	async remove(id: string): Promise<void> {
		if (isMockEnabled()) return;
		await vendorCoreApi.deleteAppSetting(id);
	},
};
