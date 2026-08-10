/** Admin API routes for purchase-orders. */
export const purchaseOrdersEndpoints = {
	list: () => "/api/admin/purchase-orders/",
	detail: (id: string) => `/api/admin/purchase-orders/${id}/`,
	create: () => "/api/admin/purchase-orders/",
	update: (id: string) => `/api/admin/purchase-orders/${id}/`,
	delete: (id: string) => `/api/admin/purchase-orders/${id}/`,
} as const;
