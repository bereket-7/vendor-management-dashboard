import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { PaginatedResult } from "@/lib/vendor-core/types";

import type {
	ApiIdentityGroupDto,
	GroupCreateDto,
	GroupUpdateDto,
} from "../../dto/group.dto";
import type { GroupModel } from "../../types/group.types";
import { toGroupModel, toGroupModelList } from "../mappers/group.mapper";
import { MOCK_GROUPS } from "./group.mock";

function isMockDataEnabled(): boolean {
	return process.env.NEXT_PUBLIC_USE_MOCK_GROUPS === "true";
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

export const groupApi = {
	async list(): Promise<GroupModel[]> {
		const dtos = await withMockFallback(
			() =>
				vendorCoreApi
					.listIdentityGroups()
					.then((res) =>
						unwrapList(res as PaginatedResult<ApiIdentityGroupDto> | ApiIdentityGroupDto[])
					),
			() => MOCK_GROUPS
		);
		return toGroupModelList(dtos);
	},

	async getById(id: string): Promise<GroupModel | null> {
		const dto = await withMockFallback(
			() => vendorCoreApi.getIdentityGroup(id) as Promise<ApiIdentityGroupDto>,
			() => MOCK_GROUPS.find((g) => String(g.id) === id) ?? null
		);
		if (!dto) return null;
		return toGroupModel(dto);
	},

	async create(payload: GroupCreateDto): Promise<GroupModel> {
		const dto = await withMockFallback(
			() =>
				vendorCoreApi.createIdentityGroup(payload) as Promise<ApiIdentityGroupDto>,
			() => ({
				...payload,
				id: `grp-${Date.now()}`,
				sync_status: "pending",
				updated_at: new Date().toISOString(),
				is_active: true,
			})
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid create response");
		return model;
	},

	async update(id: string, payload: GroupUpdateDto): Promise<GroupModel> {
		const dto = await withMockFallback(
			() =>
				vendorCoreApi.updateIdentityGroup(
					id,
					payload
				) as Promise<ApiIdentityGroupDto>,
			() => {
				const existing = MOCK_GROUPS.find((g) => String(g.id) === id);
				return { ...existing, ...payload, id };
			}
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid update response");
		return model;
	},

	async remove(id: string): Promise<void> {
		await withMockFallback(
			() => vendorCoreApi.deleteIdentityGroup(id),
			() => undefined
		);
	},
};
