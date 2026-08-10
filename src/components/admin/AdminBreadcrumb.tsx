"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/constants/siteconfig";
import {
	getClaimResponse,
	getSubmissionBatch,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import {
	getFileRun,
	getValidationIssue,
} from "@/features/admin/features/file-management/mock-data";
import {
	displayName,
	getMember,
} from "@/features/admin/features/members/mock-data";
import {
	displayProviderName,
	getProvider,
} from "@/features/admin/features/providers/mock-data";
import { useVendorsList } from "@/features/shared/vms/queries";
import { Link, usePathname } from "@/i18n/navigation";

type Crumb = {
	label: string;
	href?: string;
};

const STATIC_LABELS: Record<string, string> = {
	vendors: "Vendors",
	members: "Members",
	providers: "Providers",
	create: "Create",
	invite: "Invite",
	"file-monitoring": "File Monitoring",
	select: "Select Vendor, File, or Failed Run",
	investigate: "Investigation Details",
	"processing-logs": "Processing Logs",
	"processing-status": "Processing Status",
	"file-history": "File History",
	"error-management": "Error Management",
	"sla-monitoring": "SLA Monitoring",
	"risk-scoring": "Risk Scoring",
	activity: "Command Center",
	automations: "Automations",
	"vendor-comparison": "Vendor Comparison",
	"audit-trail": "Audit Trail",
	schedules: "Schedules",
	notifications: "Notifications",
	reports: "Reports",
	exports: "Export Center",
	settings: "Settings",
	compliance: "Compliance",
	contracts: "Contracts",
	onboarding: "Onboarding",
	sourcing: "Sourcing",
	invoices: "Invoices",
	"purchase-orders": "Purchase Orders",
	approvals: "Approvals",
	performance: "Performance",
	categories: "Categories",
	documents: "Documents",
	groups: "Groups",
	roles: "Roles",
	users: "Users",
	edit: "Edit",
	match: "Match",
	"claim-encounter": "Claims & Encounters",
	claims: "Claims",
	inbound: "Inbound Vendor File",
	outbound: "Outbound Vendor File",
	responses: "Responses",
	"acceptance-analytics": "Acceptance Analytics",
	exceptions: "Exceptions / Rejections",
	regulatory: "Regulatory & Compliance",
	"program-monitoring": "Program Monitoring",
	"cms-edge": "CMS EDGE",
	"medicaid-encounter-reporting": "Medicaid Encounter Reporting",
	"medicare-reporting": "Medicare Reporting",
	"risk-adjustment": "Risk Adjustment",
	"hedis-quality": "HEDIS / Quality",
	"audit-management": "Audit Management",
	"compliance-calendar": "Compliance Calendar",
	"esrd-dialysis": "ESRD / Dialysis",
	dme: "DME",
	"home-health": "Home Health",
	hospice: "Hospice",
	ltss: "LTSS",
	"behavioral-health": "Behavioral Health",
	"file-management": "File Management",
	"edge-server-data": "Edge Server Data",
	"master-data-entry": "Master Data Entry",
	"error-correction": "Error Correction",
	batches: "Submission Batches",
	files: "Files",
	review: "Review",
};

function formatSegment(segment: string) {
	return (
		STATIC_LABELS[segment] ??
		segment
			.split("-")
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ")
	);
}

function navLabelForHref(href: string) {
	const item = siteConfig.sidebarNav.find((nav) => nav.href === href);
	return item?.title;
}

const COLLAPSE_THRESHOLD = 4;

export function AdminBreadcrumb({ appTitle }: { appTitle: string }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { vendors } = useVendorsList();

	const crumbs = useMemo(() => {
		const segments = pathname.split("/").filter(Boolean);
		const adminIndex = segments.indexOf("admin");
		const trail = adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;

		const items: Crumb[] = [];

		if (trail.length === 0) {
			items.push({ label: "Dashboard" });
			return items;
		}

		let path = "/admin";
		for (let i = 0; i < trail.length; i++) {
			const segment = trail[i]!;
			const prev = trail[i - 1];
			path += `/${segment}`;

			if (segment === "admin") continue;

			if (segment === "investigate") {
				continue;
			}

			if (prev === "vendors" && segment !== "create" && segment !== "invite") {
				const vendor = vendors.find((v) => v.id === segment);
				items.push({
					label: vendor?.tradeName ?? vendor?.legalName ?? "Vendor Details",
					href: i < trail.length - 1 ? path : undefined,
				});
				continue;
			}

			if (prev === "members") {
				const member = getMember(decodeURIComponent(segment));
				items.push({
					label: member ? displayName(member) : "Member Profile",
					href: i < trail.length - 1 ? path : undefined,
				});
				continue;
			}

			if (prev === "providers") {
				const provider = getProvider(decodeURIComponent(segment));
				items.push({
					label: provider ? displayProviderName(provider) : "Provider Profile",
					href: i < trail.length - 1 ? path : undefined,
				});
				continue;
			}

			if (
				prev === "file-monitoring" &&
				segment !== "select" &&
				segment !== "investigate"
			) {
				const run = getFileRun(segment);
				items.push({
					label: run ? "File Run Details" : formatSegment(segment),
					href: i < trail.length - 1 ? path : undefined,
				});
				continue;
			}

			if (prev === "investigate") {
				const runId = trail[i - 2];
				if (runId) {
					const { issue } = getValidationIssue(runId, segment);
					items.push({
						label: issue
							? `Investigation · ${issue.code}`
							: "Investigation Details",
					});
				} else {
					items.push({ label: "Investigation Details" });
				}
				continue;
			}

			if (prev === "claims") {
				items.push({ label: "Claim Overview" });
				continue;
			}

			if (prev === "responses" && segment !== "responses") {
				const response = getClaimResponse(decodeURIComponent(segment));
				items.push({
					label: response?.responseFile ?? "Response Details",
				});
				continue;
			}

			if (prev === "batches") {
				const batch = getSubmissionBatch(decodeURIComponent(segment));
				items.push({
					label: batch?.batchId ?? "Batch Details",
				});
				continue;
			}

			if (prev === "files") {
				const file = getVendorFile(decodeURIComponent(segment));
				items.push({
					label: file?.fileName ?? "File Details",
					href: i < trail.length - 1 ? path : undefined,
				});
				continue;
			}

			if (segment === "claim-encounter") {
				items.push({
					label: "Claims & Encounters",
					href: i < trail.length - 1 ? path : undefined,
				});
				continue;
			}

			const navLabel = navLabelForHref(path);
			const label = navLabel ?? formatSegment(segment);
			items.push({
				label,
				href: i < trail.length - 1 ? path : undefined,
			});
		}

		const runParam = searchParams.get("run");
		if (trail.includes("processing-logs") && runParam) {
			const last = items[items.length - 1];
			if (last && !last.href) {
				last.href = "/admin/processing-logs";
			}
			items.push({ label: "Processing Log Viewer" });
		}

		return items;
	}, [pathname, searchParams, vendors]);

	const collapsed = useMemo(() => {
		if (crumbs.length <= COLLAPSE_THRESHOLD) {
			return { visible: crumbs, hidden: [] as Crumb[] };
		}
		return {
			visible: [
				crumbs[0]!,
				crumbs[crumbs.length - 2]!,
				crumbs[crumbs.length - 1]!,
			],
			hidden: crumbs.slice(1, -2),
		};
	}, [crumbs]);

	function renderCrumb(crumb: Crumb, isLast: boolean) {
		if (isLast || !crumb.href) {
			return (
				<BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
			);
		}
		return (
			<BreadcrumbLink asChild>
				<Link href={crumb.href}>{crumb.label}</Link>
			</BreadcrumbLink>
		);
	}

	const useCollapsed = crumbs.length > COLLAPSE_THRESHOLD;

	return (
		<Breadcrumb className="min-w-0 flex-1">
			<BreadcrumbList className="flex-nowrap">
				<BreadcrumbItem className="shrink-0">
					<BreadcrumbLink asChild>
						<Link href="/admin" className="font-semibold text-primary">
							{appTitle}
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{!useCollapsed &&
					crumbs.map((crumb, index) => {
						const isLast = index === crumbs.length - 1;
						return (
							<span key={`${crumb.label}-${index}`} className="contents">
								<BreadcrumbSeparator />
								<BreadcrumbItem className="min-w-0">
									<span className="truncate">{renderCrumb(crumb, isLast)}</span>
								</BreadcrumbItem>
							</span>
						);
					})}

				{useCollapsed && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem className="min-w-0 shrink">
							<span className="truncate">
								{renderCrumb(collapsed.visible[0]!, false)}
							</span>
						</BreadcrumbItem>

						{collapsed.hidden.length > 0 && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<DropdownMenu>
										<DropdownMenuTrigger className="flex items-center gap-1 rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
											<BreadcrumbEllipsis className="size-7" />
											<span className="sr-only">Show breadcrumb trail</span>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="start" className="max-w-xs">
											{collapsed.hidden.map((crumb) =>
												crumb.href ? (
													<DropdownMenuItem
														key={crumb.href + crumb.label}
														asChild
													>
														<Link href={crumb.href}>{crumb.label}</Link>
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem key={crumb.label} disabled>
														{crumb.label}
													</DropdownMenuItem>
												)
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</BreadcrumbItem>
							</>
						)}

						{collapsed.visible.slice(1).map((crumb, index) => {
							const isLast = index === collapsed.visible.slice(1).length - 1;
							return (
								<span key={`${crumb.label}-tail-${index}`} className="contents">
									<BreadcrumbSeparator />
									<BreadcrumbItem className="min-w-0">
										<span className="truncate">
											{renderCrumb(crumb, isLast)}
										</span>
									</BreadcrumbItem>
								</span>
							);
						})}
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
