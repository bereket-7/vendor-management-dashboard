import { apiClient } from "@/lib/api/client";
import {
	isMockEnabled,
	isNestApiEnabled,
	withMockOrRemote,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";
import type { CoreUserDto, LoginEventDto } from "@/lib/vendor-core/types";

import { usersEndpoints } from "../../users-endpoints";
import type {
	ApiUsersDto,
	UsersCreateDto,
	UsersUpdateDto,
} from "../dto/usersDto";

function slugUsername(name: string): string {
	return (
		name
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ".") || "user"
	);
}

function createBodyFromDto(body: UsersCreateDto): Record<string, unknown> {
	const username = slugUsername(body.name);
	return {
		username,
		email: `${username}@placeholder.local`,
		phone_number: 0,
		first_name: body.name,
		is_active: true,
	};
}

export async function listUsers() {
	if (isMockEnabled()) return { results: [] as ApiUsersDto[], count: 0 };
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		const page = await vendorCoreApi.listUsers();
		return { results: page.results ?? [], count: page.count ?? 0 };
	}
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiUsersDto[]; count?: number }>(
				usersEndpoints.list()
			)
	);
}

export async function getUsers(id: string) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.getUser(id);
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiUsersDto>(usersEndpoints.detail(id))
	);
}

export async function createUsers(body: UsersCreateDto) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.createUser(createBodyFromDto(body));
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiUsersDto>(usersEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateUsers(id: string, body: UsersUpdateDto) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		const patch: Record<string, unknown> = {};
		if (body.name) {
			patch.first_name = body.name;
			patch.username = slugUsername(body.name);
		}
		return vendorCoreApi.updateUser(id, patch);
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiUsersDto>(usersEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteUsers(id: string) {
	if (isMockEnabled()) return undefined;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		await vendorCoreApi.deleteUser(id);
		return;
	}
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(usersEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

export async function restoreUsers(id: string) {
	return vendorCoreApi.restoreUser(id);
}

export async function hardDeleteUsers(id: string) {
	return vendorCoreApi.hardDeleteUser(id);
}

export async function setUsersRoles(id: string, role_ids: string[]) {
	return vendorCoreApi.setUserRoles(id, { role_ids });
}

export async function listVendorCoreUsers(): Promise<CoreUserDto[]> {
	const page = await vendorCoreApi.listUsers();
	return page.results ?? [];
}

export async function listVendorCoreLoginEvents(
	scope: "all" | "me" | string = "all"
): Promise<LoginEventDto[]> {
	if (scope === "me") {
		const page = await vendorCoreApi.listMyLoginEvents();
		return page.results ?? [];
	}
	if (scope !== "all") {
		const page = await vendorCoreApi.listUserLoginEvents(scope);
		return page.results ?? [];
	}
	const page = await vendorCoreApi.listLoginEvents();
	return page.results ?? [];
}
