"use client";

import { useState, type ReactNode } from "react";

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
	SlidersHorizontal,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	AUDIT_STATUS_STYLES,
	CMS_EDGE_AUDIT_ACTIVITY,
	CMS_EDGE_AUDIT_KPIS,
	CMS_EDGE_AUDIT_REPORTS,
	CMS_EDGE_AUDIT_REQUESTS,
	CMS_EDGE_AUDIT_SLA,
	CMS_EDGE_AUDIT_STATUS_MIX,
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_TABS,
	CMS_EDGE_TAB_META,
	PRIORITY_DOT,
	REPORT_STATUS_STYLES,
	type CmsEdgeTabId,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { CmsEdgeDocumentsTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeDocumentsTab";
import { CmsEdgeFinancialTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeFinancialTab";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_SECTION_GAP,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TAB_TRIGGER_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
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
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
				className
			)}
		>
			{label}
		</span>
	);
}

function LinkText({ children }: { children: ReactNode }) {
	return (
		<Button
			variant="link"
			className="h-auto p-0 font-mono text-[11px] text-primary"
		>
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
	return (
		<CmsEdgeSectionPanel
			title="Audit Requests"
			action={<PanelLink>View All</PanelLink>}
			footer={
				<TableFooter left="Showing 1 to 8 of 8 entries" page={1} pageCount={1} />
			}
		>
			<div className="border-t border-border/50">
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[1100px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Audit ID
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Audit Type
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								<SortableHead>Request Date</SortableHead>
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Related Submission
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Audit Period
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Due Date
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Status
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Priority
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 pr-4 text-right font-semibold text-foreground">
								Requested Records
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_AUDIT_REQUESTS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.id}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.auditType}</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.requestDate}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.relatedSubmission}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.auditPeriod}</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.dueDate}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.status}
										className={AUDIT_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5">
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
								<TableCell className="px-3 py-2.5 pr-4 text-right tabular-nums">
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
				<TableFooter left="Showing 1 to 6 of 8 entries" page={1} pageCount={1} />
			}
		>
			<div className="border-t border-border/50">
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[1100px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Report ID
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Audit ID
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Report Type
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								<SortableHead>Received Date</SortableHead>
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Related Submission
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 text-right font-semibold text-foreground">
								Records Reviewed
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Status
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 pr-4 text-right font-semibold text-foreground">
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
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.id}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.auditId}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.reportType}</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.receivedDate}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.relatedSubmission}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{formatCount(row.recordsReviewed)}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.status}
										className={REPORT_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 text-right">
									<div className="inline-flex items-center gap-0.5">
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-primary hover:text-primary"
											onClick={() => toast.message(`View ${row.id}`)}
										>
											<Eye className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-primary hover:text-primary"
											onClick={() => toast.success(`Download ${row.id}`)}
										>
											<Download className="size-3.5" />
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
		<CmsEdgeSectionPanel
			className="flex min-h-0 flex-1 flex-col"
			title="Audit Status Overview"
			bodyClassName="flex min-h-0 flex-1 flex-col justify-center"
		>
			<div className="flex flex-col items-center gap-3 px-3 py-3">
				<div className="relative h-28 w-28 shrink-0">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={CMS_EDGE_AUDIT_STATUS_MIX}
								dataKey="value"
								nameKey="name"
								innerRadius={34}
								outerRadius={52}
								paddingAngle={2}
							>
								{CMS_EDGE_AUDIT_STATUS_MIX.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-lg font-bold tabular-nums text-foreground">
							{total}
						</p>
						<p className="text-[10px] text-muted-foreground">Total Requests</p>
					</div>
				</div>
				<ul className="w-full space-y-1.5 text-xs">
					{CMS_EDGE_AUDIT_STATUS_MIX.map((item) => (
						<li
							key={item.name}
							className="flex items-center justify-between gap-2"
						>
							<span className="flex items-center gap-2 font-medium">
								<span
									className="size-2.5 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								{item.name}
							</span>
							<span className="tabular-nums text-muted-foreground">
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
		<CmsEdgeSectionPanel
			className="flex min-h-0 flex-1 flex-col"
			title="Audit SLA Performance (This Period)"
			bodyClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-4">
				{CMS_EDGE_AUDIT_SLA.map((item, index) => {
					const Icon = slaIcons[index] ?? Minus;
					return (
						<div
							key={item.label}
							className={cn(
								"flex flex-1 items-center gap-3 rounded-md border border-border/50 px-3 py-3",
								item.bg
							)}
						>
							<Icon className={cn("size-4 shrink-0", item.tone)} />
							<div className="min-w-0 flex-1">
								<p className={cn("text-lg font-bold tabular-nums leading-none", item.tone)}>
									{item.count}
								</p>
								<p className="mt-1 text-[10px] font-medium text-muted-foreground">
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
					className="w-full min-w-[1100px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Date / Time
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Activity
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Audit ID
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Related Submission
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								User
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 pr-4 font-semibold text-foreground">
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
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.dateTime}
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.activity}</TableCell>
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.auditId}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<LinkText>{row.relatedSubmission}</LinkText>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.user}</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 text-muted-foreground">
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

function CmsEdgeAuditTab() {
	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<AuditKpiRow />

			<CmsEdgeSplitRow
				main={
					<div className={cn("flex flex-col", CMS_EDGE_SECTION_GAP)}>
						<AuditRequestsTable />
						<AuditReportsTable />
					</div>
				}
				side={
					<div className={cn("flex h-full min-h-0 flex-col", CMS_EDGE_SECTION_GAP)}>
						<AuditStatusOverview />
						<AuditSlaPerformance />
					</div>
				}
			/>

			<RecentAuditActivityTable />

			<CmsEdgePageFooter />
		</div>
	);
}

function CmsEdgePlaceholderTab({ title }: { title: string }) {
	return (
		<div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card px-6 py-12 text-center shadow-sm">
			<p className="text-sm font-semibold text-foreground">{title}</p>
			<p className="mt-1 max-w-md text-sm text-muted-foreground">
				This section will mirror the CMS EDGE reporting workspace.
			</p>
		</div>
	);
}

export function CmsEdgePage() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [activeTab, setActiveTab] = useState<CmsEdgeTabId>("audit");
	const tabMeta = CMS_EDGE_TAB_META[activeTab];

	return (
		<div className="space-y-0">
			<div className="space-y-4 pb-4">
				<ClaimPageHeader
					title={tabMeta.title}
					description={tabMeta.description}
					actions={
						<>
							<div className="flex items-center gap-2">
								<span className="text-xs font-medium text-muted-foreground">
									Reporting Period
								</span>
								<Select
									value={reportingPeriod}
									onValueChange={setReportingPeriod}
								>
									<SelectTrigger className="h-9 w-[280px] border-border/70 bg-card shadow-sm">
										<CalendarDays className="mr-2 size-3.5 text-muted-foreground" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CMS_EDGE_REPORTING_PERIODS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-border/70 bg-card shadow-sm"
							>
								<SlidersHorizontal className="mr-1.5 size-3.5" />
								Filters
							</Button>
						</>
					}
				/>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as CmsEdgeTabId)}
			>
				<div className="border-b border-border/70 bg-card">
					<ScrollArea type="always" className="w-full" scrollbarClassName="h-2.5">
						<TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
							{CMS_EDGE_TABS.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className={CMS_EDGE_TAB_TRIGGER_CLASS}
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</ScrollArea>
				</div>

				<div className="bg-muted/30 py-4">
					<TabsContent value="audit" className="mt-0 space-y-0">
						<CmsEdgeAuditTab />
					</TabsContent>
					<TabsContent value="financial-management" className="mt-0 space-y-0">
						<CmsEdgeFinancialTab />
					</TabsContent>
					<TabsContent value="documents" className="mt-0 space-y-0">
						<CmsEdgeDocumentsTab />
					</TabsContent>
					{CMS_EDGE_TABS.filter(
						(tab) =>
							tab.id !== "audit" &&
							tab.id !== "documents" &&
							tab.id !== "financial-management"
					).map((tab) => (
						<TabsContent key={tab.id} value={tab.id} className="mt-0">
							<CmsEdgePlaceholderTab title={CMS_EDGE_TAB_META[tab.id].title} />
						</TabsContent>
					))}
				</div>
			</Tabs>
		</div>
	);
}
