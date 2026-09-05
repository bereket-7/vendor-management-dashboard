import { apiClient } from "@/lib/api/client";
import {
	isMockEnabled,
	isNestApiEnabled,
	withMockOrRemote,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { rolesEndpoints } from "../../roles-endpoints";
import type {
	ApiRolesDto,
	RolesCreateDto,
	RolesUpdateDto,
} from "../dto/rolesDto";

function slugName(name: string): string {
	return (
		name
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_") || "role"
	);
}

export async function listRoles() {
	if (isMockEnabled()) return { results: [] as ApiRolesDto[], count: 0 };
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		const page = await vendorCoreApi.listAllRoles();
		return { results: page.results ?? [], count: page.count ?? 0 };
	}
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiRolesDto[]; count?: number }>(
				rolesEndpoints.list()
			)
	);
}

export async function getRoles(id: string) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.getRole(id);
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiRolesDto>(rolesEndpoints.detail(id))
	);
}

export async function createRoles(body: RolesCreateDto) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		return vendorCoreApi.createRole({
			name: slugName(body.name),
			display_name: body.name,
			permissions: [],
		});
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiRolesDto>(rolesEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateRoles(id: string, body: RolesUpdateDto) {
	if (isMockEnabled()) return { id: "mock" } as never;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		const patch: Record<string, unknown> = {};
		if (body.name) {
			patch.display_name = body.name;
			patch.name = slugName(body.name);
		}
		return vendorCoreApi.updateRole(id, patch);
	}
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiRolesDto>(rolesEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteRoles(id: string) {
	if (isMockEnabled()) return undefined;
	if (isVendorCoreLive() || !isNestApiEnabled()) {
		await vendorCoreApi.deleteRole(id);
		return;
	}
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(rolesEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}
