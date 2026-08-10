/** Admin API routes for file-history. */
export const fileHistoryEndpoints = {
	list: () => "/api/admin/file-history/",
	detail: (id: string) => `/api/admin/file-history/${id}/`,
	create: () => "/api/admin/file-history/",
	update: (id: string) => `/api/admin/file-history/${id}/`,
	delete: (id: string) => `/api/admin/file-history/${id}/`,
} as const;
