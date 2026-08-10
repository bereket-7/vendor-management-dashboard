/** Admin API routes for roles. */
export const rolesEndpoints = {
	list: () => "/api/admin/roles/",
	detail: (id: string) => `/api/admin/roles/${id}/`,
	create: () => "/api/admin/roles/",
	update: (id: string) => `/api/admin/roles/${id}/`,
	delete: (id: string) => `/api/admin/roles/${id}/`,
} as const;
