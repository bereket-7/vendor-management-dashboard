"use client";

import {
	ArrowRight,
	CalendarDays,
	Database,
	FileOutput,
	FileText,
	FileUp,
	Globe2,
	Hash,
	Hourglass,
	ListOrdered,
	type LucideIcon,
	Mail,
	PieChart,
	Scale,
	Send,
	ShieldAlert,
	ShieldCheck,
	Stethoscope,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_KPI_CARD_CLASS,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgePageFooter,
	CmsEdgePairRow,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
	cmsEdgeKpiAccent,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_OVERVIEW_ACTIVITY,
	CMS_EDGE_OVERVIEW_CONFIG,
	CMS_EDGE_OVERVIEW_ENTITIES,
	CMS_EDGE_OVERVIEW_EXCEPTIONS,
	CMS_EDGE_OVERVIEW_KPI_CARDS,
	CMS_EDGE_OVERVIEW_WORKFLOW,
	OVERVIEW_ACTIVITY_STATUS_STYLES,
	OVERVIEW_SEVERITY_STYLES,
	type OverviewWorkflowState,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	calendar: CalendarDays,
	pie: PieChart,
	file: FileText,
	fileOut: FileOutput,
	send: Send,
	shield: ShieldAlert,
	hourglass: Hourglass,
} satisfies Record<
	(typeof CMS_EDGE_OVERVIEW_KPI_CARDS)[number]["icon"],
	LucideIcon
>;

const ENTITY_ICONS = {
	members: Users,
	providers: Stethoscope,
	claims: FileText,
} satisfies Record<
	(typeof CMS_EDGE_OVERVIEW_ENTITIES)[number]["icon"],
	LucideIcon
>;

const WORKFLOW_ICONS = {
	database: Database,
	shieldCheck: ShieldCheck,
	fileUp: FileUp,
	send: Send,
	mail: Mail,
	scale: Scale,
} satisfies Record<
	(typeof CMS_EDGE_OVERVIEW_WORKFLOW)[number]["icon"],
	LucideIcon
>;

const CONFIG_ICONS = {
	hash: Hash,
	globe: Globe2,
	calendar: CalendarDays,
	list: ListOrdered,
} satisfies Record<
	(typeof CMS_EDGE_OVERVIEW_CONFIG)[number]["icon"],
	LucideIcon
>;

const STAT_TONE = {
	default: "text-foreground",
	success: "text-emerald-700",
	danger: "text-red-600",
} as const;

const WORKFLOW_RING: Record<OverviewWorkflowState, string> = {
	completed: "border-emerald-500 bg-emerald-500 text-white",
	in_progress: "border-primary bg-white text-primary ring-4 ring-primary/15",
	pending:
		"border-dashed border-muted-foreground/35 bg-white text-muted-foreground",
};

const WORKFLOW_STATUS: Record<OverviewWorkflowState, string> = {
	completed: "text-emerald-700",
	in_progress: "text-sky-700",
	pending: "text-muted-foreground",
};

function OverviewKpiRow() {
	return (
		<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
			{CMS_EDGE_OVERVIEW_KPI_CARDS.map((kpi) => {
				const Icon = KPI_ICONS[kpi.icon];
				return (
					<div key={kpi.id} className={CMS_EDGE_KPI_CARD_CLASS}>
						<span
							aria-hidden
							className={cn(
								"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
								cmsEdgeKpiAccent(kpi.tone)
							)}
						/>
						<div className="flex items-start justify-between gap-3 pl-1.5">
							<div className="min-w-0 flex-1">
								<p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
									{kpi.label}
								</p>
								<p
									className={cn(
										"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground",
										kpi.valueClassName
									)}
								>
									{kpi.value}
								</p>
								<p
									className={cn(
										"mt-1.5 truncate text-xs text-muted-foreground",
										kpi.hintClassName
									)}
								>
									{kpi.hint}
								</p>
							</div>
							<span
								className={cn(
									"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
									kpi.tone
								)}
							>
								<Icon className="size-[18px]" aria-hidden />
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function EntityCards({
	onNavigate,
}: {
	onNavigate?: (
		tabId: (typeof CMS_EDGE_OVERVIEW_ENTITIES)[number]["tabId"]
	) => void;
}) {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			{CMS_EDGE_OVERVIEW_ENTITIES.map((entity) => {
				const Icon = ENTITY_ICONS[entity.icon];
				return (
					<section
						key={entity.id}
						className="flex flex-col overflow-hidden rounded-lg border border-border/70 border-t-[3px] border-t-primary bg-card shadow-sm"
					>
						<div className="flex flex-1 flex-col gap-4 p-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/5 text-primary">
									<Icon className="size-5" aria-hidden />
								</div>
								<div className="min-w-0">
									<h3 className="text-sm font-semibold text-foreground">
										{entity.title}
									</h3>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{entity.description}
									</p>
								</div>
							</div>
							<dl className="space-y-2 border-t border-border/50 pt-3 text-xs">
								{entity.stats.map((stat) => (
									<div
										key={stat.label}
										className="flex items-center justify-between gap-3"
									>
										<dt className="text-muted-foreground">{stat.label}</dt>
										<dd
											className={cn(
												"font-semibold tabular-nums",
												STAT_TONE[stat.tone]
											)}
										>
											{stat.value}
										</dd>
									</div>
								))}
							</dl>
						</div>
						<div className="p-4 pt-0">
							<Button
								className="h-9 w-full justify-between"
								onClick={() => onNavigate?.(entity.tabId)}
							>
								{entity.cta}
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</section>
				);
			})}
		</div>
	);
}

function SubmissionWorkflow() {
	return (
		<section className={cn("overflow-hidden", CMS_EDGE_PANEL_CLASS)}>
			<div className="border-b border-border/50 px-4 py-3">
				<h3 className="text-sm font-semibold text-foreground">
					Submission Workflow
				</h3>
			</div>
			<div className="px-4 py-6 sm:px-8">
				<div className="flex items-start justify-between gap-1">
					{CMS_EDGE_OVERVIEW_WORKFLOW.map((stage, index) => {
						const Icon = WORKFLOW_ICONS[stage.icon];
						return (
							<div
								key={stage.id}
								className="relative flex min-w-0 flex-1 flex-col items-center"
							>
								{index > 0 ? (
									<div
										className="absolute top-5 right-[calc(50%+22px)] left-[calc(-50%+22px)] h-px border-t border-dashed border-border"
										aria-hidden
									/>
								) : null}
								<div
									className={cn(
										"relative z-10 flex size-10 items-center justify-center rounded-full border-2",
										WORKFLOW_RING[stage.state]
									)}
								>
									<Icon className="size-4" aria-hidden />
								</div>
								<p className="mt-2.5 text-center text-xs font-semibold text-foreground">
									{stage.label}
								</p>
								<p
									className={cn(
										"mt-0.5 text-center text-[11px] font-medium",
										WORKFLOW_STATUS[stage.state]
									)}
								>
									{stage.status}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

function ExceptionsPanel({ onViewAll }: { onViewAll?: () => void }) {
	return (
		<CmsEdgeSectionPanel
			title="Exceptions Requiring Action"
			action={
				<Button
					variant="link"
					size="sm"
					className="h-7 px-0 text-xs text-primary"
					onClick={onViewAll}
				>
					View all exceptions
				</Button>
			}
			bodyClassName="pb-2"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Exception Type
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Count
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Severity
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Owner</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_OVERVIEW_EXCEPTIONS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 font-medium">
									{row.type}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.count}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<span
										className={cn(
											CMS_EDGE_STATUS_PILL_CLASS,
											OVERVIEW_SEVERITY_STYLES[row.severity]
										)}
									>
										{row.severity}
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5 text-muted-foreground">
									{row.owner}
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<Button
										variant="link"
										className="h-auto p-0 text-xs font-semibold text-primary"
									>
										Review
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ActivityPanel() {
	return (
		<CmsEdgeSectionPanel
			title="Latest Activity"
			action={
				<Button
					variant="link"
					size="sm"
					className="h-7 px-0 text-xs text-primary"
				>
					View all activity
				</Button>
			}
			bodyClassName="pb-2"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[560px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Activity
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Environment
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Owner
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_OVERVIEW_ACTIVITY.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 font-medium">
									{row.activity}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-muted-foreground">
									{row.fileType}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-muted-foreground">
									{row.environment}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<span
										className={cn(
											CMS_EDGE_STATUS_PILL_CLASS,
											OVERVIEW_ACTIVITY_STATUS_STYLES[row.status]
										)}
									>
										{row.status}
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums text-muted-foreground">
									{row.date}
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 text-muted-foreground">
									{row.owner}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ConfigurationPanel({ onViewAll }: { onViewAll?: () => void }) {
	return (
		<CmsEdgeSectionPanel
			title="CMS Configuration"
			action={
				<Button
					variant="link"
					size="sm"
					className="h-7 px-0 text-xs text-primary"
					onClick={onViewAll}
				>
					View configuration
				</Button>
			}
			bodyClassName="pb-0"
		>
			<ul className="grid grid-cols-1 divide-y divide-border/40 border-t border-border/50 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-border/40">
				{CMS_EDGE_OVERVIEW_CONFIG.map((item) => {
					const Icon = CONFIG_ICONS[item.icon];
					return (
						<li
							key={item.id}
							className="flex items-center gap-3 px-4 py-4 text-sm"
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
								<Icon className="size-3.5" aria-hidden />
							</span>
							<div className="min-w-0">
								<p className="text-xs text-muted-foreground">{item.label}</p>
								<p className="mt-0.5 font-semibold tabular-nums text-foreground">
									{item.value}
								</p>
							</div>
						</li>
					);
				})}
			</ul>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgeOverviewTab({
	onNavigateTab,
}: {
	onNavigateTab?: (
		tabId:
			| (typeof CMS_EDGE_OVERVIEW_ENTITIES)[number]["tabId"]
			| "exceptions"
			| "configuration"
	) => void;
} = {}) {
	return (
		<div className="space-y-5">
			<OverviewKpiRow />
			<EntityCards onNavigate={onNavigateTab} />
			<SubmissionWorkflow />
			<CmsEdgePairRow
				className="gap-4"
				left={
					<ExceptionsPanel onViewAll={() => onNavigateTab?.("exceptions")} />
				}
				right={<ActivityPanel />}
			/>
			<ConfigurationPanel onViewAll={() => onNavigateTab?.("configuration")} />
			<CmsEdgePageFooter />
		</div>
	);
}
