"use client";

import { useQuery } from "@tanstack/react-query";

import { getUsers, listUsers } from "../api/usersApi";
import { toUsersModel } from "../mappers/usersMappers";

export function useUsersQuery() {
	return useQuery({
		queryKey: ["admin", "users", "list"],
		queryFn: async () => {
			const res = await listUsers();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toUsersModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useUsersDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "users", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getUsers(String(id));
			return toUsersModel(row);
		},
		retry: false,
	});
}
