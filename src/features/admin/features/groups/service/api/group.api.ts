import { apiClient } from "@/lib/api/client";
import { isMockEnabled, isNestApiEnabled } from "@/lib/mock-mode";
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

async function fetchNestList(): Promise<ApiIdentityGroupDto[]> {
	const res = await apiClient<ApiGroupListResponseDto | ApiIdentityGroupDto[]>(
		groupEndpoints.list()
	);
	return Array.isArray(res) ? res : (res.results ?? []);
}

async function fetchRemoteList(): Promise<ApiIdentityGroupDto[]> {
	if (isNestApiEnabled()) {
		return fetchNestList();
	}
	const page = await vendorCoreApi.listAllIdentityGroups();
	return (page.results ?? []).map(coreDtoToApiDto);
}

async function fetchRemoteDetail(id: string): Promise<ApiIdentityGroupDto> {
	if (isNestApiEnabled()) {
		return apiClient<ApiIdentityGroupDto>(groupEndpoints.detail(id));
	}
	return coreDtoToApiDto(await vendorCoreApi.getIdentityGroup(id));
}

async function createRemote(
	payload: GroupCreateDto
): Promise<ApiIdentityGroupDto> {
	if (isNestApiEnabled()) {
		return apiClient<ApiIdentityGroupDto>(groupEndpoints.create(), {
			method: "POST",
			body: JSON.stringify(payload),
		});
	}
	return coreDtoToApiDto(
		await vendorCoreApi.createIdentityGroup(payload as IdentityGroupCreateInput)
	);
}

async function updateRemote(
	id: string,
	payload: GroupUpdateDto
): Promise<ApiIdentityGroupDto> {
	if (isNestApiEnabled()) {
		return apiClient<ApiIdentityGroupDto>(groupEndpoints.update(id), {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
	}
	return coreDtoToApiDto(
		await vendorCoreApi.updateIdentityGroup(
			id,
			payload as IdentityGroupUpdateInput
		)
	);
}

async function removeRemote(id: string): Promise<void> {
	if (isNestApiEnabled()) {
		await apiClient<void>(groupEndpoints.delete(id), { method: "DELETE" });
		return;
	}
	await vendorCoreApi.deleteIdentityGroup(id);
}

export const groupApi = {
	async list(): Promise<GroupModel[]> {
		const dtos = isMockEnabled() ? MOCK_GROUPS : await fetchRemoteList();
		return toGroupModelList(dtos);
	},

	async getById(id: string): Promise<GroupModel | null> {
		const dto = isMockEnabled()
			? (MOCK_GROUPS.find((g) => String(g.id) === id) ?? null)
			: await fetchRemoteDetail(id).catch(() => null);
		if (!dto) return null;
		return toGroupModel(dto);
	},

	async create(payload: GroupCreateDto): Promise<GroupModel> {
		const dto = isMockEnabled()
			? ({
					...payload,
					id: `grp-${Date.now()}`,
					sync_status: "pending",
					updated_at: new Date().toISOString(),
					is_active: true,
				} satisfies ApiIdentityGroupDto)
			: await createRemote(payload);
		const model = toGroupModel(dto);
		if (!model) throw new Error("Invalid create response");
		return model;
	},

	async update(id: string, payload: GroupUpdateDto): Promise<GroupModel> {
		const dto = isMockEnabled()
			? {
					...(MOCK_GROUPS.find((g) => String(g.id) === id) ?? {}),
					...payload,
					id,
				}
			: await updateRemote(id, payload);
		const model = toGroupModel(dto as ApiIdentityGroupDto);
		if (!model) throw new Error("Invalid update response");
		return model;
	},

	async remove(id: string): Promise<void> {
		if (isMockEnabled()) return;
		await removeRemote(id);
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
