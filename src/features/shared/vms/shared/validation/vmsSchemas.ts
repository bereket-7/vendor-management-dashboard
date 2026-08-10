import { z } from "zod";

export const apiVmsRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const vmsCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const vmsUpdateSchema = vmsCreateSchema.partial();

export function parseVmsList(payload: unknown): {
	data: z.infer<typeof apiVmsRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiVmsRecordSchema).optional(),
			data: z.array(apiVmsRecordSchema).optional(),
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
			.map((row) => apiVmsRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
