/** Admin API routes for compliance. */
export const complianceEndpoints = {
	list: () => "/api/admin/compliance/",
	detail: (id: string) => `/api/admin/compliance/${id}/`,
	create: () => "/api/admin/compliance/",
	update: (id: string) => `/api/admin/compliance/${id}/`,
	delete: (id: string) => `/api/admin/compliance/${id}/`,
} as const;
