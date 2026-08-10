/** Admin API routes for audit-trail. */
export const auditTrailEndpoints = {
	list: () => "/api/admin/audit-trail/",
	detail: (id: string) => `/api/admin/audit-trail/${id}/`,
	create: () => "/api/admin/audit-trail/",
	update: (id: string) => `/api/admin/audit-trail/${id}/`,
	delete: (id: string) => `/api/admin/audit-trail/${id}/`,
} as const;
