/** Admin API routes for identity groups — Django `/api/v1/`. */
export const groupEndpoints = {
	list: () => "/api/v1/identity-groups/",
	detail: (id: string) => `/api/v1/identity-groups/${id}/`,
	create: () => "/api/v1/identity-groups/",
	update: (id: string) => `/api/v1/identity-groups/${id}/`,
	delete: (id: string) => `/api/v1/identity-groups/${id}/`,
} as const;
