/** Admin API routes for schedules. */
export const schedulesEndpoints = {
	list: () => "/api/admin/schedules/",
	detail: (id: string) => `/api/admin/schedules/${id}/`,
	create: () => "/api/admin/schedules/",
	update: (id: string) => `/api/admin/schedules/${id}/`,
	delete: (id: string) => `/api/admin/schedules/${id}/`,
} as const;
