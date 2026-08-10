/** Admin API routes for automations. */
export const automationsEndpoints = {
	list: () => "/api/admin/automations/",
	detail: (id: string) => `/api/admin/automations/${id}/`,
	create: () => "/api/admin/automations/",
	update: (id: string) => `/api/admin/automations/${id}/`,
	delete: (id: string) => `/api/admin/automations/${id}/`,
} as const;
