"use client";

import { useQuery } from "@tanstack/react-query";

import { getRoles, listRoles } from "../api/rolesApi";
import { toRolesModel } from "../mappers/rolesMappers";

export function useRolesQuery() {
	return useQuery({
		queryKey: ["admin", "roles", "list"],
		queryFn: async () => {
			const res = await listRoles();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toRolesModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useRolesDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "roles", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getRoles(String(id));
			return toRolesModel(row);
		},
		retry: false,
	});
}
