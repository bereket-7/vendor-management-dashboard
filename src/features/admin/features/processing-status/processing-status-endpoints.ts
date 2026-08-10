/** Admin API routes for processing-status. */
export const processingStatusEndpoints = {
	list: () => "/api/admin/processing-status/",
	detail: (id: string) => `/api/admin/processing-status/${id}/`,
	create: () => "/api/admin/processing-status/",
	update: (id: string) => `/api/admin/processing-status/${id}/`,
	delete: (id: string) => `/api/admin/processing-status/${id}/`,
} as const;
