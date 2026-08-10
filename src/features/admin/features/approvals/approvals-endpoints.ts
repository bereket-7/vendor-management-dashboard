/** Admin API routes for approvals. */
export const approvalsEndpoints = {
	list: () => "/api/admin/approvals/",
	detail: (id: string) => `/api/admin/approvals/${id}/`,
	create: () => "/api/admin/approvals/",
	update: (id: string) => `/api/admin/approvals/${id}/`,
	delete: (id: string) => `/api/admin/approvals/${id}/`,
} as const;
