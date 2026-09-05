import { apiClient } from "@/lib/api/client";
import { isMockEnabled, isNestApiEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { RoleDto } from "@/lib/vendor-core/types";

import type { ApiRoleDto, ApiRoleListResponseDto } from "../../dto/role.dto";
import type { RoleModel } from "../../types/role.types";
import { toRoleModel, toRoleModelList } from "../mappers/role.mapper";
import { roleEndpoints } from "./role.endpoints";
import { MOCK_ROLES } from "./role.mock";

function coreDtoToApiDto(dto: RoleDto): ApiRoleDto {
	return {
		id: dto.id,
		name: dto.name,
		display_name: dto.display_name,
		description: dto.description,
		permissions: dto.permissions,
		is_system_role: dto.is_system_role,
	};
}

async function fetchNestList(): Promise<ApiRoleDto[]> {
	const res = await apiClient<ApiRoleListResponseDto | ApiRoleDto[]>(
		roleEndpoints.list()
	);
	return Array.isArray(res) ? res : (res.results ?? []);
}

async function fetchRemoteList(): Promise<ApiRoleDto[]> {
	if (isNestApiEnabled()) {
		return fetchNestList();
	}
	const page = await vendorCoreApi.listAllRoles();
	return (page.results ?? []).map(coreDtoToApiDto);
}

export const roleApi = {
	async list(): Promise<RoleModel[]> {
		const dtos = isMockEnabled() ? MOCK_ROLES : await fetchRemoteList();
		return toRoleModelList(dtos);
	},

	async getById(id: string): Promise<RoleModel | null> {
		try {
			const dto = isMockEnabled()
				? (MOCK_ROLES.find((r) => String(r.id) === id) ?? null)
				: isNestApiEnabled()
					? ((await fetchNestList()).find((r) => String(r.id) === id) ?? null)
					: coreDtoToApiDto(await vendorCoreApi.getRole(id));
			if (!dto) return null;
			return toRoleModel(dto);
		} catch {
			return null;
		}
	},

	async create(input: {
		name: string;
		displayName?: string;
		description?: string | null;
		permissions?: string[];
	}): Promise<RoleModel> {
		if (isMockEnabled()) {
			const model = toRoleModel({
				id: `role-${Date.now()}`,
				name: input.name,
				display_name: input.displayName ?? input.name,
				description: input.description,
				permissions: input.permissions ?? [],
				is_system_role: false,
			});
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		const dto = coreDtoToApiDto(
			await vendorCoreApi.createRole({
				name: input.name,
				display_name: input.displayName ?? input.name,
				description: input.description,
				permissions: input.permissions,
			})
		);
		const model = toRoleModel(dto);
		if (!model) throw new Error("Invalid create response");
		return model;
	},

	async update(
		id: string,
		input: {
			name?: string;
			displayName?: string;
			description?: string | null;
			permissions?: string[];
		}
	): Promise<RoleModel> {
		if (isMockEnabled()) {
			const existing = MOCK_ROLES.find((r) => String(r.id) === id);
			const model = toRoleModel({
				...(existing ?? { id, name: input.name ?? "role", permissions: [] }),
				display_name: input.displayName ?? input.name ?? existing?.display_name,
				description: input.description,
				permissions: input.permissions,
			} as ApiRoleDto);
			if (!model) throw new Error("Invalid update response");
			return model;
		}
		const dto = coreDtoToApiDto(
			await vendorCoreApi.updateRole(id, {
				name: input.name,
				display_name: input.displayName,
				description: input.description,
				permissions: input.permissions,
			})
		);
		const model = toRoleModel(dto);
		if (!model) throw new Error("Invalid update response");
		return model;
	},

	async remove(id: string): Promise<void> {
		if (isMockEnabled()) return;
		await vendorCoreApi.deleteRole(id);
	},
};
