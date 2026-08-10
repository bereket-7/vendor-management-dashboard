/** Admin API routes for vms. */
export const vmsEndpoints = {
	list: () => "/api/admin/vms/",
	detail: (id: string) => `/api/admin/vms/${id}/`,
	create: () => "/api/admin/vms/",
	update: (id: string) => `/api/admin/vms/${id}/`,
	delete: (id: string) => `/api/admin/vms/${id}/`,
} as const;
