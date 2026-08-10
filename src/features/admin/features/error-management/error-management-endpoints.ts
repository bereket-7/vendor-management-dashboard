/** Admin API routes for error-management. */
export const errorManagementEndpoints = {
	list: () => "/api/admin/error-management/",
	detail: (id: string) => `/api/admin/error-management/${id}/`,
	create: () => "/api/admin/error-management/",
	update: (id: string) => `/api/admin/error-management/${id}/`,
	delete: (id: string) => `/api/admin/error-management/${id}/`,
} as const;
