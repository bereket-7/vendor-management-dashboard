/** Admin API routes for file-management. */
export const fileManagementEndpoints = {
	list: () => "/api/admin/file-management/",
	detail: (id: string) => `/api/admin/file-management/${id}/`,
	create: () => "/api/admin/file-management/",
	update: (id: string) => `/api/admin/file-management/${id}/`,
	delete: (id: string) => `/api/admin/file-management/${id}/`,
} as const;
