import { apiClient } from "@/lib/api/client";
import {
	isLiveIntegrationEnabled,
	isMockEnabled,
	isNestApiEnabled,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type {
	IdentityGroupCreateInput,
	IdentityGroupDto,
	IdentityGroupUpdateInput,
} from "@/lib/vendor-core/types";

import type {
	ApiGroupListResponseDto,
	ApiIdentityGroupDto,
	GroupCreateDto,
	GroupUpdateDto,
} from "../../dto/group.dto";
import type { GroupModel } from "../../types/group.types";
import { toGroupModel, toGroupModelList } from "../mappers/group.mapper";
import { groupEndpoints } from "./group.endpoints";
import { MOCK_GROUPS } from "./group.mock";

function coreDtoToApiDto(dto: IdentityGroupDto): ApiIdentityGroupDto {
	return {
		id: dto.id,
		name: dto.name,
		description: dto.description,
		membership_mode: dto.membership_mode,
		members: dto.members,
		characteristics: dto.characteristics,
		period_start: dto.period_start,
		period_end: dto.period_end,
		is_active: dto.is_active,
		sync_status: dto.sync_status,
		updated_at: dto.updated_at,
	};
}

async function listFromVendorCore(): Promise<ApiIdentityGroupDto[]> {
	const page = await vendorCoreApi.listIdentityGroups();
	return (page.results ?? []) as ApiIdentityGroupDto[];
}

export const groupApi = {
	async list(): Promise<GroupModel[]> {
		if (isMockEnabled()) return toGroupModelList(MOCK_GROUPS);
		if (isLiveIntegrationEnabled()) {
			return toGroupModelList(await listFromVendorCore());
		}
		if (isNestApiEnabled()) {
			const res = await apiClient<
				ApiGroupListResponseDto | ApiIdentityGroupDto[]
			>(groupEndpoints.list());
			return toGroupModelList(Array.isArray(res) ? res : (res.results ?? []));
		}
		return [];
	},

	async getById(id: string): Promise<GroupModel | null> {
		if (isMockEnabled()) {
			const dto = MOCK_GROUPS.find((g) => String(g.id) === id) ?? null;
			return dto ? toGroupModel(dto) : null;
		}
		if (isLiveIntegrationEnabled()) {
			const dto = (await vendorCoreApi.getIdentityGroup(
				id
			)) as ApiIdentityGroupDto;
			return toGroupModel(dto);
		}
		if (isNestApiEnabled()) {
			const dto = await apiClient<ApiIdentityGroupDto>(
				groupEndpoints.detail(id)
			);
			return toGroupModel(dto);
		}
		return null;
	},

	async create(payload: GroupCreateDto): Promise<GroupModel> {
		if (isMockEnabled()) {
			const dto = {
				...payload,
				id: `grp-${Date.now()}`,
				sync_status: "pending",
				updated_at: new Date().toISOString(),
				is_active: true,
			};
			const model = toGroupModel(dto);
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		if (isLiveIntegrationEnabled()) {
			const body: IdentityGroupCreateInput = {
				name: payload.name,
				description: payload.description,
				membership_mode: payload.membership_mode,
				members: payload.members?.map((m) => ({
					external_id: m.external_id ?? undefined,
					display_name: m.display_name ?? m.external_id ?? "Member",
					role: m.role ?? undefined,
				})),
				characteristics: payload.characteristics?.map((c) => ({
					key: c.key ?? "",
					operator: c.operator ?? "eq",
					value: c.value,
				})),
				period_start: payload.period_start,
				period_end: payload.period_end,
			};
			const dto = (await vendorCoreApi.createIdentityGroup(
				body
			)) as ApiIdentityGroupDto;
			const model = toGroupModel(dto);
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		if (isNestApiEnabled()) {
			const dto = await apiClient<ApiIdentityGroupDto>(
				groupEndpoints.create(),
				{
					method: "POST",
					body: JSON.stringify(payload),
				}
			);
			const model = toGroupModel(dto);
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		throw new Error("Identity groups API unavailable");
	},

	async update(id: string, payload: GroupUpdateDto): Promise<GroupModel> {
		if (isMockEnabled()) {
			const existing = MOCK_GROUPS.find((g) => String(g.id) === id);
			const model = toGroupModel({ ...existing, ...payload, id });
			if (!model) throw new Error("Invalid update response");
			return model;
		}
		if (isLiveIntegrationEnabled()) {
			const body: IdentityGroupUpdateInput = {
				...(payload.name !== undefined ? { name: payload.name } : {}),
				...(payload.description !== undefined
					? { description: payload.description }
					: {}),
				...(payload.membership_mode !== undefined
					? { membership_mode: payload.membership_mode }
					: {}),
				...(payload.members !== undefined
					? {
							members: payload.members.map((m) => ({
								external_id: m.external_id ?? undefined,
								display_name: m.display_name ?? m.external_id ?? "Member",
								role: m.role ?? undefined,
							})),
						}
					: {}),
				...(payload.characteristics !== undefined
					? {
							characteristics: payload.characteristics.map((c) => ({
								key: c.key ?? "",
								operator: c.operator ?? "eq",
								value: c.value,
							})),
						}
					: {}),
				...(payload.period_start !== undefined
					? { period_start: payload.period_start }
					: {}),
				...(payload.period_end !== undefined
					? { period_end: payload.period_end }
					: {}),
			};
			const dto = (await vendorCoreApi.updateIdentityGroup(
				id,
				body
			)) as ApiIdentityGroupDto;
			const model = toGroupModel(dto);
			if (!model) throw new Error("Invalid update response");
			return model;
		}
		if (isNestApiEnabled()) {
			const dto = await apiClient<ApiIdentityGroupDto>(
				groupEndpoints.update(id),
				{
					method: "PATCH",
					body: JSON.stringify(payload),
				}
			);
			const model = toGroupModel(dto);
			if (!model) throw new Error("Invalid update response");
			return model;
		}
		throw new Error("Identity groups API unavailable");
	},

	async remove(id: string): Promise<void> {
		if (isMockEnabled()) return;
		if (isLiveIntegrationEnabled()) {
			await vendorCoreApi.deleteIdentityGroup(id);
			return;
		}
		if (isNestApiEnabled()) {
			await apiClient<void>(groupEndpoints.delete(id), {
				method: "DELETE",
			});
			return;
		}
		throw new Error("Identity groups API unavailable");
	},

	async addMembers(
		id: string,
		members: IdentityGroupCreateInput["members"]
	): Promise<GroupModel> {
		if (isMockEnabled()) {
			const model = await this.getById(id);
			if (!model) throw new Error("Group not found");
			return model;
		}
		const dto = coreDtoToApiDto(
			await vendorCoreApi.addIdentityGroupMembers(id, members ?? [])
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid add members response");
		return model;
	},

	async removeMembers(
		id: string,
		body: { member_ids?: string[]; external_ids?: string[] }
	): Promise<GroupModel> {
		if (isMockEnabled()) {
			const model = await this.getById(id);
			if (!model) throw new Error("Group not found");
			return model;
		}
		const dto = coreDtoToApiDto(
			await vendorCoreApi.removeIdentityGroupMembers(id, body)
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid remove members response");
		return model;
	},

	async linkMemberUser(
		id: string,
		body: { member_id: string; user_id: string }
	): Promise<GroupModel> {
		if (isMockEnabled()) {
			const model = await this.getById(id);
			if (!model) throw new Error("Group not found");
			return model;
		}
		const dto = coreDtoToApiDto(
			await vendorCoreApi.linkIdentityGroupMemberUser(id, body)
		);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid link member response");
		return model;
	},
};
