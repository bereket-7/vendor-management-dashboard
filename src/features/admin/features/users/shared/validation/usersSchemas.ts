import { z } from "zod";

export const apiUsersRecordSchema = z
	.object({
		id: z.union([z.string(), z.number()]).optional().nullable(),
		name: z.string().optional().nullable(),
	})
	.passthrough();

export const usersCreateSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

export const usersUpdateSchema = usersCreateSchema.partial();

export function parseUsersList(payload: unknown): {
	data: z.infer<typeof apiUsersRecordSchema>[];
	total: number;
} {
	const paginated = z
		.object({
			results: z.array(apiUsersRecordSchema).optional(),
			data: z.array(apiUsersRecordSchema).optional(),
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
			.map((row) => apiUsersRecordSchema.safeParse(row))
			.filter((r) => r.success)
			.map((r) => r.data);
		return { data: rows, total: rows.length };
	}

	return { data: [], total: 0 };
}
