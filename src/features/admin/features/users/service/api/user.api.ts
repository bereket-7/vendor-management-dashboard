import { apiClient } from "@/lib/api/client";
import {
	isMockEnabled,
	isNestApiEnabled,
	withMockOrRemote,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import {
	VendorCoreApiError,
	getStoredAccessToken,
	isVendorCoreLive,
} from "@/lib/vendor-core/client";

import type { ApiUserDto } from "../../dto/user.dto";
import type { UserModel } from "../../types/user.types";
import { toUserModelList } from "../mappers/user.mapper";
import { MOCK_USERS } from "./user.mock";

async function listFromVendorCore(): Promise<UserModel[]> {
	if (!getStoredAccessToken()) return [];
	try {
		const page = await vendorCoreApi.listUsers();
		return toUserModelList(page.results ?? []);
	} catch (err) {
		if (
			err instanceof VendorCoreApiError &&
			(err.status === 401 || err.status === 403)
		) {
			return [];
		}
		throw err;
	}
}

export const userApi = {
	async list(): Promise<UserModel[]> {
		if (isMockEnabled()) return toUserModelList(MOCK_USERS);
		if (isVendorCoreLive()) return listFromVendorCore();
		if (isNestApiEnabled()) {
			const res = await apiClient<ApiUserListResponseDto | ApiUserDto[]>(
				userEndpoints.list()
			);
			return toUserModelList(Array.isArray(res) ? res : (res.results ?? []));
		}
		return withMockOrRemote(
			() => toUserModelList(MOCK_USERS),
			async () => [],
			[]
		);
	},
};
