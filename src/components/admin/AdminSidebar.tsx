"use client";

import {
	Accessibility,
	Activity,
	AlertTriangle,
	BarChart3,
	Bell,
	Brain,
	Building2,
	Cable,
	CalendarDays,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	ClipboardList,
	Database,
	Download,
	FileBarChart2,
	FileInput,
	FileOutput,
	FileSearch,
	FileSpreadsheet,
	FileText,
	FileWarning,
	Files,
	FolderKanban,
	GitBranch,
	GitCompare,
	HeartPulse,
	History,
	Home,
	Hospital,
	Inbox,
	KeyRound,
	LifeBuoy,
	LineChart,
	Megaphone,
	MessageSquareReply,
	Radio,
	Receipt,
	Scale,
	ScrollText,
	Settings,
	Shield,
	ShieldCheck,
	ShoppingCart,
	Stethoscope,
	Tags,
	Timer,
	TrendingUp,
	UserPlus,
	UserRound,
	Users,
	UsersRound,
	Workflow,
} from "lucide-react";
import { useTranslations } from "next-intl";

import Logo from "@/components/shared/logo/Logo";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { getModuleSidebarNav, siteConfig } from "@/constants/siteconfig";
import { Link, usePathname } from "@/i18n/navigation";
import { useAdminModuleStore } from "@/stores/admin-module-store";
import type { AdminModuleId, SidebarNavItem } from "@/types/UI/system.types";

const NAV_ICONS: Record<string, typeof Home> = {
	Dashboard: Home,
	"Executive Analytics": LineChart,
	Vendors: Users,
	Contracts: FileText,
	Members: UserRound,
	Providers: Stethoscope,
	"Eligibility Files": FileSpreadsheet,
	"Provider Rosters": ClipboardList,
	Onboarding: UserPlus,
	Categories: Tags,
	Sourcing: Megaphone,
	Documents: FileText,
	Compliance: Shield,
	Performance: TrendingUp,
	"Purchase Orders": ShoppingCart,
	Invoices: Receipt,
	Approvals: CheckCircle2,
	Groups: UsersRound,
	Roles: KeyRound,
	Users: Users,
	"Export Center": Download,
	"Integration Intake": Cable,
	Credentials: KeyRound,
	"Routing Rules": GitBranch,
	"File Monitoring": FolderKanban,
	"Processing Status": FileSearch,
	"File History": History,
	Schedules: CalendarDays,
	"Vendor Comparison": GitCompare,
	"Processing Logs": ScrollText,
	"Error Management": AlertTriangle,
	Notifications: Bell,
	"SLA Monitoring": Timer,
	"Command Center": Radio,
	Automations: Workflow,
	"Audit Trail": ClipboardList,
	Reports: BarChart3,
	Settings: Settings,
	Support: LifeBuoy,
	Claims: Files,
	"Inbound Vendor Files": FileInput,
	"Outbound Vendor Files": FileOutput,
	Responses: MessageSquareReply,
	"Acceptance Analytics": CheckCircle2,
	"Exceptions / Rejections": FileWarning,
	"CMS EDGE": ShieldCheck,
	"Medicaid Encounter Reporting": FileBarChart2,
	"Medicare Reporting": Stethoscope,
	"Risk Adjustment": Scale,
	"Quality Performance": ClipboardCheck,
	"Compliance Calendar": CalendarDays,
	"ESRD / Dialysis": Activity,
	DME: Accessibility,
	"Home Health": Home,
	Hospice: HeartPulse,
	LTSS: Hospital,
	"Behavioral Health": Brain,
	"Edge Server Data": FileBarChart2,
	"File Management": Files,
	"Master Data Entry": Database,
	"Error Correction": FileWarning,
	"My Work Queue": Inbox,
	Member: UserRound,
	Provider: Stethoscope,
	"TPA/TPV Tracking": Building2,
};

const VENDOR_SECTION_ORDER = [
	"top",
	"workspace",
	"master_data",
	"integration_file_operations",
	"operations",
	"administration",
] as const;

const CLAIM_SECTION_ORDER = [
	"top",
	"claim_encounter",
	"regulatory_compliance",
	"program_monitoring",
	"operations",
	"administration",
] as const;

const ELIGIBILITY_SECTION_ORDER = [
	"tpa_tpv_tracking",
	"member_operations",
	"provider_operations",
] as const;

function moduleSectionOrder(moduleId: AdminModuleId) {
	if (moduleId === "claim_encounter") return CLAIM_SECTION_ORDER;
	if (moduleId === "eligibility_operations") return ELIGIBILITY_SECTION_ORDER;
	return VENDOR_SECTION_ORDER;
}

function isActivePath(pathname: string, href: string) {
	if (href === "/" || href === "/admin/claim-encounter") {
		return pathname === href;
	}
	// Contracts overview: exact match so detail routes don't highlight Overview
	if (href === "/admin/contracts") {
		return pathname === "/admin/contracts";
	}
	// Acceptance overview is exact so child analytics pages highlight only themselves.
	if (href === "/admin/claim-encounter/acceptance-analytics") {
		return pathname === href;
	}
	// Contract Details hub + individual contract record pages
	if (href === "/admin/contracts/details") {
		if (
			pathname === "/admin/contracts/details" ||
			pathname.startsWith("/admin/contracts/details/")
		) {
			return true;
		}
		const match = pathname.match(/^\/admin\/contracts\/([^/]+)\/?$/);
		if (!match?.[1]) return false;
		const staticSegments = new Set([
			"details",
			"create",
			"effective-dates",
			"rate-fee-schedule",
			"sla-terms",
			"documents",
		]);
		return !staticSegments.has(match[1]);
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

function navLabelKey(title: string) {
	return title.toLowerCase().replace(/[\s/]+/g, "");
}

function navLabel(
	title: string,
	t: ReturnType<typeof useTranslations<"Admin">>
) {
	const labelKey = navLabelKey(title);
	return t.has(`nav.${labelKey}`) ? t(`nav.${labelKey}`) : title;
}

function isNavItemActive(pathname: string, item: SidebarNavItem) {
	if (item.items?.length) {
		const childActive = item.items.some((child) =>
			isNavItemActive(pathname, child)
		);
		if (childActive) return true;
		// Keep parent group active for nested routes (e.g. /admin/contracts/create)
		if (item.href) {
			return pathname === item.href || pathname.startsWith(`${item.href}/`);
		}
		return false;
	}
	if (!item.href) return false;
	return isActivePath(pathname, item.href);
}

function SidebarNavEntry({
	item,
	pathname,
	t,
}: {
	item: SidebarNavItem;
	pathname: string;
	t: ReturnType<typeof useTranslations<"Admin">>;
}) {
	const Icon = NAV_ICONS[item.title] ?? Home;
	const label = navLabel(item.title, t);
	const hasChildren = (item.items?.length ?? 0) > 0;
	const active = isNavItemActive(pathname, item);

	if (hasChildren) {
		return (
			<Collapsible defaultOpen={active} className="group/collapsible">
				<SidebarMenuItem>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton tooltip={label} isActive={active}>
							<Icon />
							<span className="min-w-0 flex-1 leading-snug">{label}</span>
							<ChevronRight className="ml-auto size-4 shrink-0 self-start mt-0.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
						</SidebarMenuButton>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<SidebarMenuSub>
							{item.items?.map((child) => {
								if (!child.href) return null;
								const childActive = isActivePath(pathname, child.href);
								const childLabel = navLabel(child.title, t);
								return (
									<SidebarMenuSubItem key={child.href}>
										<SidebarMenuSubButton asChild isActive={childActive}>
											<Link href={child.href}>
												<span className="min-w-0 flex-1 leading-snug">
													{childLabel}
												</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								);
							})}
						</SidebarMenuSub>
					</CollapsibleContent>
				</SidebarMenuItem>
			</Collapsible>
		);
	}

	if (!item.href) return null;

	const isExternal = item.href.startsWith("mailto:");

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				isActive={!isExternal && active}
				tooltip={label}
			>
				{isExternal ? (
					<a href={item.href}>
						<Icon />
						<span className="min-w-0 flex-1 leading-snug">{label}</span>
					</a>
				) : (
					<Link href={item.href}>
						<Icon />
						<span className="min-w-0 flex-1 leading-snug">{label}</span>
					</Link>
				)}
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

export function AdminSidebar() {
	const pathname = usePathname();
	const t = useTranslations("Admin");
	const moduleId = useAdminModuleStore((s) => s.moduleId);

	// Static nav from siteConfig — never fetched / never gated on live session
	const visibleNav = getModuleSidebarNav(moduleId);

	const sections = moduleSectionOrder(moduleId);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border px-3 py-3">
				<Link
					href={siteConfig.modules[moduleId].homeHref}
					className="flex min-w-0 items-center gap-2 outline-none ring-sidebar-ring focus-visible:ring-2"
				>
					<Logo title={siteConfig.modules[moduleId].label} />
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<ScrollArea
					className="h-full"
					scrollbarClassName="w-1.5"
					thumbClassName="bg-sidebar-foreground/15 hover:bg-sidebar-foreground/25"
				>
					<div className="flex flex-col gap-1 pb-4">
						{sections.map((section) => {
							const items = visibleNav.filter((i) => i.section === section);
							if (items.length === 0) return null;

							const showLabel = section !== "top";

							return (
								<SidebarGroup key={section}>
									{showLabel ? (
										<SidebarGroupLabel>
											{t.has(`sections.${section}`)
												? t(`sections.${section}`)
												: section}
										</SidebarGroupLabel>
									) : null}
									<SidebarGroupContent>
										<SidebarMenu>
											{items.map((item) => (
												<SidebarNavEntry
													key={item.title}
													item={item}
													pathname={pathname}
													t={t}
												/>
											))}
										</SidebarMenu>
									</SidebarGroupContent>
									{section !== "administration" &&
									section !== "top" &&
									section !== "claim_encounter" &&
									section !== "regulatory_compliance" &&
									section !== "program_monitoring" ? (
										<SidebarSeparator className="mx-2 mt-2" />
									) : null}
								</SidebarGroup>
							);
						})}
					</div>
				</ScrollArea>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
