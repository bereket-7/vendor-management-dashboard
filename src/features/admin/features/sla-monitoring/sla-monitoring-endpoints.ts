/** Admin API routes for sla-monitoring. */
export const slaMonitoringEndpoints = {
	list: () => "/api/admin/sla-monitoring/",
	detail: (id: string) => `/api/admin/sla-monitoring/${id}/`,
	create: () => "/api/admin/sla-monitoring/",
	update: (id: string) => `/api/admin/sla-monitoring/${id}/`,
	delete: (id: string) => `/api/admin/sla-monitoring/${id}/`,
} as const;
