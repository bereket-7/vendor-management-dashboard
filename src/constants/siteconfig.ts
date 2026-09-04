import {
	type AdminModuleId,
	type SidebarNavItem,
} from "@/types/UI/system.types";

const vendorManagementNav: SidebarNavItem[] = [
	{
		title: "Dashboard",
		href: "/",
		permission: "dashboard-view",
		section: "top",
		module: "vendor_management",
	},
	// Workspace
	{
		title: "My Work Queue",
		href: "/admin/my-work-queue",
		permission: "dashboard-view",
		section: "workspace",
		module: "vendor_management",
	},
	// Master Data
	{
		title: "Vendors",
		href: "/admin/vendors",
		permission: "vendors-list",
		section: "master_data",
		module: "vendor_management",
	},
	{
		title: "Members",
		href: "/admin/members",
		permission: "vendors-list",
		section: "master_data",
		module: "vendor_management",
	},
	{
		title: "Providers",
		href: "/admin/providers",
		permission: "vendors-list",
		section: "master_data",
		module: "vendor_management",
	},
	// Integration & File Operations
	{
		title: "Integration Intake",
		href: "/admin/integration",
		permission: "file-management-view",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	{
		title: "File Monitoring",
		href: "/admin/file-monitoring",
		permission: "file-management-view",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	{
		title: "Processing Status",
		href: "/admin/processing-status",
		permission: "file-management-view",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	{
		title: "File History",
		href: "/admin/file-history",
		permission: "file-management-view",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	{
		title: "File Management",
		href: "/admin/file-management",
		permission: "file-management-view",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	{
		title: "Schedules",
		href: "/admin/schedules",
		permission: "file-management-view",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	{
		title: "Vendor Comparison",
		href: "/admin/vendor-comparison",
		permission: "vendors-list",
		section: "integration_file_operations",
		module: "vendor_management",
	},
	// Operations
	{
		title: "Processing Logs",
		href: "/admin/processing-logs",
		permission: "processing-logs-view",
		section: "operations",
		module: "vendor_management",
	},
	{
		title: "Error Management",
		href: "/admin/error-management",
		permission: "file-management-view",
		section: "operations",
		module: "vendor_management",
	},
	{
		title: "Notifications",
		href: "/admin/notifications",
		permission: "dashboard-view",
		section: "operations",
		module: "vendor_management",
	},
	{
		title: "SLA Monitoring",
		href: "/admin/sla-monitoring",
		permission: "dashboard-view",
		section: "operations",
		module: "vendor_management",
	},
	{
		title: "Risk Scoring",
		href: "/admin/risk-scoring",
		permission: "dashboard-view",
		section: "operations",
		module: "vendor_management",
	},
	{
		title: "Command Center",
		href: "/admin/activity",
		permission: "dashboard-view",
		section: "operations",
		module: "vendor_management",
	},
	{
		title: "Automations",
		href: "/admin/automations",
		permission: "dashboard-view",
		section: "operations",
		module: "vendor_management",
	},
	// Administration
	{
		title: "Audit Trail",
		href: "/admin/audit-trail",
		permission: "dashboard-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Reports",
		href: "/admin/reports",
		permission: "reports-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Export Center",
		href: "/admin/exports",
		permission: "reports-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Edge Server Data",
		href: "/admin/edge-server-data",
		permission: "reports-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Master Data Entry",
		href: "/admin/master-data-entry",
		permission: "reports-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Error Correction",
		href: "/admin/error-correction",
		permission: "file-management-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Settings",
		href: "/admin/settings",
		permission: "settings-view",
		section: "administration",
		module: "vendor_management",
	},
	{
		title: "Support",
		href: "mailto:support@tilla.example",
		permission: "dashboard-view",
		section: "administration",
		module: "vendor_management",
	},
];

const claimEncounterNav: SidebarNavItem[] = [
	{
		title: "Dashboard",
		href: "/admin/claim-encounter",
		permission: "dashboard-view",
		section: "top",
		module: "claim_encounter",
	},
	{
		title: "Executive Analytics",
		href: "/admin/claim-encounter/executive-analytics/overview",
		permission: "dashboard-view",
		section: "top",
		module: "claim_encounter",
		items: [
			{
				title: "Executive Overview",
				href: "/admin/claim-encounter/executive-analytics/overview",
			},
			{
				title: "Operations & Vendors",
				href: "/admin/claim-encounter/executive-analytics/operations-vendors",
			},
			{
				title: "Regulatory & Quality",
				href: "/admin/claim-encounter/executive-analytics/regulatory-quality",
			},
			{
				title: "Risk & Exceptions",
				href: "/admin/claim-encounter/executive-analytics/risk-exceptions",
			},
		],
	},
	// Claims & Encounters
	{
		title: "Claims",
		href: "/admin/claim-encounter/claims",
		permission: "file-management-view",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	{
		title: "Inbound Vendor Files",
		href: "/admin/claim-encounter/inbound",
		permission: "file-management-view",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	{
		title: "Outbound Vendor Files",
		href: "/admin/claim-encounter/outbound",
		permission: "file-management-view",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	{
		title: "Responses",
		href: "/admin/claim-encounter/responses",
		permission: "file-management-view",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	{
		title: "Acceptance Analytics",
		href: "/admin/claim-encounter/acceptance-analytics",
		permission: "dashboard-view",
		section: "claim_encounter",
		module: "claim_encounter",
		items: [
			{
				title: "Completeness",
				href: "/admin/claim-encounter/acceptance-analytics/completeness",
			},
		],
	},
	{
		title: "Exceptions / Rejections",
		href: "/admin/claim-encounter/exceptions",
		permission: "file-management-view",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	{
		title: "Vendor Comparison",
		href: "/admin/claim-encounter/vendor-comparison",
		permission: "vendors-list",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	{
		title: "File Management",
		href: "/admin/file-management",
		permission: "file-management-view",
		section: "claim_encounter",
		module: "claim_encounter",
	},
	// Regulatory & Compliance
	{
		title: "CMS EDGE",
		href: "/admin/claim-encounter/regulatory/cms-edge",
		permission: "dashboard-view",
		section: "regulatory_compliance",
		module: "claim_encounter",
	},
	{
		title: "CMS EDGE Reporting",
		href: "/admin/claim-encounter/regulatory/cms-edge-reporting",
		permission: "dashboard-view",
		section: "regulatory_compliance",
		module: "claim_encounter",
	},
	{
		title: "Medicare & Medicaid Reporting",
		href: "/admin/claim-encounter/regulatory/program-reporting",
		permission: "dashboard-view",
		section: "regulatory_compliance",
		module: "claim_encounter",
	},
	{
		title: "Risk Adjustment",
		href: "/admin/claim-encounter/regulatory/risk-adjustment",
		permission: "dashboard-view",
		section: "regulatory_compliance",
		module: "claim_encounter",
	},
	{
		title: "Quality Performance",
		href: "/admin/claim-encounter/regulatory/quality-performance/overview",
		permission: "dashboard-view",
		section: "regulatory_compliance",
		module: "claim_encounter",
		items: [
			{
				title: "Overview",
				href: "/admin/claim-encounter/regulatory/quality-performance/overview",
			},
			{
				title: "Measure Library",
				href: "/admin/claim-encounter/regulatory/quality-performance/measure-library",
			},
			{
				title: "Measure Comparison & Readiness",
				href: "/admin/claim-encounter/regulatory/quality-performance/measure-comparison",
			},
		],
	},
	{
		title: "Compliance Calendar",
		href: "/admin/claim-encounter/regulatory/compliance-calendar",
		permission: "dashboard-view",
		section: "regulatory_compliance",
		module: "claim_encounter",
	},
	// Program Monitoring
	{
		title: "ESRD / Dialysis",
		href: "/admin/claim-encounter/program-monitoring/esrd-dialysis",
		permission: "dashboard-view",
		section: "program_monitoring",
		module: "claim_encounter",
	},
	{
		title: "DME",
		href: "/admin/claim-encounter/program-monitoring/dme",
		permission: "dashboard-view",
		section: "program_monitoring",
		module: "claim_encounter",
	},
	{
		title: "Home Health",
		href: "/admin/claim-encounter/program-monitoring/home-health",
		permission: "dashboard-view",
		section: "program_monitoring",
		module: "claim_encounter",
	},
	{
		title: "Hospice",
		href: "/admin/claim-encounter/program-monitoring/hospice",
		permission: "dashboard-view",
		section: "program_monitoring",
		module: "claim_encounter",
	},
	{
		title: "LTSS",
		href: "/admin/claim-encounter/program-monitoring/ltss",
		permission: "dashboard-view",
		section: "program_monitoring",
		module: "claim_encounter",
	},
	{
		title: "Behavioral Health",
		href: "/admin/claim-encounter/program-monitoring/behavioral-health",
		permission: "dashboard-view",
		section: "program_monitoring",
		module: "claim_encounter",
	},
	// Operations
	{
		title: "Processing Logs",
		href: "/admin/processing-logs",
		permission: "processing-logs-view",
		section: "operations",
		module: "claim_encounter",
	},
	{
		title: "Error Management",
		href: "/admin/error-management",
		permission: "file-management-view",
		section: "operations",
		module: "claim_encounter",
	},
	{
		title: "Notifications",
		href: "/admin/notifications",
		permission: "dashboard-view",
		section: "operations",
		module: "claim_encounter",
	},
	{
		title: "SLA Monitoring",
		href: "/admin/sla-monitoring",
		permission: "dashboard-view",
		section: "operations",
		module: "claim_encounter",
	},
	// Administration
	{
		title: "Audit Trail",
		href: "/admin/audit-trail",
		permission: "dashboard-view",
		section: "administration",
		module: "claim_encounter",
	},
	{
		title: "Reports",
		href: "/admin/reports",
		permission: "reports-view",
		section: "administration",
		module: "claim_encounter",
	},
	{
		title: "Edge Server Data",
		href: "/admin/edge-server-data",
		permission: "reports-view",
		section: "administration",
		module: "claim_encounter",
	},
	{
		title: "Master Data Entry",
		href: "/admin/master-data-entry",
		permission: "reports-view",
		section: "administration",
		module: "claim_encounter",
	},
	{
		title: "Error Correction",
		href: "/admin/error-correction",
		permission: "file-management-view",
		section: "administration",
		module: "claim_encounter",
	},
	{
		title: "Support",
		href: "mailto:support@tilla.example",
		permission: "dashboard-view",
		section: "administration",
		module: "claim_encounter",
	},
];

const eligibilityOperationsNav: SidebarNavItem[] = [
	{
		title: "TPA/TPV Tracking",
		href: "/admin/my-work-queue",
		permission: "dashboard-view",
		section: "tpa_tpv_tracking",
		module: "eligibility_operations",
	},
	{
		title: "Member",
		href: "/admin/members",
		permission: "vendors-list",
		section: "member_operations",
		module: "eligibility_operations",
	},
	{
		title: "Provider",
		href: "/admin/providers",
		permission: "vendors-list",
		section: "provider_operations",
		module: "eligibility_operations",
	},
];

export const siteConfig = {
	name: "Vendor Management",
	description:
		"Enterprise procurement vendor management — onboard, contract, source, order, and pay suppliers in one platform.",
	version: "0.1.0",
	appPublisher: "Tilla",
	author: {
		name: "Tilla",
		email: "support@tilla.example",
		url: "https://github.com/kalabAmssalu",
	},
	url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	ogImage: "/og.svg",
	links: {
		github: "https://github.com/kalabAmssalu",
		docs: "/",
		twitter: "@tilla",
	},
	mainNav: [{ title: "Dashboard", href: "/" }],
	layout: {
		maxWidth: "1440px",
		navigationHeight: "64px",
		sidebarWidth: "264px",
		sidebarWidthMin: "208px",
		sidebarWidthMax: "380px",
		footerHeight: "64px",
	},
	modules: {
		vendor_management: {
			id: "vendor_management" as const,
			label: "Vendor Management",
			homeHref: "/",
			sidebarNav: vendorManagementNav,
		},
		claim_encounter: {
			id: "claim_encounter" as const,
			label: "Claims & Encounters",
			homeHref: "/admin/claim-encounter",
			sidebarNav: claimEncounterNav,
		},
		eligibility_operations: {
			id: "eligibility_operations" as const,
			label: "Eligibility Operations Dashboard",
			homeHref: "/admin/my-work-queue",
			sidebarNav: eligibilityOperationsNav,
		},
	},
	/** @deprecated Prefer getModuleSidebarNav(moduleId) — kept for breadcrumb lookups */
	sidebarNav: [
		...vendorManagementNav,
		...claimEncounterNav,
		...eligibilityOperationsNav,
	] as SidebarNavItem[],
	settings: {
		themeToggle: true,
		languageSelector: true,
		authEnabled: true,
		searchEnabled: false,
	},
	features: {
		authentication: {
			enabled: true,
			providers: ["credentials"],
		},
		i18n: {
			defaultLocale: "en",
			locales: ["en", "am"],
		},
		themes: {
			default: "system",
			themes: ["light", "dark", "system"],
		},
		techStack: {
			framework: "Next.js",
			language: "TypeScript",
			styling: "Tailwind CSS",
			components: "shadcn/ui",
			stateManagement: "Zustand",
			api: "TanStack Query + fetch",
			testing: "Jest",
		},
	},
	api: {
		baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
		timeout: 10000,
		retryAttempts: 3,
	},
	analytics: {
		googleAnalytics: process.env.NEXT_PUBLIC_GA_ID,
		microsoftClarity: process.env.NEXT_PUBLIC_CLARITY_ID,
	},
	/** Enforced on NestJS API — not in this Next.js frontend */
	security: {
		backendEnforced: true,
	},
	seo: {
		titleTemplate: "%s | Vendor Management",
		defaultTitle: "Vendor Management",
		robotsEnabled: process.env.NODE_ENV === "production",
	},
	social: {
		github: "https://github.com/kalabAmssalu",
		twitter: "https://twitter.com/kalabAmssalu",
		linkedin: "https://linkedin.com/in/kalabAmssalu",
	},
	support: {
		email: "support@tilla.example",
		issues: "https://github.com/kalabAmssalu/issues",
	},
};

export function getModuleSidebarNav(moduleId: AdminModuleId): SidebarNavItem[] {
	return siteConfig.modules[moduleId].sidebarNav;
}

export type SiteConfig = typeof siteConfig;
