/** Admin API routes for sourcing. */
export const sourcingEndpoints = {
	list: () => "/api/admin/sourcing/",
	detail: (id: string) => `/api/admin/sourcing/${id}/`,
	create: () => "/api/admin/sourcing/",
	update: (id: string) => `/api/admin/sourcing/${id}/`,
	delete: (id: string) => `/api/admin/sourcing/${id}/`,
} as const;
