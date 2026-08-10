"use client";

import type { CSSProperties, ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SCROLLBAR_THUMB =
	"rounded-full bg-foreground/25 hover:bg-foreground/40";

const SCROLLBAR_TRACK = "z-10 bg-transparent";

/** Matches file-monitoring dashboard vertical rhythm */
export const CMS_EDGE_PAGE_STACK = "space-y-4";

/** Matches file-monitoring split-row gap */
export const CMS_EDGE_SECTION_GAP = "gap-2";

/** Disable native overflow on shadcn Table — Radix ScrollArea handles scrolling */
export const CMS_EDGE_TABLE_CONTAINER = "overflow-visible";

export const CMS_EDGE_TABLE_HEAD_CLASS =
	"h-9 bg-muted/30 px-3 font-semibold text-foreground";

export const CMS_EDGE_TABLE_CELL_CLASS = "px-3 py-2";

export function CmsEdgeTableScroll({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<ScrollArea
			type="always"
			className={cn("w-full max-w-full overflow-hidden", className)}
			scrollbarClassName={cn("z-10", SCROLLBAR_TRACK)}
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
	return <CmsEdgeTableScroll className={className}>{children}</CmsEdgeTableScroll>;
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
	title: string;
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

/** Main table column + compact sidebar (audit / documents style) */
export function CmsEdgeSplitRow({
	main,
	side,
	className,
	sideWidth = "300px",
}: {
	main: ReactNode;
	side: ReactNode;
	className?: string;
	sideWidth?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,1fr)_var(--cms-edge-side,300px)]",
				CMS_EDGE_SECTION_GAP,
				className
			)}
			style={{ "--cms-edge-side": sideWidth } as CSSProperties}
		>
			<div className="min-w-0">{main}</div>
			<div className="flex min-h-0 min-w-0 flex-col">{side}</div>
		</div>
	);
}

/** Side-by-side pair — natural height, file-monitoring gap */
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
				"grid grid-cols-1 lg:grid-cols-2",
				CMS_EDGE_SECTION_GAP,
				className
			)}
		>
			<div className="min-w-0">{left}</div>
			<div className="min-w-0">{right}</div>
		</div>
	);
}

/** Three-column row — natural height, file-monitoring gap */
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
				"grid grid-cols-1 lg:grid-cols-3",
				CMS_EDGE_SECTION_GAP,
				className
			)}
		>
			<div className="min-w-0">{left}</div>
			<div className="min-w-0">{center}</div>
			<div className="min-w-0">{right}</div>
		</div>
	);
}

export const CMS_EDGE_TAB_TRIGGER_CLASS = cn(
	"rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-foreground",
	"data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
);

export function CmsEdgePageFooter() {
	return (
		<div className="relative pt-1 text-[11px] text-muted-foreground">
			<p className="text-center">All times displayed in ET (Eastern Time)</p>
			<p className="absolute right-0 top-1">CMS EDGE v1.0</p>
		</div>
	);
}
