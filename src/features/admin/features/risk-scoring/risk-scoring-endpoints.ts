/** Admin API routes for risk-scoring. */
export const riskScoringEndpoints = {
	list: () => "/api/admin/risk-scoring/",
	detail: (id: string) => `/api/admin/risk-scoring/${id}/`,
	create: () => "/api/admin/risk-scoring/",
	update: (id: string) => `/api/admin/risk-scoring/${id}/`,
	delete: (id: string) => `/api/admin/risk-scoring/${id}/`,
} as const;
