/** Admin API routes for vendors. */
export const vendorsEndpoints = {
	list: () => "/api/admin/vendors/",
	detail: (id: string) => `/api/admin/vendors/${id}/`,
	create: () => "/api/admin/vendors/",
	update: (id: string) => `/api/admin/vendors/${id}/`,
	delete: (id: string) => `/api/admin/vendors/${id}/`,
} as const;
