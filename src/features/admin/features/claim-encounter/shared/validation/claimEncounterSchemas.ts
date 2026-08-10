import { z } from "zod";

export const apiClaimEncounterRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const claimEncounterCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const claimEncounterUpdateSchema = claimEncounterCreateSchema.partial();

export function parseClaimEncounterList(payload: unknown): {
	data: z.infer<typeof apiClaimEncounterRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiClaimEncounterRecordSchema).optional(),
			data: z.array(apiClaimEncounterRecordSchema).optional(),
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
			.map((row) => apiClaimEncounterRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
