"use client";

import { useQuery } from "@tanstack/react-query";

import { getGroups, listGroups } from "../api/groupsApi";
import { toGroupsModel } from "../mappers/groupsMappers";

export function useGroupsQuery() {
	return useQuery({
		queryKey: ["admin", "groups", "list"],
		queryFn: async () => {
			const res = await listGroups();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toGroupsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useGroupsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "groups", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getGroups(String(id));
			return toGroupsModel(row);
		},
		retry: false,
	});
}
