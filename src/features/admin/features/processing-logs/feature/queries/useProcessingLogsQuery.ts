"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getProcessingLogs,
	listProcessingLogs,
} from "../api/processingLogsApi";
import { toProcessingLogsModel } from "../mappers/processingLogsMappers";

export function useProcessingLogsQuery() {
	return useQuery({
		queryKey: ["admin", "processing-logs", "list"],
		queryFn: async () => {
			const res = await listProcessingLogs();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toProcessingLogsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useProcessingLogsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "processing-logs", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getProcessingLogs(String(id));
			return toProcessingLogsModel(row);
		},
		retry: false,
	});
}
