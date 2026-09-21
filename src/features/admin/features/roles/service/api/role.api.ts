import { apiClient } from "@/lib/api/client";
import {
	isLiveIntegrationEnabled,
	isMockEnabled,
	isNestApiEnabled,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import type { ApiRoleDto, ApiRoleListResponseDto } from "../../dto/role.dto";
import type { RoleModel } from "../../types/role.types";
import { toRoleModelList } from "../mappers/role.mapper";
import { roleEndpoints } from "./role.endpoints";
import { MOCK_ROLES } from "./role.mock";

export const roleApi = {
	async list(): Promise<RoleModel[]> {
		if (isMockEnabled()) return toRoleModelList(MOCK_ROLES);
		if (isLiveIntegrationEnabled()) {
			const page = await vendorCoreApi.listRoles();
			return toRoleModelList((page.results ?? []) as ApiRoleDto[]);
		}
		if (isNestApiEnabled()) {
			const res = await apiClient<ApiRoleListResponseDto | ApiRoleDto[]>(
				roleEndpoints.list()
			);
			return toRoleModelList(Array.isArray(res) ? res : (res.results ?? []));
		}
		return [];
	},
};
