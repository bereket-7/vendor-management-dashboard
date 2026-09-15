"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock3,
	CloudUpload,
	Download,
	FileSpreadsheet,
	FileText,
	FolderOpen,
	HardDrive,
	type LucideIcon,
	MoreVertical,
	Search,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_SECTION_GAP,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CELL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_COMPACT_CELL_CLASS,
	CMS_EDGE_TABLE_COMPACT_CLASS,
	CMS_EDGE_TABLE_COMPACT_HEAD_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgePageFooter,
	CmsEdgePairRow,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_DOCUMENT_KPIS,
	CMS_EDGE_DOCUMENT_LIBRARY,
	CMS_EDGE_DOCUMENT_STATUSES,
	CMS_EDGE_DOCUMENT_SUBMISSIONS,
	CMS_EDGE_DOCUMENT_TYPES,
	CMS_EDGE_RECENT_DOCUMENTS,
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_RETENTION_ALERTS,
	CMS_EDGE_STORAGE_MIX,
	DOCUMENT_STATUS_STYLES,
	type DocumentFileKind,
	RETENTION_ALERT_STYLES,
	filterDocumentLibrary,
	useCmsEdgeDocumentLibraryList,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
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

function SortableHead({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex items-center gap-1">
			{children}
			<ArrowUpDown className="size-3 text-muted-foreground/70" />
		</span>
	);
}

function FileKindIcon({ kind }: { kind: DocumentFileKind }) {
	if (kind === "xlsx" || kind === "csv") {
		return <FileSpreadsheet className="size-3.5 shrink-0 text-emerald-600" />;
	}
	if (kind === "xml") {
		return <FileText className="size-3.5 shrink-0 text-amber-600" />;
	}
	return <FileText className="size-3.5 shrink-0 text-red-500" />;
}

function DocMetricCard({
	label,
	value,
	hint,
	icon: Icon,
	tone = "text-primary bg-primary/10",
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon: LucideIcon;
	tone?: string;
}) {
	return (
		<div className="rounded-lg border border-border/70 bg-card p-2.5 shadow-sm">
			<div className="flex items-center gap-2.5">
				<div
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-md",
						tone
					)}
				>
					<Icon className="size-4" aria-hidden />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p className="mt-0.5 text-sm font-semibold tabular-nums leading-tight text-foreground">
						{value}
					</p>
					{hint != null && hint !== "" ? (
						<div className="mt-0.5 truncate text-[10px] text-muted-foreground">
							{hint}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

function DocumentsKpiRow() {
	const k = CMS_EDGE_DOCUMENT_KPIS;

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<DocMetricCard
				label="Total Documents"
				value={k.totalDocuments}
				icon={FolderOpen}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<DocMetricCard
				label="Available"
				value={k.available.count}
				hint={`${k.available.percent.toFixed(1)}%`}
				icon={FileText}
				tone="text-emerald-700 bg-emerald-500/10"
			/>
			<DocMetricCard
				label="Pending"
				value={k.pending.count}
				hint={`${k.pending.percent.toFixed(1)}%`}
				icon={Clock3}
				tone="text-amber-700 bg-amber-500/10"
			/>
			<DocMetricCard
				label="Retention Warning"
				value={k.expiredWarning.count}
				hint={`${k.expiredWarning.percent.toFixed(1)}%`}
				icon={AlertTriangle}
				tone="text-red-700 bg-red-500/10"
			/>
			<DocMetricCard
				label="Downloads"
				value={k.downloads}
				icon={Download}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<DocMetricCard
				label="Storage Used"
				value={`${k.storageUsedGb.toFixed(2)} GB`}
				icon={HardDrive}
				tone="text-teal-700 bg-teal-500/10"
			/>
		</div>
	);
}

function StorageChartLegend({
	items,
}: {
	items: { name: string; color: string; gb: number; pct: number }[];
}) {
	return (
		<ul className="grid gap-1 text-[11px] leading-snug">
			{items.map((item) => (
				<li key={item.name} className="flex items-center justify-between gap-2">
					<span className="flex min-w-0 items-center gap-1.5 font-medium">
						<span
							className="size-2 shrink-0 rounded-full"
							style={{ backgroundColor: item.color }}
						/>
						<span className="truncate">{item.name}</span>
					</span>
					<span className="shrink-0 text-right tabular-nums text-muted-foreground">
						{item.gb.toFixed(2)} GB ({item.pct.toFixed(1)}%)
					</span>
				</li>
			))}
		</ul>
	);
}

function DocumentLibraryPanel() {
	const [search, setSearch] = useState("");
	const { documentLibrary } = useCmsEdgeDocumentLibraryList();
	const rows = useMemo(
		() =>
			filterDocumentLibrary(
				isMockEnabled() ? CMS_EDGE_DOCUMENT_LIBRARY : documentLibrary,
				search
			),
		[search, documentLibrary]
	);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Document Library"
			subtitle="Browse and access all CMS EDGE documents."
			bodyClassName="flex min-h-0 flex-1 flex-col"
			action={
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative w-full min-w-[180px] sm:w-52">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search documents..."
							className="h-8 bg-background pl-8 text-xs"
						/>
					</div>
					<Button
						size="sm"
						className="h-8"
						onClick={() => toast.message("Upload document")}
					>
						<CloudUpload className="mr-1.5 size-3.5" />
						Upload Document
					</Button>
				</div>
			}
			footer={
				<div className="border-t border-border/50 px-4 py-3">
					<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
						<Button
							variant="link"
							size="sm"
							className="h-7 px-0 text-xs text-primary"
						>
							Show 10 more documents
							<ChevronDown className="ml-1 size-3.5" />
						</Button>
						<span className="text-xs text-muted-foreground">
							Showing 1 to 10 of 128 entries
						</span>
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="size-7" disabled>
								<ChevronLeft className="size-3.5" />
							</Button>
							{[1, 2, 3, 4, 5].map((page) => (
								<Button
									key={page}
									variant={page === 1 ? "default" : "outline"}
									size="icon"
									className="size-7 text-xs"
								>
									{page}
								</Button>
							))}
							<span className="px-1">…</span>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								13
							</Button>
							<Button variant="outline" size="icon" className="size-7">
								<ChevronRight className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>
			}
		>
			<CmsEdgeTableScroll className="min-h-[300px] flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1180px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Document Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Document Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Related Submission
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Reporting Period
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								<SortableHead>Date Uploaded</SortableHead>
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File Size
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Retention Until
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
							>
								Actions
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
									<span className="flex min-w-0 items-center gap-2">
										<FileKindIcon kind={row.fileKind} />
										<Button
											variant="link"
											className="h-auto min-w-0 p-0 text-left text-[11px] text-primary"
										>
											<span className="truncate">{row.name}</span>
										</Button>
									</span>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.documentType}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button
										variant="link"
										className="h-auto p-0 text-[11px] text-primary"
									>
										{row.relatedSubmission}
									</Button>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.reportingPeriod}
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
								>
									{row.dateUploaded}
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
								>
									{row.fileSize}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<StatusPill
										label={row.status}
										className={DOCUMENT_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
								>
									{row.retentionUntil}
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "pr-4 text-right")}
								>
									<div className="inline-flex items-center gap-0.5">
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-primary"
											onClick={() => toast.success(`Download ${row.name}`)}
										>
											<Download className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-muted-foreground"
										>
											<MoreVertical className="size-3.5" />
										</Button>
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

function DocumentFiltersPanel() {
	const [docType, setDocType] = useState("All Types");
	const [submission, setSubmission] = useState("All Submissions");
	const [period, setPeriod] = useState("q2-2027");
	const [status, setStatus] = useState("All Statuses");

	return (
		<CmsEdgeSectionPanel title="Document Filters">
			<div className="space-y-3 px-4 py-4">
				<div className="space-y-1">
					<Label className="text-xs">Document Type</Label>
					<Select value={docType} onValueChange={setDocType}>
						<SelectTrigger className="h-9 bg-background">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CMS_EDGE_DOCUMENT_TYPES.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Related Submission</Label>
					<Select value={submission} onValueChange={setSubmission}>
						<SelectTrigger className="h-9 bg-background">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CMS_EDGE_DOCUMENT_SUBMISSIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Reporting Period</Label>
					<Select value={period} onValueChange={setPeriod}>
						<SelectTrigger className="h-9 bg-background">
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
				<div className="space-y-1">
					<Label className="text-xs">Status</Label>
					<Select value={status} onValueChange={setStatus}>
						<SelectTrigger className="h-9 bg-background">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CMS_EDGE_DOCUMENT_STATUSES.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Date Uploaded</Label>
					<div className="grid grid-cols-2 gap-2">
						<Input type="date" className="h-9 bg-background" />
						<Input type="date" className="h-9 bg-background" />
					</div>
				</div>
				<div className="flex gap-2 pt-1">
					<Button size="sm" className="h-9 flex-1">
						Apply Filters
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="h-9 flex-1"
						onClick={() => {
							setDocType("All Types");
							setSubmission("All Submissions");
							setPeriod("q2-2027");
							setStatus("All Statuses");
						}}
					>
						Reset
					</Button>
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function StorageOverviewPanel() {
	const k = CMS_EDGE_DOCUMENT_KPIS;
	const legendItems = CMS_EDGE_STORAGE_MIX.map((item) => ({
		name: item.name,
		color: item.color,
		gb: item.gb,
		pct: item.value,
	}));

	return (
		<CmsEdgeSectionPanel
			className="flex min-h-0 flex-1 flex-col"
			title="Storage Overview"
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/50 px-4 py-2.5 text-[10px]">
					<span className="text-muted-foreground">
						Total Storage Allocated: {k.storageAllocatedGb} GB
					</span>
					<span className="font-medium tabular-nums text-emerald-700">
						Available: {k.storageAvailableGb.toFixed(2)} GB (
						{k.storageAvailablePercent.toFixed(2)}%)
					</span>
				</div>
			}
		>
			<div className="flex min-h-0 flex-1 flex-col border-t border-border/50 px-4 py-3">
				<div className="relative mx-auto w-full max-w-[168px] flex-1">
					<ResponsiveContainer width="100%" height="100%" minHeight={120}>
						<PieChart>
							<Pie
								data={CMS_EDGE_STORAGE_MIX}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{CMS_EDGE_STORAGE_MIX.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-xs font-bold tabular-nums text-foreground">
							{k.storageUsedGb.toFixed(2)} GB
						</p>
						<p className="text-[10px] text-muted-foreground">Total Used</p>
					</div>
				</div>
				<div className="shrink-0 pt-2">
					<StorageChartLegend items={legendItems} />
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function RecentlyUploadedPanel() {
	return (
		<CmsEdgeSectionPanel
			title="Recently Uploaded Documents"
			footer={
				<div className="border-t border-border/50 px-4 py-2.5">
					<PanelLink>View All Documents</PanelLink>
				</div>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_COMPACT_CLASS, "min-w-[680px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Document Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Document Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Uploaded By
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Date Uploaded
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_RECENT_DOCUMENTS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_COMPACT_CELL_CLASS}>
									<span className="flex items-center gap-1.5">
										<FileKindIcon kind={row.fileKind} />
										<span className="truncate">{row.name}</span>
									</span>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_COMPACT_CELL_CLASS}>
									{row.documentType}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_COMPACT_CELL_CLASS}>
									{row.uploadedBy}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_COMPACT_CELL_CLASS,
										"tabular-nums"
									)}
								>
									{row.dateUploaded}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function RetentionAlertsPanel() {
	return (
		<CmsEdgeSectionPanel
			title="Retention / Expiration Alerts"
			subtitle="Documents nearing retention expiration."
			footer={
				<div className="border-t border-border/50 px-4 py-2.5">
					<PanelLink>View All Alerts</PanelLink>
				</div>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_COMPACT_CLASS, "min-w-[560px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Document Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Retention Until
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_COMPACT_HEAD_CLASS}>
								Days Remaining
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_COMPACT_HEAD_CLASS, "pr-4")}
							>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_RETENTION_ALERTS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_COMPACT_CELL_CLASS}>
									<span className="flex items-center gap-1.5">
										<FileKindIcon kind={row.fileKind} />
										<span className="truncate">{row.name}</span>
									</span>
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_COMPACT_CELL_CLASS,
										"tabular-nums"
									)}
								>
									{row.retentionUntil}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_COMPACT_CELL_CLASS,
										"tabular-nums"
									)}
								>
									{row.daysRemaining} days
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_COMPACT_CELL_CLASS, "pr-4")}
								>
									<StatusPill
										label={row.status}
										className={RETENTION_ALERT_STYLES[row.status]}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgeDocumentsTab() {
	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<DocumentsKpiRow />

			<CmsEdgeSplitRow
				wideMain
				main={<DocumentLibraryPanel />}
				side={
					<div
						className={cn("flex h-full min-h-0 flex-col", CMS_EDGE_SECTION_GAP)}
					>
						<DocumentFiltersPanel />
						<StorageOverviewPanel />
					</div>
				}
			/>

			<CmsEdgePairRow
				left={<RecentlyUploadedPanel />}
				right={<RetentionAlertsPanel />}
			/>

			<CmsEdgePageFooter />
		</div>
	);
}
