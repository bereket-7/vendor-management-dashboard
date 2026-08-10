/** Admin API routes for providers. */
export const providersEndpoints = {
	list: () => "/api/admin/providers/",
	detail: (id: string) => `/api/admin/providers/${id}/`,
	create: () => "/api/admin/providers/",
	update: (id: string) => `/api/admin/providers/${id}/`,
	delete: (id: string) => `/api/admin/providers/${id}/`,
} as const;
