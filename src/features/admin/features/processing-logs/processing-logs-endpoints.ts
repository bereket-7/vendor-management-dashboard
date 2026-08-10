/** Admin API routes for processing-logs. */
export const processingLogsEndpoints = {
	list: () => "/api/admin/processing-logs/",
	detail: (id: string) => `/api/admin/processing-logs/${id}/`,
	create: () => "/api/admin/processing-logs/",
	update: (id: string) => `/api/admin/processing-logs/${id}/`,
	delete: (id: string) => `/api/admin/processing-logs/${id}/`,
} as const;
