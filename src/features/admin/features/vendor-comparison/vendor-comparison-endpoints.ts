/** Admin API routes for vendor-comparison. */
export const vendorComparisonEndpoints = {
	list: () => "/api/admin/vendor-comparison/",
	detail: (id: string) => `/api/admin/vendor-comparison/${id}/`,
	create: () => "/api/admin/vendor-comparison/",
	update: (id: string) => `/api/admin/vendor-comparison/${id}/`,
	delete: (id: string) => `/api/admin/vendor-comparison/${id}/`,
} as const;
