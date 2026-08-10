"use client";

import { type ReactNode } from "react";

import {
	ArrowDownToLine,
	ArrowUpDown,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Download,
	FileText,
	RefreshCw,
	TrendingUp,
} from "lucide-react";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_FM_ACTIVITY,
	CMS_EDGE_FM_CATEGORIES,
	CMS_EDGE_FM_KPIS,
	CMS_EDGE_FM_OVERVIEW_MIX,
	CMS_EDGE_FM_SELECTED_DETAILS,
	CMS_EDGE_FM_SUMMARY,
	CMS_EDGE_FM_TREND,
	FM_COMPLETED_STYLE,
	formatCurrencyPrecise,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
	CmsEdgeTripleRow,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { cn } from "@/lib/utils";

function PanelLink({ children }: { children: ReactNode }) {
	return (
		<Button variant="link" size="sm" className="h-7 px-0 text-xs text-primary">
			{children}
		</Button>
	);
}

function StatusPill({ label }: { label: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
				FM_COMPLETED_STYLE
			)}
		>
			{label}
		</span>
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

function FmKpiRow() {
	const k = CMS_EDGE_FM_KPIS;
	return (
		<SummaryCardsGrid columns={6}>
			<SummaryCard
				label="Total Payments"
				value={formatCurrencyPrecise(k.totalPayments)}
				hint="This Period"
				icon={DollarSign}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<SummaryCard
				label="Withholds"
				value={formatCurrencyPrecise(k.withholds)}
				hint={`${k.withholdsPercent.toFixed(2)}% of Payment`}
				icon={ArrowDownToLine}
				tone="text-emerald-700 bg-emerald-500/10"
			/>
			<SummaryCard
				label="Adjustments"
				value={formatCurrencyPrecise(k.adjustments)}
				hint={`${k.adjustmentsPercent.toFixed(2)}% of Payment`}
				icon={RefreshCw}
				tone="text-amber-700 bg-amber-500/10"
			/>
			<SummaryCard
				label="Net Payment"
				value={formatCurrencyPrecise(k.netPayment)}
				hint="After Withholds & Adjustments"
				icon={FileText}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<SummaryCard
				label="Last FM Response"
				value={k.lastFmResponse}
				hint={
					<PanelLink>View Latest FM Report</PanelLink>
				}
				icon={CalendarDays}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<SummaryCard
				label="FM Reports Received"
				value={k.fmReportsReceived}
				hint="This Period"
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
			/>
		</SummaryCardsGrid>
	);
}

function FmSummaryTable() {
	return (
		<CmsEdgeSectionPanel
			title="Financial Management Summary (By Response)"
			action={
				<div className="flex items-center gap-3">
					<PanelLink>View All</PanelLink>
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						onClick={() => toast.success("Export queued")}
					>
						<Download className="mr-1.5 size-3.5" />
						Export
					</Button>
				</div>
			}
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
					<span>Showing 1 to 5 of 5 entries</span>
					<div className="flex items-center gap-1">
						<Button variant="outline" size="icon" className="size-7" disabled>
							<ChevronLeft className="size-3.5" />
						</Button>
						<Button variant="default" size="icon" className="size-7 text-xs">
							1
						</Button>
						<Button variant="outline" size="icon" className="size-7" disabled>
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
			}
		>
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[1080px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Response File
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Response Type
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Related Submission
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								<SortableHead>Data Received</SortableHead>
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 text-right font-semibold">
								Paid Amount
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 text-right font-semibold">
								Withholds
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 text-right font-semibold">
								Adjustments
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 text-right font-semibold">
								Net Payment
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 pr-4 font-semibold">
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_FM_SUMMARY.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<Button
										variant="link"
										className="h-auto p-0 font-mono text-[11px] text-primary"
									>
										{row.responseFile}
									</Button>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.responseType}</TableCell>
								<TableCell className="px-3 py-2.5">
									<Button
										variant="link"
										className="h-auto p-0 text-[11px] text-primary"
									>
										{row.relatedSubmission}
									</Button>
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.dataReceived}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{formatCurrencyPrecise(row.paidAmount)}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{formatCurrencyPrecise(row.withholds)}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{formatCurrencyPrecise(row.adjustments)}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{formatCurrencyPrecise(row.netPayment)}
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<StatusPill label={row.status} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function FmOverviewPanel() {
	const donutData = CMS_EDGE_FM_OVERVIEW_MIX.map((item) => ({
		name: item.name,
		value: item.value,
		color: item.color,
	}));

	return (
		<CmsEdgeSectionPanel
			title="Financial Management Overview (This Period)"
			infoBar={
				<div className="shrink-0 border-t border-sky-200/80 bg-sky-50/80 px-4 py-2 text-[11px] text-sky-900">
					Percentages are calculated based on Total Payments.
				</div>
			}
		>
			<div className="flex items-center gap-4 px-4 py-4">
				<div className="relative h-40 w-40 shrink-0">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={donutData}
								dataKey="value"
								nameKey="name"
								innerRadius={48}
								outerRadius={68}
								paddingAngle={1}
							>
								{donutData.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
							<Tooltip
								formatter={(value: number) => formatCurrencyPrecise(value)}
							/>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold text-foreground">$12.85M</p>
						<p className="text-[10px] text-muted-foreground">Total Paid</p>
					</div>
				</div>
				<ul className="min-w-0 flex-1 space-y-2 text-xs">
					{CMS_EDGE_FM_OVERVIEW_MIX.map((item) => (
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
							<span className="text-right tabular-nums text-muted-foreground">
								{formatCurrencyPrecise(item.value)}
								{item.name !== "Total Payments" ? (
									<span className="ml-1">({item.pct.toFixed(2)}%)</span>
								) : null}
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function PaymentTrendPanel() {
	return (
		<CmsEdgeSectionPanel title="Payment Trend Over Time">
			<div className="h-64 px-2 py-3">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={CMS_EDGE_FM_TREND}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
						<YAxis
							tick={{ fontSize: 10 }}
							tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
						/>
						<Tooltip
							formatter={(value: number) => formatCurrencyPrecise(value)}
						/>
						<Legend wrapperStyle={{ fontSize: 11 }} />
						<Line
							type="monotone"
							dataKey="totalPayments"
							name="Total Payments"
							stroke="#3b82f6"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="withholds"
							name="Withholds"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="adjustments"
							name="Adjustments"
							stroke="#f59e0b"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="netPayment"
							name="Net Payment"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function PaymentBreakdownPanel() {
	return (
		<CmsEdgeSectionPanel title="Payment Breakdown by Category">
			<CmsEdgeTableScroll>
				<Table containerClassName={CMS_EDGE_TABLE_CONTAINER} className="w-full text-xs">
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Category
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 text-right font-semibold">
								Paid Amount
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 pr-4 font-semibold">
								Share
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_FM_CATEGORIES.map((row) => (
							<TableRow
								key={row.category}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5.5 font-medium">
									{row.category}
								</TableCell>
								<TableCell className="px-3 py-2.5.5 text-right tabular-nums">
									{formatCurrencyPrecise(row.paidAmount)}
								</TableCell>
								<TableCell className="px-3 py-2.5.5 pr-4">
									<div className="flex items-center gap-2">
										<Progress value={row.percent} className="h-1.5 flex-1" />
										<span className="w-10 text-right tabular-nums text-muted-foreground">
											{row.percent.toFixed(1)}%
										</span>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function FinancialDetailsPanel() {
	const d = CMS_EDGE_FM_SELECTED_DETAILS;
	const rows: [string, string][] = [
		["Response File", d.responseFile],
		["Response Type", d.responseType],
		["Related Submission", d.relatedSubmission],
		["Reporting Period", d.reportingPeriod],
		["Data Received", d.dataReceived],
		["Paid Amount", formatCurrencyPrecise(d.paidAmount)],
		["Withholds", formatCurrencyPrecise(d.withholds)],
		["Adjustments", formatCurrencyPrecise(d.adjustments)],
		["Net Payment", formatCurrencyPrecise(d.netPayment)],
	];

	return (
		<CmsEdgeSectionPanel
			title="Financial Details (Selected Response)"
			footer={
				<div className="border-t border-border/50 px-4 py-3">
					<Button
						variant="outline"
						size="sm"
						className="h-9 w-full border-primary/30 text-primary"
						onClick={() => toast.success("Payment report download queued")}
					>
						<Download className="mr-1.5 size-3.5" />
						Download Payment Report
					</Button>
				</div>
			}
		>
			<dl className="divide-y divide-border/40 px-4 py-1">
					{rows.map(([label, value]) => (
						<div
							key={label}
							className="grid grid-cols-[140px_1fr] gap-3 py-3 text-xs"
						>
							<dt className="font-medium text-muted-foreground">{label}</dt>
							<dd className="font-medium text-foreground">{value}</dd>
						</div>
					))}
			</dl>
		</CmsEdgeSectionPanel>
	);
}

function RecentFmActivityPanel() {
	return (
		<CmsEdgeSectionPanel
			title="Recent Financial Management Activity"
			action={<PanelLink>View All Activity</PanelLink>}
		>
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[980px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Activity
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Description
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Related Submission
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Date / Time
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 font-semibold">
								Status
							</TableHead>
							<TableHead className="sticky top-0 z-10 h-9 bg-muted/30 px-3 pr-4 font-semibold">
								User
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_FM_ACTIVITY.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<span className="inline-flex items-center gap-1.5">
										<TrendingUp className="size-3.5 text-primary" />
										{row.activity}
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.description}</TableCell>
								<TableCell className="px-3 py-2.5">{row.relatedSubmission}</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.dateTime}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill label={row.status} />
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">{row.user}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgeFinancialTab() {
	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<FmKpiRow />

			<CmsEdgeSplitRow
				sideWidth="320px"
				main={<FmSummaryTable />}
				side={<FmOverviewPanel />}
			/>

			<CmsEdgeTripleRow
				left={<PaymentTrendPanel />}
				center={<PaymentBreakdownPanel />}
				right={<FinancialDetailsPanel />}
			/>

			<RecentFmActivityPanel />

			<CmsEdgePageFooter />
		</div>
	);
}
