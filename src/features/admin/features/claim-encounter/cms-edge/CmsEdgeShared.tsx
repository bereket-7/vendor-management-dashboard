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
		<section
			className={cn(
				"overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm",
				className
			)}
		>
			<div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-4 py-3">
				<div className="min-w-0">
					<h3 className="text-sm font-semibold text-foreground">{title}</h3>
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

export const CMS_EDGE_TAB_TRIGGER_CLASS = cn(
	"rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-foreground",
	"data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
);

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
