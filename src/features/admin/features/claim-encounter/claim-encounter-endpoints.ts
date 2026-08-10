/** Admin API routes for claim-encounter. */
export const claimEncounterEndpoints = {
	list: () => "/api/admin/claim-encounter/",
	detail: (id: string) => `/api/admin/claim-encounter/${id}/`,
	create: () => "/api/admin/claim-encounter/",
	update: (id: string) => `/api/admin/claim-encounter/${id}/`,
	delete: (id: string) => `/api/admin/claim-encounter/${id}/`,
} as const;
