/** Admin API routes for categories. */
export const categoriesEndpoints = {
	list: () => "/api/admin/categories/",
	detail: (id: string) => `/api/admin/categories/${id}/`,
	create: () => "/api/admin/categories/",
	update: (id: string) => `/api/admin/categories/${id}/`,
	delete: (id: string) => `/api/admin/categories/${id}/`,
} as const;
