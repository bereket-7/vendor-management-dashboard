"use client";

import { type ReactNode } from "react";

import {
	AlertCircle,
	ArrowUpDown,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock3,
	Download,
	Eye,
	FileText,
	Minus,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
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
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_SECTION_GAP,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CELL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CMS_EDGE_TABLE_LINK_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	AUDIT_STATUS_STYLES,
	CMS_EDGE_AUDIT_ACTIVITY,
	CMS_EDGE_AUDIT_KPIS,
	CMS_EDGE_AUDIT_REPORTS,
	CMS_EDGE_AUDIT_REQUESTS,
	CMS_EDGE_AUDIT_SLA,
	CMS_EDGE_AUDIT_STATUS_MIX,
	PRIORITY_DOT,
	REPORT_STATUS_STYLES,
	useCmsEdgeAuditRequestsList,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

function PanelLink({ children }: { children: ReactNode }) {
	return (
		<Button variant="link" size="sm" className="h-7 px-0 text-xs text-primary">
			{children}
		</Button>
	);
}

function StatusPill({
	label,
	className,
}: {
	label: string;
	className: string;
}) {
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, className)}>{label}</span>
	);
}

function LinkText({ children }: { children: ReactNode }) {
	return (
		<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
			{children}
		</Button>
	);
}

function SortableHead({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex items-center gap-1">
			{children}
			<ArrowUpDown className="size-3 text-muted-foreground/70" />
		</span>
	);
}

function TableFooter({
	left,
	page = 1,
	pageCount = 1,
}: {
	left: string;
	page?: number;
	pageCount?: number;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
			<span>{left}</span>
			<div className="flex items-center gap-1">
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronsLeft className="size-3.5" />
				</Button>
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronLeft className="size-3.5" />
				</Button>
				<span className="px-2 tabular-nums">
					Page {page} of {pageCount}
				</span>
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronRight className="size-3.5" />
				</Button>
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronsRight className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}

function AuditKpiRow() {
	const k = CMS_EDGE_AUDIT_KPIS;
	return (
		<SummaryCardsGrid columns={6}>
			<SummaryCard
				label="Total Audit Requests"
				value={k.totalRequests}
				icon={CalendarDays}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<SummaryCard
				label="Completed"
				value={`${k.completed.count} (${k.completed.percent.toFixed(2)}%)`}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
			/>
			<SummaryCard
				label="In Progress"
				value={`${k.inProgress.count} (${k.inProgress.percent.toFixed(2)}%)`}
				icon={Clock3}
				tone="text-amber-700 bg-amber-500/10"
			/>
			<SummaryCard
				label="Overdue"
				value={`${k.overdue.count} (${k.overdue.percent.toFixed(2)}%)`}
				icon={AlertCircle}
				tone="text-red-700 bg-red-500/10"
			/>
			<SummaryCard
				label="Audit Reports Received"
				value={k.reportsReceived}
				icon={FileText}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<SummaryCard
				label="Records Reviewed"
				value={formatCount(k.recordsReviewed)}
				icon={Download}
				tone="text-teal-700 bg-teal-500/10"
			/>
		</SummaryCardsGrid>
	);
}

function AuditRequestsTable() {
	const { auditRequests } = useCmsEdgeAuditRequestsList();
	const rows = isMockEnabled() ? CMS_EDGE_AUDIT_REQUESTS : auditRequests;

	return (
		<CmsEdgeSectionPanel
			title="Audit Requests"
			action={<PanelLink>View All</PanelLink>}
			footer={
				<TableFooter
					left={`Showing ${rows.length === 0 ? 0 : 1} to ${rows.length} of ${rows.length} entries`}
					page={1}
					pageCount={1}
				/>
			}
		>
			<div className="border-t border-border/50">
				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1100px]")}
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Audit ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Audit Type
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									<SortableHead>Request Date</SortableHead>
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Related Submission
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Audit Period
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Due Date
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Status
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Priority
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
								>
									Requested Records
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.id}</LinkText>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										{row.auditType}
									</TableCell>
									<TableCell
										className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
									>
										{row.requestDate}
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.relatedSubmission}</LinkText>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										{row.auditPeriod}
									</TableCell>
									<TableCell
										className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
									>
										{row.dueDate}
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<StatusPill
											label={row.status}
											className={AUDIT_STATUS_STYLES[row.status]}
										/>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<span className="inline-flex items-center gap-1.5">
											<span
												className={cn(
													"size-2 rounded-full",
													PRIORITY_DOT[row.priority]
												)}
											/>
											{row.priority}
										</span>
									</TableCell>
									<TableCell
										className={cn(
											CMS_EDGE_TABLE_CELL_CLASS,
											"pr-4 text-right tabular-nums"
										)}
									>
										{formatCount(row.requestedRecords)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function AuditReportsTable() {
	return (
		<CmsEdgeSectionPanel
			title="Audit Reports Received"
			action={<PanelLink>View All Reports</PanelLink>}
			footer={
				<TableFooter
					left="Showing 1 to 6 of 8 entries"
					page={1}
					pageCount={1}
				/>
			}
		>
			<div className="border-t border-border/50">
				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1100px]")}
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Report ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Audit ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Report Type
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									<SortableHead>Received Date</SortableHead>
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Related Submission
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Records Reviewed
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Status
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
								>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{CMS_EDGE_AUDIT_REPORTS.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.id}</LinkText>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.auditId}</LinkText>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										{row.reportType}
									</TableCell>
									<TableCell
										className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
									>
										{row.receivedDate}
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.relatedSubmission}</LinkText>
									</TableCell>
									<TableCell
										className={cn(
											CMS_EDGE_TABLE_CELL_CLASS,
											"text-right tabular-nums"
										)}
									>
										{formatCount(row.recordsReviewed)}
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<StatusPill
											label={row.status}
											className={REPORT_STATUS_STYLES[row.status]}
										/>
									</TableCell>
									<TableCell
										className={cn(CMS_EDGE_TABLE_CELL_CLASS, "pr-4 text-right")}
									>
										<div className="inline-flex items-center gap-0.5">
											<Button
												variant="ghost"
												size="icon"
												className="size-6 text-primary hover:text-primary"
												onClick={() => toast.message(`View ${row.id}`)}
											>
												<Eye className="size-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="size-6 text-primary hover:text-primary"
												onClick={() => toast.success(`Download ${row.id}`)}
											>
												<Download className="size-3" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function AuditStatusOverview() {
	const total = CMS_EDGE_AUDIT_KPIS.totalRequests;

	return (
		<CmsEdgeSectionPanel title="Audit Status Overview">
			<div className="flex flex-col items-center gap-3 px-4 py-4">
				<div className="relative h-32 w-32 shrink-0">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={CMS_EDGE_AUDIT_STATUS_MIX}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{CMS_EDGE_AUDIT_STATUS_MIX.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
						<p className="text-xl font-bold tabular-nums leading-none text-foreground">
							{total}
						</p>
						<p className="mt-1 text-[10px] leading-tight text-muted-foreground">
							Total Requests
						</p>
					</div>
				</div>
				<ul className="w-full space-y-1.5 text-xs">
					{CMS_EDGE_AUDIT_STATUS_MIX.map((item) => (
						<li
							key={item.name}
							className="flex items-center justify-between gap-2"
						>
							<span className="flex min-w-0 items-center gap-2 font-medium">
								<span
									className="size-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="truncate">{item.name}</span>
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{item.value}
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function AuditSlaPerformance() {
	const slaIcons = [CheckCircle2, Clock3, AlertCircle, Minus];

	return (
		<CmsEdgeSectionPanel title="Audit SLA Performance (This Period)">
			<div className="flex flex-col gap-1.5 px-3 py-3">
				{CMS_EDGE_AUDIT_SLA.map((item, index) => {
					const Icon = slaIcons[index] ?? Minus;
					return (
						<div
							key={item.label}
							className={cn(
								"flex items-center gap-2.5 rounded-md border border-border/50 px-3 py-2",
								item.bg
							)}
						>
							<Icon className={cn("size-4 shrink-0", item.tone)} />
							<div className="min-w-0 flex-1">
								<p
									className={cn(
										"text-base font-bold tabular-nums leading-none",
										item.tone
									)}
								>
									{item.count}
								</p>
								<p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
									{item.label}
								</p>
							</div>
							<p className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
								{item.percent.toFixed(1)}%
							</p>
						</div>
					);
				})}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function AuditAttentionSummary() {
	const { auditRequests } = useCmsEdgeAuditRequestsList();
	const requestRows = isMockEnabled() ? CMS_EDGE_AUDIT_REQUESTS : auditRequests;
	const overdue = isMockEnabled()
		? CMS_EDGE_AUDIT_KPIS.overdue.count
		: requestRows.filter((r) => r.status === "Overdue").length;
	const inProgress = isMockEnabled()
		? CMS_EDGE_AUDIT_KPIS.inProgress.count
		: requestRows.filter((r) => r.status === "In Progress").length;
	const nextDue =
		requestRows.find((row) => row.status === "Overdue") ??
		requestRows.find((row) => row.status === "In Progress");

	return (
		<CmsEdgeSectionPanel title="Audit Alerts">
			<div className="divide-y divide-border/40 px-4 py-0.5 text-xs">
				<div className="flex items-center justify-between py-2">
					<span className="inline-flex items-center gap-1.5 text-muted-foreground">
						<AlertCircle className="size-3.5 shrink-0 text-red-500" />
						Overdue
					</span>
					<span className="font-semibold tabular-nums text-red-600">
						{overdue}
					</span>
				</div>
				<div className="flex items-center justify-between py-2">
					<span className="inline-flex items-center gap-1.5 text-muted-foreground">
						<Clock3 className="size-3.5 shrink-0 text-amber-500" />
						In progress
					</span>
					<span className="font-semibold tabular-nums text-foreground">
						{inProgress}
					</span>
				</div>
				{nextDue ? (
					<div className="py-2.5">
						<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Next due
						</p>
						<p className="mt-1 truncate font-medium text-foreground">
							{nextDue.auditType}
						</p>
						<p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
							{nextDue.dueDate}
						</p>
					</div>
				) : null}
			</div>
			<div className="border-t border-border/50 px-4 py-2">
				<PanelLink>Review open audits</PanelLink>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function RecentAuditActivityTable() {
	return (
		<CmsEdgeSectionPanel
			title="Recent Audit Activity"
			action={<PanelLink>View All Activity</PanelLink>}
		>
			<div className="border-t border-border/50">
				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1100px]")}
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Date / Time
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Activity
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Audit ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Related Submission
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									User
								</TableHead>
								<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
									Details
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{CMS_EDGE_AUDIT_ACTIVITY.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell
										className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
									>
										{row.dateTime}
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										{row.activity}
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.auditId}</LinkText>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										<LinkText>{row.relatedSubmission}</LinkText>
									</TableCell>
									<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
										{row.user}
									</TableCell>
									<TableCell
										className={cn(
											CMS_EDGE_TABLE_CELL_CLASS,
											"pr-4 text-muted-foreground"
										)}
									>
										{row.details}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</div>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgeAuditTab() {
	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<AuditKpiRow />

			<CmsEdgeSplitRow
				sideWidth="340px"
				main={
					<div className={cn("flex flex-col", CMS_EDGE_SECTION_GAP)}>
						<AuditRequestsTable />
						<AuditReportsTable />
					</div>
				}
				side={
					<div
						className={cn("flex h-full min-h-0 flex-col", CMS_EDGE_SECTION_GAP)}
					>
						<AuditStatusOverview />
						<AuditSlaPerformance />
						<AuditAttentionSummary />
					</div>
				}
			/>

			<RecentAuditActivityTable />

			<CmsEdgePageFooter />
		</div>
	);
}
