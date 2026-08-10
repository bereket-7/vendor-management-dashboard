"use client";

import {
	AlertTriangle,
	BarChart3,
	Bell,
	Brain,
	Cable,
	CalendarDays,
	CheckCircle2,
	ClipboardCheck,
	ClipboardList,
	Database,
	FileBarChart2,
	FileInput,
	FileOutput,
	FileSearch,
	FileWarning,
	Files,
	FolderKanban,
	GitCompare,
	HeartPulse,
	History,
	Home,
	LifeBuoy,
	MessageSquareReply,
	Radio,
	Scale,
	ScrollText,
	Settings,
	ShieldCheck,
	Stethoscope,
	Timer,
	UserRound,
	Users,
	Accessibility,
	Workflow,
	Activity,
	Hospital,
} from "lucide-react";
import { useTranslations } from "next-intl";

import Logo from "@/components/shared/logo/Logo";
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
	SidebarRail,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { getModuleSidebarNav, siteConfig } from "@/constants/siteconfig";
import { Link, usePathname } from "@/i18n/navigation";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const NAV_ICONS: Record<string, typeof Home> = {
	Dashboard: Home,
	Vendors: Users,
	Members: UserRound,
	Providers: Stethoscope,
	"Integration Intake": Cable,
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
	"HEDIS / Quality": ClipboardCheck,
	"Audit Management": ShieldCheck,
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
};

const VENDOR_SECTION_ORDER = [
	"top",
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

function isActivePath(pathname: string, href: string) {
	if (href === "/" || href === "/admin/claim-encounter") {
		return pathname === href;
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

function navLabelKey(title: string) {
	return title.toLowerCase().replace(/[\s/]+/g, "");
}

export function AdminSidebar() {
	const pathname = usePathname();
	const t = useTranslations("Admin");
	const moduleId = useAdminModuleStore((s) => s.moduleId);

	// Static nav from siteConfig — never fetched / never gated on live session
	const visibleNav = getModuleSidebarNav(moduleId);

	const sections =
		moduleId === "claim_encounter" ? CLAIM_SECTION_ORDER : VENDOR_SECTION_ORDER;

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
											{items.map((item) => {
												if (!item.href) return null;
												const Icon = NAV_ICONS[item.title] ?? Home;
												const active = isActivePath(pathname, item.href);
												const labelKey = navLabelKey(item.title);
												const label = t.has(`nav.${labelKey}`)
													? t(`nav.${labelKey}`)
													: item.title;
												const isExternal = item.href.startsWith("mailto:");

												return (
													<SidebarMenuItem key={item.href}>
														<SidebarMenuButton
															asChild
															isActive={!isExternal && active}
															tooltip={label}
														>
															{isExternal ? (
																<a href={item.href}>
																	<Icon />
																	<span>{label}</span>
																</a>
															) : (
																<Link href={item.href}>
																	<Icon />
																	<span>{label}</span>
																</Link>
															)}
														</SidebarMenuButton>
													</SidebarMenuItem>
												);
											})}
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
