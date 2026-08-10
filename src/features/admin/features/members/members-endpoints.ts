/** Admin API routes for members. */
export const membersEndpoints = {
	list: () => "/api/admin/members/",
	detail: (id: string) => `/api/admin/members/${id}/`,
	create: () => "/api/admin/members/",
	update: (id: string) => `/api/admin/members/${id}/`,
	delete: (id: string) => `/api/admin/members/${id}/`,
} as const;
