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

	async create(input: {
		username: string;
		email: string;
		phoneNumber?: number;
		firstName?: string;
		lastName?: string;
		password?: string;
	}): Promise<UserModel> {
		if (isMockEnabled()) {
			const model = toUserModelList([
				{
					id: `user-${Date.now()}`,
					username: input.username,
					email: input.email,
					first_name: input.firstName,
					last_name: input.lastName,
					is_active: true,
					phone_number: input.phoneNumber,
				},
			])[0];
			if (!model) throw new Error("Invalid create response");
			return model;
		}
		const dto = await vendorCoreApi.createUser({
			username: input.username,
			email: input.email,
			phone_number: input.phoneNumber ?? 0,
			first_name: input.firstName ?? "",
			last_name: input.lastName ?? "",
			password: input.password,
		});
		const model = toUserModelList([dto as ApiUserDto])[0];
		if (!model) throw new Error("Invalid create response");
		return model;
	},

	async update(id: string, input: Record<string, unknown>): Promise<UserModel> {
		const dto = await vendorCoreApi.updateUser(id, input);
		const model = toUserModelList([dto as ApiUserDto])[0];
		if (!model) throw new Error("Invalid update response");
		return model;
	},

	async remove(id: string): Promise<void> {
		if (isMockEnabled()) return;
		await vendorCoreApi.deleteUser(id);
	},
};
