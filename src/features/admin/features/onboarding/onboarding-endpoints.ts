/** Admin API routes for onboarding. */
export const onboardingEndpoints = {
	list: () => "/api/admin/onboarding/",
	detail: (id: string) => `/api/admin/onboarding/${id}/`,
	create: () => "/api/admin/onboarding/",
	update: (id: string) => `/api/admin/onboarding/${id}/`,
	delete: (id: string) => `/api/admin/onboarding/${id}/`,
} as const;
