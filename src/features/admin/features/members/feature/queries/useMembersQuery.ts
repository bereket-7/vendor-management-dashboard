"use client";

import { useQuery } from "@tanstack/react-query";

import { getMembers, listMembers } from "../api/membersApi";
import { toMembersModel } from "../mappers/membersMappers";

export function useMembersQuery() {
	return useQuery({
		queryKey: ["admin", "members", "list"],
		queryFn: async () => {
			const res = await listMembers();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toMembersModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useMembersDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "members", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getMembers(String(id));
			return toMembersModel(row);
		},
		retry: false,
	});
}
