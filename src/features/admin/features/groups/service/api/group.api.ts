import { isMockEnabled, isNestApiEnabled, isLiveIntegrationEnabled } from "@/lib/mock-mode";
import { apiClient } from "@/lib/api/client";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import type {
	ApiGroupListResponseDto,
	ApiIdentityGroupDto,
	GroupCreateDto,
	GroupUpdateDto,
} from "../../dto/group.dto";
import type { GroupModel } from "../../types/group.types";
import { toGroupModel, toGroupModelList } from "../mappers/group.mapper";
import { MOCK_GROUPS } from "./group.mock";
import { groupEndpoints } from "./group.endpoints";

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
			const dto = (await vendorCoreApi.createIdentityGroup(
				payload as unknown as Record<string, unknown>
			)) as ApiIdentityGroupDto;
			const model = toGroupModel(dto);
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		if (isNestApiEnabled()) {
			const dto = await apiClient<ApiIdentityGroupDto>(groupEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(payload),
			});
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
			const dto = (await vendorCoreApi.updateIdentityGroup(
				id,
				payload as unknown as Record<string, unknown>
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
};
