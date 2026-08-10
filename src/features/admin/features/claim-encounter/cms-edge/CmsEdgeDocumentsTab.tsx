"use client";

import { useMemo, useState, type ReactNode } from "react";

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
	MoreVertical,
	Search,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
	RETENTION_ALERT_STYLES,
	filterDocumentLibrary,
	type DocumentFileKind,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_SECTION_GAP,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
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
		return <FileSpreadsheet className="size-4 shrink-0 text-emerald-600" />;
	}
	if (kind === "xml") {
		return <FileText className="size-4 shrink-0 text-amber-600" />;
	}
	return <FileText className="size-4 shrink-0 text-red-500" />;
}

function DocumentsKpiRow() {
	const k = CMS_EDGE_DOCUMENT_KPIS;
	const periodHint = "(This Period)";

	return (
		<SummaryCardsGrid columns={6}>
			<SummaryCard
				label="Total Documents"
				value={`${k.totalDocuments}`}
				hint={periodHint}
				icon={FolderOpen}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<SummaryCard
				label="Available"
				value={`${k.available.count} (${k.available.percent.toFixed(2)}%)`}
				hint={periodHint}
				icon={FileText}
				tone="text-emerald-700 bg-emerald-500/10"
			/>
			<SummaryCard
				label="Pending"
				value={`${k.pending.count} (${k.pending.percent.toFixed(2)}%)`}
				hint={periodHint}
				icon={Clock3}
				tone="text-amber-700 bg-amber-500/10"
			/>
			<SummaryCard
				label="Expired / Retention Warning"
				value={`${k.expiredWarning.count} (${k.expiredWarning.percent.toFixed(2)}%)`}
				hint={periodHint}
				icon={AlertTriangle}
				tone="text-red-700 bg-red-500/10"
			/>
			<SummaryCard
				label="Downloads"
				value={k.downloads}
				hint={periodHint}
				icon={Download}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<SummaryCard
				label="Total Storage Used"
				value={`${k.storageUsedGb.toFixed(2)} GB`}
				hint={periodHint}
				icon={HardDrive}
				tone="text-teal-700 bg-teal-500/10"
			/>
		</SummaryCardsGrid>
	);
}

function DocumentLibraryPanel() {
	const [search, setSearch] = useState("");
	const rows = useMemo(
		() => filterDocumentLibrary(CMS_EDGE_DOCUMENT_LIBRARY, search),
		[search]
	);

	return (
		<CmsEdgeSectionPanel
			title="Document Library"
			subtitle="Browse and access all CMS EDGE documents."
			action={
				<Button
					variant="outline"
					size="sm"
					className="h-8 border-primary/30 text-primary"
					onClick={() => toast.message("Upload document")}
				>
					<CloudUpload className="mr-1.5 size-3.5" />
					Upload Document
				</Button>
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
			<div className="shrink-0 border-b border-border/50 px-4 py-3">
				<div className="relative max-w-md">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search documents..."
						className="h-9 bg-background pl-8"
					/>
				</div>
			</div>
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[1180px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Document Name
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Document Type
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Related Submission
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Reporting Period
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								<SortableHead>Date Uploaded</SortableHead>
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								File Size
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Status
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Retention Until
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 pr-4 text-right font-semibold text-foreground">
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
								<TableCell className="px-3 py-2.5">
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
								<TableCell className="px-3 py-2.5">{row.documentType}</TableCell>
								<TableCell className="px-3 py-2.5">
									<Button
										variant="link"
										className="h-auto p-0 text-[11px] text-primary"
									>
										{row.relatedSubmission}
									</Button>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.reportingPeriod}</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.dateUploaded}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.fileSize}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.status}
										className={DOCUMENT_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.retentionUntil}
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 text-right">
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
	const usedPercent = (k.storageUsedGb / k.storageAllocatedGb) * 100;

	return (
		<CmsEdgeSectionPanel title="Storage Overview">
			<div className="px-4 py-4">
				<div className="flex items-center gap-4">
					<div className="relative h-36 w-36 shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={CMS_EDGE_STORAGE_MIX}
									dataKey="value"
									nameKey="name"
									innerRadius={44}
									outerRadius={64}
									paddingAngle={2}
								>
									{CMS_EDGE_STORAGE_MIX.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
							<p className="text-sm font-bold tabular-nums text-foreground">
								{k.storageUsedGb.toFixed(2)} GB
							</p>
							<p className="text-[10px] text-muted-foreground">Total Used</p>
						</div>
					</div>
					<ul className="min-w-0 flex-1 space-y-2 text-xs">
						{CMS_EDGE_STORAGE_MIX.map((item) => (
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
									{item.value.toFixed(1)}%
								</span>
							</li>
						))}
					</ul>
				</div>
				<div className="mt-4 space-y-2 border-t border-border/50 pt-4">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">
							Total Storage Allocated: {k.storageAllocatedGb} GB
						</span>
						<span className="font-medium tabular-nums">
							Available: {k.storageAvailableGb.toFixed(2)} GB (
							{k.storageAvailablePercent.toFixed(2)}%)
						</span>
					</div>
					<Progress value={usedPercent} className="h-2 bg-muted" />
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
				<div className="border-t border-border/50 px-4 py-3">
					<PanelLink>View All Documents</PanelLink>
				</div>
			}
		>
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[720px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Document Name
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Document Type
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Uploaded By
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Date Uploaded
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Related Submission
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 pr-4 text-right font-semibold text-foreground">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_RECENT_DOCUMENTS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<span className="flex items-center gap-2">
										<FileKindIcon kind={row.fileKind} />
										<span className="truncate">{row.name}</span>
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.documentType}</TableCell>
								<TableCell className="px-3 py-2.5">{row.uploadedBy}</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.dateUploaded}
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.relatedSubmission}</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 text-right">
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.success(`Download ${row.name}`)}
									>
										<Download className="size-3.5" />
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

function RetentionAlertsPanel() {
	return (
		<CmsEdgeSectionPanel
			title="Retention / Expiration Alerts"
			subtitle="Documents nearing retention expiration."
			footer={
				<div className="border-t border-border/50 px-4 py-3">
					<PanelLink>View All Alerts</PanelLink>
				</div>
			}
		>
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className="w-full min-w-[620px] text-xs"
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Document Name
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Retention Until
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 font-semibold text-foreground">
								Days Remaining
							</TableHead>
							<TableHead className="h-9 bg-muted/30 px-3 pr-4 font-semibold text-foreground">
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
								<TableCell className="px-3 py-2.5">
									<span className="flex items-center gap-2">
										<FileKindIcon kind={row.fileKind} />
										<span className="truncate">{row.name}</span>
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.retentionUntil}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.daysRemaining} days
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
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
				main={<DocumentLibraryPanel />}
				side={
					<div className={cn("flex h-full min-h-0 flex-col", CMS_EDGE_SECTION_GAP)}>
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
