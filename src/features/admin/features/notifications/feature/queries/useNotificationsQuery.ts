"use client";

import { useQuery } from "@tanstack/react-query";

import { getNotifications, listNotifications } from "../api/notificationsApi";
import { toNotificationsModel } from "../mappers/notificationsMappers";

export function useNotificationsQuery() {
	return useQuery({
		queryKey: ["admin", "notifications", "list"],
		queryFn: async () => {
			const res = await listNotifications();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toNotificationsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useNotificationsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "notifications", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getNotifications(String(id));
			return toNotificationsModel(row);
		},
		retry: false,
	});
}
