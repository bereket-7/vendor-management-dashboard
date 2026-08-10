"use client";

import { useQuery } from "@tanstack/react-query";

import { getActivity, listActivity } from "../api/activityApi";
import { toActivityModel } from "../mappers/activityMappers";

export function useActivityQuery() {
	return useQuery({
		queryKey: ["admin", "activity", "list"],
		queryFn: async () => {
			const res = await listActivity();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toActivityModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useActivityDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "activity", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getActivity(String(id));
			return toActivityModel(row);
		},
		retry: false,
	});
}
