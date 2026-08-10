/** Admin API routes for activity. */
export const activityEndpoints = {
	list: () => "/api/admin/activity/",
	detail: (id: string) => `/api/admin/activity/${id}/`,
	create: () => "/api/admin/activity/",
	update: (id: string) => `/api/admin/activity/${id}/`,
	delete: (id: string) => `/api/admin/activity/${id}/`,
} as const;
