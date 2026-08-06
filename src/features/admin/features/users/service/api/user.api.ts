import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { PaginatedResult, UserListDto } from "@/lib/vendor-core/types";

import type { ApiUserDto } from "../../dto/user.dto";
import type { UserModel } from "../../types/user.types";
import { toUserModelList } from "../mappers/user.mapper";
import { MOCK_USERS } from "./user.mock";

function isMockDataEnabled(): boolean {
	return process.env.NEXT_PUBLIC_USE_MOCK_USERS === "true";
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

export const userApi = {
	async list(): Promise<UserModel[]> {
		const dtos = await withMockFallback(
			() =>
				vendorCoreApi.listUsers().then((res) => {
					const rows = unwrapList(res as PaginatedResult<UserListDto> | UserListDto[]);
					return rows.map(
						(u): ApiUserDto => ({
							id: u.id,
							email: u.email,
							name: u.name ?? u.username ?? u.email,
							roles: u.roles ?? [],
							is_active: u.is_active ?? true,
						})
					);
				}),
			() => MOCK_USERS
		);
		return toUserModelList(dtos);
	},
};
