"use client";

import { useQuery } from "@tanstack/react-query";

import { getSettings, listSettings } from "../api/settingsApi";
import { toSettingsModel } from "../mappers/settingsMappers";

export function useSettingsQuery() {
	return useQuery({
		queryKey: ["admin", "settings", "list"],
		queryFn: async () => {
			const res = await listSettings();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toSettingsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useSettingsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "settings", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getSettings(String(id));
			return toSettingsModel(row);
		},
		retry: false,
	});
}
