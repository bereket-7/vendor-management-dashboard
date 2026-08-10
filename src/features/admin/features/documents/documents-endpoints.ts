/** Admin API routes for documents. */
export const documentsEndpoints = {
	list: () => "/api/admin/documents/",
	detail: (id: string) => `/api/admin/documents/${id}/`,
	create: () => "/api/admin/documents/",
	update: (id: string) => `/api/admin/documents/${id}/`,
	delete: (id: string) => `/api/admin/documents/${id}/`,
} as const;
