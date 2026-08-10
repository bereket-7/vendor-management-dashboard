/** Admin API routes for invoices. */
export const invoicesEndpoints = {
	list: () => "/api/admin/invoices/",
	detail: (id: string) => `/api/admin/invoices/${id}/`,
	create: () => "/api/admin/invoices/",
	update: (id: string) => `/api/admin/invoices/${id}/`,
	delete: (id: string) => `/api/admin/invoices/${id}/`,
} as const;
