/** Admin API routes for groups. */
export const groupsEndpoints = {
	list: () => "/api/admin/groups/",
	detail: (id: string) => `/api/admin/groups/${id}/`,
	create: () => "/api/admin/groups/",
	update: (id: string) => `/api/admin/groups/${id}/`,
	delete: (id: string) => `/api/admin/groups/${id}/`,
} as const;
