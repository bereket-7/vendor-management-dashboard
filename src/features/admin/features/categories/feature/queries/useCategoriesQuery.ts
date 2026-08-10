"use client";

import { useQuery } from "@tanstack/react-query";

import { getCategories, listCategories } from "../api/categoriesApi";
import { toCategoriesModel } from "../mappers/categoriesMappers";

export function useCategoriesQuery() {
	return useQuery({
		queryKey: ["admin", "categories", "list"],
		queryFn: async () => {
			const res = await listCategories();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toCategoriesModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useCategoriesDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "categories", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getCategories(String(id));
			return toCategoriesModel(row);
		},
		retry: false,
	});
}
