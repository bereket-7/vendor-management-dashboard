/** Admin API routes for performance. */
export const performanceEndpoints = {
	list: () => "/api/admin/performance/",
	detail: (id: string) => `/api/admin/performance/${id}/`,
	create: () => "/api/admin/performance/",
	update: (id: string) => `/api/admin/performance/${id}/`,
	delete: (id: string) => `/api/admin/performance/${id}/`,
} as const;
