"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getProcessingStatus,
	listProcessingStatus,
} from "../api/processingStatusApi";
import { toProcessingStatusModel } from "../mappers/processingStatusMappers";

export function useProcessingStatusQuery() {
	return useQuery({
		queryKey: ["admin", "processing-status", "list"],
		queryFn: async () => {
			const res = await listProcessingStatus();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toProcessingStatusModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useProcessingStatusDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "processing-status", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getProcessingStatus(String(id));
			return toProcessingStatusModel(row);
		},
		retry: false,
	});
}
