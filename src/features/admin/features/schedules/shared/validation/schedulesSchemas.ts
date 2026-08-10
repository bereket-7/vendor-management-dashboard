import { z } from "zod";

export const apiSchedulesRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const schedulesCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const schedulesUpdateSchema = schedulesCreateSchema.partial();

export function parseSchedulesList(payload: unknown): {
	data: z.infer<typeof apiSchedulesRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiSchedulesRecordSchema).optional(),
			data: z.array(apiSchedulesRecordSchema).optional(),
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
			.map((row) => apiSchedulesRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
