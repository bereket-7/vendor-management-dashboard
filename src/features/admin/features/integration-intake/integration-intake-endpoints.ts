/** Admin API routes for integration-intake. */
export const integrationIntakeEndpoints = {
	list: () => "/api/admin/integration-intake/",
	detail: (id: string) => `/api/admin/integration-intake/${id}/`,
	create: () => "/api/admin/integration-intake/",
	update: (id: string) => `/api/admin/integration-intake/${id}/`,
	delete: (id: string) => `/api/admin/integration-intake/${id}/`,
} as const;
