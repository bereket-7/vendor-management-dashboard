import { z } from "zod";

export const apiVendorsRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const vendorsCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const vendorsUpdateSchema = vendorsCreateSchema.partial();

export function parseVendorsList(payload: unknown): {
	data: z.infer<typeof apiVendorsRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiVendorsRecordSchema).optional(),
			data: z.array(apiVendorsRecordSchema).optional(),
			count: z.number().optional(),
			total: z.number().optional(),
		})
		.safeParse(payload);

	if (paginated.success) {
		const rows = paginated.data.results ?? paginated.data.data ?? [];
		return {
			data: rows,
			total: paginated.data.count ?? paginated.data.total ?? rows.length,
		};
	}

	if (Array.isArray(payload)) {
		const rows = payload
			.map((row) => apiVendorsRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
