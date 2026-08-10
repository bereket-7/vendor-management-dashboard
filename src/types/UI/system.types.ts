export type AdminModuleId = "vendor_management" | "claim_encounter";

export type ProgramFileType = "MDH" | "DHCF" | "BHP";

export interface SidebarNavItem {
	title: string;
	href?: string;
	/** ABAC component resource name for `hasComponentAccess` */
	permission?: string;
	/** Sidebar section group key (overview, procurement, governance, …) */
	section?: string;
	/** Admin module this nav item belongs to */
	module?: AdminModuleId;
	/**
	 * UI prototype — no Django `/api/v1` surface yet.
	 * Shown in nav for demos; live mode still uses fixtures or empty states.
	 */
	prototype?: boolean;
	items?: SidebarNavItem[];
}
