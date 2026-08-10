/** Admin API routes for notifications. */
export const notificationsEndpoints = {
	list: () => "/api/admin/notifications/",
	detail: (id: string) => `/api/admin/notifications/${id}/`,
	create: () => "/api/admin/notifications/",
	update: (id: string) => `/api/admin/notifications/${id}/`,
	delete: (id: string) => `/api/admin/notifications/${id}/`,
} as const;
