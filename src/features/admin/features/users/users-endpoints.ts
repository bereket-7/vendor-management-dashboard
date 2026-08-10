/** Admin API routes for users. */
export const usersEndpoints = {
	list: () => "/api/admin/users/",
	detail: (id: string) => `/api/admin/users/${id}/`,
	create: () => "/api/admin/users/",
	update: (id: string) => `/api/admin/users/${id}/`,
	delete: (id: string) => `/api/admin/users/${id}/`,
} as const;
