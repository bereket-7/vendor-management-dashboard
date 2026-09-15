"use client";

import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import {
	AlertCircle,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	LayoutDashboard,
	type LucideIcon,
	MessageSquareReply,
	Scale,
	Send,
	SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_REPORTING_TABS,
	CMS_EDGE_REPORTING_TAB_META,
	type CmsEdgeReportingTabId,
	useCmsEdgeReportingOverviewQuery,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const toolbarField = cn(
	"h-9 w-[148px] rounded-sm border-border bg-background text-xs shadow-none",
	"hover:border-foreground/20",
	"focus:ring-2 focus:ring-primary/15"
);

const REPORTING_BASE = "/admin/claim-encounter/regulatory/cms-edge-reporting";

const TAB_ICONS: Record<CmsEdgeReportingTabId, LucideIcon> = {
	overview: LayoutDashboard,
	submissions: Send,
	"cms-responses": MessageSquareReply,
	exceptions: AlertCircle,
	reconciliation: Scale,
};

function tabFromPathname(pathname: string): CmsEdgeReportingTabId {
	const segment = pathname.split("/").filter(Boolean).pop() ?? "overview";
	const match = CMS_EDGE_REPORTING_TABS.find((tab) => tab.id === segment);
	return match?.id ?? "overview";
}

function formatBadge(count: number) {
	return count > 999 ? `${Math.round(count / 100) / 10}k` : String(count);
}

function ReportingTabs({
	activeTab,
	badges,
}: {
	activeTab: CmsEdgeReportingTabId;
	badges: Partial<Record<CmsEdgeReportingTabId, number>>;
}) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	const updateOverflow = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		setCanLeft(el.scrollLeft > 2);
		setCanRight(max - el.scrollLeft > 2);
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		updateOverflow();
		el.addEventListener("scroll", updateOverflow, { passive: true });
		const ro = new ResizeObserver(updateOverflow);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", updateOverflow);
			ro.disconnect();
		};
	}, [updateOverflow]);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const active = el.querySelector<HTMLElement>('[data-active-tab="true"]');
		if (!active) return;
		const parentRect = el.getBoundingClientRect();
		const tabRect = active.getBoundingClientRect();
		if (
			tabRect.left < parentRect.left + 4 ||
			tabRect.right > parentRect.right - 4
		) {
			active.scrollIntoView({
				behavior: "smooth",
				inline: "nearest",
				block: "nearest",
			});
		}
		requestAnimationFrame(updateOverflow);
	}, [activeTab, updateOverflow]);

	function scrollByDir(dir: -1 | 1) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({
			left: dir * Math.max(160, el.clientWidth * 0.55),
			behavior: "smooth",
		});
	}

	return (
		<nav
			aria-label="CMS EDGE Reporting sections"
			className="relative flex items-end gap-0.5 border-b border-border/50 bg-card px-1 pb-0 pt-0.5 sm:px-2"
		>
			<button
				type="button"
				aria-label="Scroll tabs left"
				disabled={!canLeft}
				onClick={() => scrollByDir(-1)}
				className={cn(
					"mb-2 flex size-7 shrink-0 items-center justify-center rounded-md transition-opacity",
					canLeft
						? "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
						: "pointer-events-none opacity-0"
				)}
			>
				<ChevronLeft className="size-3.5" />
			</button>

			<div
				ref={scrollerRef}
				className={cn(
					"flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-hidden",
					"[scrollbar-width:thin] [scrollbar-color:oklch(0.55_0_0_/_0.35)_transparent]",
					"[&::-webkit-scrollbar]:h-1.5",
					"[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40",
					"[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/25",
					"hover:[&::-webkit-scrollbar-thumb]:bg-foreground/40"
				)}
			>
				{CMS_EDGE_REPORTING_TABS.map((tab) => {
					const href = `${REPORTING_BASE}/${tab.id}`;
					const isActive = activeTab === tab.id;
					const Icon = TAB_ICONS[tab.id];
					const badge = badges[tab.id];

					return (
						<Link
							key={tab.id}
							href={href}
							data-active-tab={isActive ? "true" : undefined}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"group relative mb-1.5 flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200",
								isActive
									? "bg-foreground text-background shadow-sm"
									: "text-foreground/75 hover:bg-muted/55 hover:text-foreground"
							)}
						>
							<span
								className={cn(
									"flex size-5 shrink-0 items-center justify-center rounded-full",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-primary"
								)}
							>
								<Icon className="size-3.5" />
							</span>
							<span>{tab.label}</span>
							{badge != null && badge > 0 ? (
								<span
									className={cn(
										"rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
										isActive
											? "bg-background/20 text-background"
											: "bg-muted text-muted-foreground"
									)}
								>
									{formatBadge(badge)}
								</span>
							) : null}

							<span
								aria-hidden
								className={cn(
									"absolute inset-x-3 -bottom-[7px] h-[2px] rounded-full bg-primary transition-opacity",
									isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
								)}
							/>
						</Link>
					);
				})}
			</div>

			<button
				type="button"
				aria-label="Scroll tabs right"
				disabled={!canRight}
				onClick={() => scrollByDir(1)}
				className={cn(
					"mb-2 flex size-7 shrink-0 items-center justify-center rounded-md transition-opacity",
					canRight
						? "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
						: "pointer-events-none opacity-0"
				)}
			>
				<ChevronRight className="size-3.5" />
			</button>
		</nav>
	);
}

export function CmsEdgeReportingShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const activeTab = tabFromPathname(pathname);
	const tabMeta = CMS_EDGE_REPORTING_TAB_META[activeTab];
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const overviewQuery = useCmsEdgeReportingOverviewQuery(reportingPeriod);
	const badges = overviewQuery.data?.tabBadges ?? {};

	return (
		<div className="space-y-0">
			<div className="pb-3">
				<ClaimPageHeader
					title={tabMeta.title}
					description={tabMeta.description}
					actions={
						<div className="flex items-center gap-1.5">
							<Select
								value={reportingPeriod}
								onValueChange={setReportingPeriod}
							>
								<SelectTrigger className={toolbarField}>
									<CalendarDays className="size-3.5 text-muted-foreground" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CMS_EDGE_REPORTING_PERIODS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label.split(" (")[0]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								size="sm"
								className={cn(toolbarBtn, "border-border bg-background")}
							>
								<SlidersHorizontal className="size-3.5" />
								Filters
							</Button>
						</div>
					}
				/>
			</div>

			<ReportingTabs activeTab={activeTab} badges={badges} />

			<div className="bg-muted/30 py-4">{children}</div>
		</div>
	);
}
