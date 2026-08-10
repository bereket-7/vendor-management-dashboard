import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import type {
	ApiIdentityGroupDto,
	GroupCreateDto,
	GroupUpdateDto,
} from "../../dto/group.dto";
import type { GroupModel } from "../../types/group.types";
import { toGroupModel, toGroupModelList } from "../mappers/group.mapper";
import { MOCK_GROUPS } from "./group.mock";

export const groupApi = {
	async list(): Promise<GroupModel[]> {
		const dtos = await withMockOrRemote(
			() => MOCK_GROUPS,
			() =>
				apiClient<ApiGroupListResponseDto | ApiIdentityGroupDto[]>(
					groupEndpoints.list()
				).then((res) => (Array.isArray(res) ? res : (res.results ?? [])))
		);
		return toGroupModelList(dtos);
	},

	async getById(id: string): Promise<GroupModel | null> {
		const dto = await withMockOrRemote(
			() => MOCK_GROUPS.find((g) => String(g.id) === id) ?? null,
			() => apiClient<ApiIdentityGroupDto>(groupEndpoints.detail(id))
		);
		if (!dto) return null;
		return toGroupModel(dto);
	},

	async create(payload: GroupCreateDto): Promise<GroupModel> {
		const dto = await withMockOrRemote(
			() => ({
				...payload,
				id: `grp-${Date.now()}`,
				sync_status: "pending",
				updated_at: new Date().toISOString(),
				is_active: true,
			}),
			() =>
				apiClient<ApiIdentityGroupDto>(groupEndpoints.create(), {
					method: "POST",
					body: JSON.stringify(payload),
				})
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid create response");
		return model;
	},

	async update(id: string, payload: GroupUpdateDto): Promise<GroupModel> {
		const dto = await withMockOrRemote(
			() => {
				const existing = MOCK_GROUPS.find((g) => String(g.id) === id);
				return { ...existing, ...payload, id };
			},
			() =>
				apiClient<ApiIdentityGroupDto>(groupEndpoints.update(id), {
					method: "PATCH",
					body: JSON.stringify(payload),
				})
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid update response");
		return model;
	},

	async remove(id: string): Promise<void> {
		await withMockOrRemote(
			() => undefined,
			() =>
				apiClient<void>(groupEndpoints.delete(id), {
					method: "DELETE",
				})
		);
	},
};
