/** Admin API routes for dashboard. */
export const dashboardEndpoints = {
	list: () => "/api/admin/dashboard/",
	detail: (id: string) => `/api/admin/dashboard/${id}/`,
	create: () => "/api/admin/dashboard/",
	update: (id: string) => `/api/admin/dashboard/${id}/`,
	delete: (id: string) => `/api/admin/dashboard/${id}/`,
} as const;
