"use client";

import { useQuery } from "@tanstack/react-query";

import { getApprovals, listApprovals } from "../api/approvalsApi";
import { toApprovalsModel } from "../mappers/approvalsMappers";

export function useApprovalsQuery() {
	return useQuery({
		queryKey: ["admin", "approvals", "list"],
		queryFn: async () => {
			const res = await listApprovals();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toApprovalsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useApprovalsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "approvals", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getApprovals(String(id));
			return toApprovalsModel(row);
		},
		retry: false,
	});
}
