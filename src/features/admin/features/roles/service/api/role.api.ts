import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { PaginatedResult, RoleDto } from "@/lib/vendor-core/types";

import type { ApiRoleDto } from "../../dto/role.dto";
import type { RoleModel } from "../../types/role.types";
import { toRoleModelList } from "../mappers/role.mapper";
import { MOCK_ROLES } from "./role.mock";

function isMockDataEnabled(): boolean {
	return process.env.NEXT_PUBLIC_USE_MOCK_ROLES === "true";
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

export const roleApi = {
	async list(): Promise<RoleModel[]> {
		const dtos = await withMockFallback(
			() =>
				vendorCoreApi.listRoles().then((res) => {
					const rows = unwrapList(res as PaginatedResult<RoleDto> | RoleDto[]);
					return rows.map(
						(r): ApiRoleDto => ({
							id: r.id,
							name: r.name,
							permissions: r.permissions ?? [],
						})
					);
				}),
			() => MOCK_ROLES
		);
		return toRoleModelList(dtos);
	},
};
