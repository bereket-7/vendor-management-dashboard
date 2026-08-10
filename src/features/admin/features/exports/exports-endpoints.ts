/** Admin API routes for exports. */
export const exportsEndpoints = {
	list: () => "/api/admin/exports/",
	detail: (id: string) => `/api/admin/exports/${id}/`,
	create: () => "/api/admin/exports/",
	update: (id: string) => `/api/admin/exports/${id}/`,
	delete: (id: string) => `/api/admin/exports/${id}/`,
} as const;
