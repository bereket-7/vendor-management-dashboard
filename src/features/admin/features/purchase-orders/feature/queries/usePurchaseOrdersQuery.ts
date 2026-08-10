"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getPurchaseOrders,
	listPurchaseOrders,
} from "../api/purchaseOrdersApi";
import { toPurchaseOrdersModel } from "../mappers/purchaseOrdersMappers";

export function usePurchaseOrdersQuery() {
	return useQuery({
		queryKey: ["admin", "purchase-orders", "list"],
		queryFn: async () => {
			const res = await listPurchaseOrders();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toPurchaseOrdersModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function usePurchaseOrdersDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "purchase-orders", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getPurchaseOrders(String(id));
			return toPurchaseOrdersModel(row);
		},
		retry: false,
	});
}
