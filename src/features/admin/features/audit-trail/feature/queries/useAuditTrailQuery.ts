"use client";

import { useQuery } from "@tanstack/react-query";

import { getAuditTrail, listAuditTrail } from "../api/auditTrailApi";
import { toAuditTrailModel } from "../mappers/auditTrailMappers";

export function useAuditTrailQuery() {
	return useQuery({
		queryKey: ["admin", "audit-trail", "list"],
		queryFn: async () => {
			const res = await listAuditTrail();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toAuditTrailModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useAuditTrailDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "audit-trail", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getAuditTrail(String(id));
			return toAuditTrailModel(row);
		},
		retry: false,
	});
}
