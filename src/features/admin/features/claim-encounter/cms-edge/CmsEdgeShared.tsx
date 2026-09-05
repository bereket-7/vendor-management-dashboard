"use client";

import type { CSSProperties, ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SCROLLBAR_THUMB = "rounded-full bg-foreground/25 hover:bg-foreground/40";

const SCROLLBAR_TRACK = "z-10 bg-transparent";

/** Matches file-monitoring dashboard vertical rhythm */
export const CMS_EDGE_PAGE_STACK = "space-y-4";

/** Matches file-monitoring split-row gap */
export const CMS_EDGE_SECTION_GAP = "gap-2";

/** Disable native overflow on shadcn Table — Radix ScrollArea handles scrolling */
export const CMS_EDGE_TABLE_CONTAINER = "overflow-visible";

/** Compact table typography used across CMS EDGE tabs */
export const CMS_EDGE_TABLE_CLASS = "w-full text-xs leading-snug";

export const CMS_EDGE_TABLE_HEAD_CLASS =
	"h-8 bg-muted/30 px-3 text-[11px] font-semibold text-foreground";

export const CMS_EDGE_TABLE_CELL_CLASS = "px-3 py-2";

/** Tighter rows for dense split-view tables (e.g. validations) */
export const CMS_EDGE_TABLE_DENSE_CELL_CLASS = "px-3 py-1";

export const CMS_EDGE_TABLE_LINK_CLASS =
	"h-auto p-0 font-mono text-[11px] text-primary";

export const CMS_EDGE_STATUS_PILL_CLASS =
	"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold";

/** Slightly smaller tables for dense secondary panels (e.g. documents bottom row) */
export const CMS_EDGE_TABLE_COMPACT_CLASS = "w-full text-[11px] leading-snug";

export const CMS_EDGE_TABLE_COMPACT_HEAD_CLASS =
	"h-7 bg-muted/30 px-3 text-[10px] font-semibold text-foreground";

export const CMS_EDGE_TABLE_COMPACT_CELL_CLASS = "px-3 py-1.5";

export function CmsEdgeTableScroll({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<ScrollArea
			type="hover"
			className={cn("group w-full max-w-full overflow-hidden", className)}
			scrollbarClassName={cn(
				"z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=visible]:opacity-100",
				SCROLLBAR_TRACK
			)}
			thumbClassName={SCROLLBAR_THUMB}
			viewportClassName="w-full max-w-full [&>div]:!block [&>div]:w-max [&>div]:min-w-full"
		>
			{children}
		</ScrollArea>
	);
}

/** @deprecated Use CmsEdgeTableScroll — kept for non-table scroll areas */
export function CmsEdgeScrollRegion({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<CmsEdgeTableScroll className={className}>{children}</CmsEdgeTableScroll>
	);
}

/** Soft dual-shadow panel — matches CMS EDGE Reporting */
export const CMS_EDGE_PANEL_CLASS =
	"rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

export const CMS_EDGE_STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";

export const CMS_EDGE_STAT_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)] hover:-translate-y-px";

export const CMS_EDGE_KPI_CARD_CLASS = cn(
	"relative overflow-hidden rounded-sm border border-border/70 bg-card p-4 transition-all duration-200 ease-out",
	CMS_EDGE_STAT_SHADOW,
	CMS_EDGE_STAT_HOVER
);

/** Left accent gradient for KPI cards from tone class strings */
export function cmsEdgeKpiAccent(tone: string) {
	if (tone.includes("emerald") || tone.includes("green")) {
		return "from-emerald-500/80 to-emerald-400/40";
	}
	if (tone.includes("red")) return "from-red-500/80 to-red-400/40";
	if (tone.includes("amber") || tone.includes("orange")) {
		return "from-amber-500/80 to-amber-400/40";
	}
	if (tone.includes("violet") || tone.includes("purple")) {
		return "from-violet-500/80 to-violet-400/40";
	}
	if (tone.includes("slate") || tone.includes("zinc")) {
		return "from-slate-500/80 to-slate-400/40";
	}
	return "from-sky-500/80 to-sky-400/40";
}

export function CmsEdgeSectionPanel({
	title,
	subtitle,
	action,
	children,
	footer,
	infoBar,
	className,
	bodyClassName,
}: {
	title: ReactNode;
	subtitle?: string;
	action?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	infoBar?: ReactNode;
	className?: string;
	bodyClassName?: string;
}) {
	return (
		<section className={cn("overflow-hidden", CMS_EDGE_PANEL_CLASS, className)}>
			<div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-4 py-2.5">
				<div className="min-w-0">
					<h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						{title}
					</h3>
					{subtitle ? (
						<p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
					) : null}
				</div>
				{action}
			</div>
			<div className={cn("min-h-0", bodyClassName)}>{children}</div>
			{infoBar ? <div className="shrink-0">{infoBar}</div> : null}
			{footer ? <div className="shrink-0">{footer}</div> : null}
		</section>
	);
}

/** Main table column + sidebar. Use `wideMain` for ~2:1 table/chart layouts. */
export function CmsEdgeSplitRow({
	main,
	side,
	className,
	sideWidth = "340px",
	wideMain = false,
	align = "stretch",
}: {
	main: ReactNode;
	side: ReactNode;
	className?: string;
	sideWidth?: string;
	wideMain?: boolean;
	/** `start` keeps the main panel content-height (no empty table gap). */
	align?: "stretch" | "start";
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1",
				align === "stretch" ? "items-stretch" : "items-start",
				wideMain
					? "xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"
					: "xl:grid-cols-[minmax(0,1fr)_var(--cms-edge-side,340px)]",
				CMS_EDGE_SECTION_GAP,
				className
			)}
			style={
				wideMain
					? undefined
					: ({ "--cms-edge-side": sideWidth } as CSSProperties)
			}
		>
			<div className="flex min-h-0 min-w-0 flex-col">{main}</div>
			<div className="flex min-h-0 min-w-0 flex-col">{side}</div>
		</div>
	);
}

/** Side-by-side pair — equal height stretch */
export function CmsEdgePairRow({
	left,
	right,
	className,
}: {
	left: ReactNode;
	right: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 items-stretch lg:grid-cols-2",
				CMS_EDGE_SECTION_GAP,
				className
			)}
		>
			<div className="flex min-h-0 min-w-0 flex-col">{left}</div>
			<div className="flex min-h-0 min-w-0 flex-col">{right}</div>
		</div>
	);
}

/** Three-column row — equal height stretch on xl+ */
export function CmsEdgeTripleRow({
	left,
	center,
	right,
	className,
}: {
	left: ReactNode;
	center: ReactNode;
	right: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 items-stretch lg:grid-cols-3",
				CMS_EDGE_SECTION_GAP,
				className
			)}
		>
			<div className="flex min-h-0 min-w-0 flex-col">{left}</div>
			<div className="flex min-h-0 min-w-0 flex-col">{center}</div>
			<div className="flex min-h-0 min-w-0 flex-col">{right}</div>
		</div>
	);
}

/** Pill tabs — matches CMS EDGE Reporting shell */
export const CMS_EDGE_TAB_TRIGGER_CLASS = cn(
	"group relative mb-1.5 flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-[11px] font-bold tracking-wide whitespace-nowrap shadow-none transition-all duration-200",
	"border-0 text-foreground/75 hover:bg-muted/55 hover:text-foreground",
	"data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
);

export const CMS_EDGE_TAB_ICON_WELL_CLASS =
	"flex size-5 shrink-0 items-center justify-center rounded-full text-primary group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground";

export const CMS_EDGE_TAB_HAIRLINE_CLASS =
	"absolute inset-x-3 -bottom-[7px] h-[2px] rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-40 group-data-[state=active]:opacity-100";

export const CMS_EDGE_TAB_NAV_CLASS =
	"relative flex items-end gap-0.5 border-b border-border/50 bg-card px-1 pb-0 pt-0.5 sm:px-2";

/** Blank-tab scaffold — one wrapper per not-yet-built CMS EDGE tab */
export function CmsEdgeBlankTab({
	title,
	description = "This section will mirror the CMS EDGE reporting workspace.",
}: {
	title: string;
	description?: string;
}) {
	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card px-6 py-12 text-center shadow-sm">
				<p className="text-sm font-semibold text-foreground">{title}</p>
				<p className="mt-1 max-w-md text-sm text-muted-foreground">
					{description}
				</p>
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

export function CmsEdgePageFooter() {
	return (
		<div className="relative pt-1 text-[11px] text-muted-foreground">
			<p className="text-center">All times displayed in ET (Eastern Time)</p>
			<p className="absolute right-0 top-1">CMS EDGE v1.0</p>
		</div>
	);
}
