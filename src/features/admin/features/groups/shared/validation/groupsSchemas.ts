import { z } from "zod";

export const apiGroupsRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const groupsCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const groupsUpdateSchema = groupsCreateSchema.partial();

export function parseGroupsList(payload: unknown): {
	data: z.infer<typeof apiGroupsRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiGroupsRecordSchema).optional(),
			data: z.array(apiGroupsRecordSchema).optional(),
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
			.map((row) => apiGroupsRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
