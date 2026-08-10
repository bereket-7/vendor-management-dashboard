import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import type { ApiRoleDto } from "../../dto/role.dto";
import type { RoleModel } from "../../types/role.types";
import { toRoleModelList } from "../mappers/role.mapper";
import { MOCK_ROLES } from "./role.mock";

export const roleApi = {
	async list(): Promise<RoleModel[]> {
		const dtos = await withMockOrRemote(
			() => MOCK_ROLES,
			() =>
				apiClient<ApiRoleListResponseDto | ApiRoleDto[]>(
					roleEndpoints.list()
				).then((res) => (Array.isArray(res) ? res : (res.results ?? [])))
		);
		return toRoleModelList(dtos);
	},
};
