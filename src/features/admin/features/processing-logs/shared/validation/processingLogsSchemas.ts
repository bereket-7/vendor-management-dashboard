import { z } from "zod";

export const apiProcessingLogsRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const processingLogsCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const processingLogsUpdateSchema = processingLogsCreateSchema.partial();

export function parseProcessingLogsList(payload: unknown): {
	data: z.infer<typeof apiProcessingLogsRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiProcessingLogsRecordSchema).optional(),
			data: z.array(apiProcessingLogsRecordSchema).optional(),
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
			.map((row) => apiProcessingLogsRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
