/** Admin API routes for reports. */
export const reportsEndpoints = {
	list: () => "/api/admin/reports/",
	detail: (id: string) => `/api/admin/reports/${id}/`,
	create: () => "/api/admin/reports/",
	update: (id: string) => `/api/admin/reports/${id}/`,
	delete: (id: string) => `/api/admin/reports/${id}/`,
} as const;
