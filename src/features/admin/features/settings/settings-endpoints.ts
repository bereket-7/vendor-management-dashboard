/** Admin API routes for settings. */
export const settingsEndpoints = {
	list: () => "/api/admin/settings/",
	detail: (id: string) => `/api/admin/settings/${id}/`,
	create: () => "/api/admin/settings/",
	update: (id: string) => `/api/admin/settings/${id}/`,
	delete: (id: string) => `/api/admin/settings/${id}/`,
} as const;
