/** Admin API routes for contracts. */
export const contractsEndpoints = {
	list: () => "/api/admin/contracts/",
	detail: (id: string) => `/api/admin/contracts/${id}/`,
	create: () => "/api/admin/contracts/",
	update: (id: string) => `/api/admin/contracts/${id}/`,
	delete: (id: string) => `/api/admin/contracts/${id}/`,
} as const;
