"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	ClipboardCheck,
	CloudUpload,
	Download,
	FileSpreadsheet,
	FileText,
	FolderOpen,
	HardDrive,
	Inbox,
	type LucideIcon,
	MoreVertical,
	Search,
	Send,
	Share2,
	Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_LINK_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEDICAID_DOCUMENT_CATEGORIES,
	MEDICAID_DOCUMENT_QUICK_ACTIONS,
	MEDICAID_DOCUMENT_REPORTING_PERIODS_FILTER,
	MEDICAID_DOCUMENT_STATES_FILTER,
	MEDICAID_DOCUMENT_STATUSES_FILTER,
	MEDICAID_DOCUMENT_STATUS_STYLES,
	MEDICAID_DOCUMENT_TYPES_FILTER,
	MEDICAID_DOCUMENT_TYPE_STYLES,
	MEDICAID_DOCUMENT_VENDORS_FILTER,
	type MedicaidDocumentFileKind,
	type MedicaidDocumentRow,
	filterMedicaidDocuments,
	useMedicaidEncounterDocumentLibraryList,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/feature/queries/useMedicaidEncounterQuery";
import { getProgramScale } from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

function scaleProgramCount(value: number, programType?: ProgramType) {
	if (programType !== "medicare") return value;
	return Math.round(value * getProgramScale("medicare"));
}

function formatProgramFileName(fileName: string, programType?: ProgramType) {
	if (programType !== "medicare") return fileName;
	return fileName
		.replace(/^[A-Z]{2}_Encounter_/, "CMS_ENC_")
		.replace(/^[A-Z]{2}_MMIS_Response_/, "CMS_RESP_")
		.replace(/^[A-Z]{2}_Response_/, "CMS_RESP_")
		.replace(/\.(dat|rsp)$/, ".xml");
}

function formatProgramState(state: string, programType?: ProgramType) {
	if (programType !== "medicare") return state;
	return "CMS";
}

const DOCS_PAGE_STACK = "space-y-5";
const DOCS_TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const DOCS_TABLE_CELL = "px-4 py-2.5";

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

function TrendHint({ delta }: { delta: number }) {
	const positive = delta > 0;
	const Icon = positive ? ArrowUpRight : ArrowDownRight;
	const tone = positive ? "text-emerald-700" : "text-red-600";
	const sign = delta > 0 ? "+" : "";

	return (
		<span className={cn("inline-flex items-center gap-0.5", tone)}>
			<Icon className="size-3" />
			{sign}
			{Math.abs(delta).toFixed(1)}% vs Prior Period
		</span>
	);
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
						"flex size-10 shrink-0 items-center justify-center rounded-md",
						tone
					)}
				>
					<Icon className="size-5 stroke-[2.25]" aria-hidden />
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

function deriveDocumentKpis(docs: MedicaidDocumentRow[]) {
	const countType = (t: string) =>
		docs.filter((d) => d.documentType === t).length;
	return {
		totalDocuments: docs.length,
		totalDocumentsDelta: 0,
		submittedFiles: countType("Submitted File"),
		submittedFilesDelta: 0,
		responseFiles: countType("Response File"),
		responseFilesDelta: 0,
		reports: countType("Validation Report") + countType("Acceptance Report"),
		reportsDelta: 0,
		auditDocuments: countType("Audit Document"),
		auditDocumentsDelta: 0,
		otherDocuments: countType("Other Document"),
		otherDocumentsDelta: 0,
		storageUsedGb: 0,
		storageTotalGb: 0,
	};
}

function DocumentsKpiRow({
	programType,
	kpis,
}: {
	programType?: ProgramType;
	kpis: ReturnType<typeof deriveDocumentKpis>;
}) {
	const k = kpis;

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<DocMetricCard
				label="Total Documents"
				value={scaleProgramCount(
					k.totalDocuments,
					programType
				).toLocaleString()}
				hint={<TrendHint delta={k.totalDocumentsDelta} />}
				icon={FolderOpen}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<DocMetricCard
				label="Submitted Files"
				value={scaleProgramCount(
					k.submittedFiles,
					programType
				).toLocaleString()}
				hint={<TrendHint delta={k.submittedFilesDelta} />}
				icon={Send}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<DocMetricCard
				label={
					programType === "medicare" ? "CMS Response Files" : "Response Files"
				}
				value={scaleProgramCount(k.responseFiles, programType).toLocaleString()}
				hint={<TrendHint delta={k.responseFilesDelta} />}
				icon={Inbox}
				tone="text-emerald-700 bg-emerald-500/10"
			/>
			<DocMetricCard
				label="Reports"
				value={scaleProgramCount(k.reports, programType).toLocaleString()}
				hint={<TrendHint delta={k.reportsDelta} />}
				icon={BarChart3}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<DocMetricCard
				label="Audit Documents"
				value={scaleProgramCount(
					k.auditDocuments,
					programType
				).toLocaleString()}
				hint={<TrendHint delta={k.auditDocumentsDelta} />}
				icon={Shield}
				tone="text-teal-700 bg-teal-500/10"
			/>
			<DocMetricCard
				label="Other Documents"
				value={scaleProgramCount(
					k.otherDocuments,
					programType
				).toLocaleString()}
				hint={<TrendHint delta={k.otherDocumentsDelta} />}
				icon={FileText}
				tone="text-muted-foreground bg-muted/50"
			/>
		</div>
	);
}

function FileKindIcon({ kind }: { kind: MedicaidDocumentFileKind }) {
	if (kind === "xlsx") {
		return <FileSpreadsheet className="size-3.5 shrink-0 text-emerald-600" />;
	}
	if (kind === "dat" || kind === "rsp") {
		return <FileText className="size-3.5 shrink-0 text-sky-600" />;
	}
	if (kind === "txt") {
		return <FileText className="size-3.5 shrink-0 text-muted-foreground" />;
	}
	return <FileText className="size-3.5 shrink-0 text-red-500" />;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
	"cat-submitted": Send,
	"cat-response": Inbox,
	"cat-validation": ClipboardCheck,
	"cat-audit": Shield,
	"cat-acceptance": BarChart3,
	"cat-other": FileText,
};

function DocumentFiltersBar({
	search,
	onSearchChange,
	period,
	onPeriodChange,
	documentType,
	onDocumentTypeChange,
	state,
	onStateChange,
	vendor,
	onVendorChange,
	status,
	onStatusChange,
	onReset,
	programType,
}: {
	search: string;
	onSearchChange: (value: string) => void;
	period: string;
	onPeriodChange: (value: string) => void;
	documentType: string;
	onDocumentTypeChange: (value: string) => void;
	state: string;
	onStateChange: (value: string) => void;
	vendor: string;
	onVendorChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	onReset: () => void;
	programType?: ProgramType;
}) {
	const isMedicare = programType === "medicare";
	return (
		<div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
			<div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))_auto] lg:items-end">
				<div className="space-y-1 lg:col-span-1">
					<Label className="sr-only">Search</Label>
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Search documents by name, type, or description..."
							className="h-9 bg-background pl-9 text-xs"
						/>
					</div>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Reporting Period
					</Label>
					<Select value={period} onValueChange={onPeriodChange}>
						<SelectTrigger className="h-9 bg-background text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICAID_DOCUMENT_REPORTING_PERIODS_FILTER.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Document Type
					</Label>
					<Select value={documentType} onValueChange={onDocumentTypeChange}>
						<SelectTrigger className="h-9 bg-background text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICAID_DOCUMENT_TYPES_FILTER.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{isMedicare ? "Program" : "State"}
					</Label>
					<Select value={state} onValueChange={onStateChange}>
						<SelectTrigger className="h-9 bg-background text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICAID_DOCUMENT_STATES_FILTER.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Vendor / MCO
					</Label>
					<Select value={vendor} onValueChange={onVendorChange}>
						<SelectTrigger className="h-9 bg-background text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICAID_DOCUMENT_VENDORS_FILTER.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Status
					</Label>
					<Select value={status} onValueChange={onStatusChange}>
						<SelectTrigger className="h-9 bg-background text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICAID_DOCUMENT_STATUSES_FILTER.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					variant="link"
					size="sm"
					className="h-9 px-0 text-xs"
					onClick={onReset}
				>
					Reset
				</Button>
			</div>
			<div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
				<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:pb-2">
					Date Range (Uploaded)
				</Label>
				<Input
					type="date"
					defaultValue="2027-04-01"
					className="h-9 bg-background text-xs"
				/>
				<Input
					type="date"
					defaultValue="2027-06-30"
					className="h-9 bg-background text-xs"
				/>
			</div>
		</div>
	);
}

function DocumentDetailsPanel({
	selected,
	programType,
}: {
	selected: MedicaidDocumentRow | null;
	programType?: ProgramType;
}) {
	const isMedicare = programType === "medicare";

	if (!selected) {
		return (
			<CmsEdgeSectionPanel title="Document Details">
				<div className="flex min-h-[160px] flex-col items-center justify-center border-t border-border/50 px-4 py-8 text-center">
					<FileText className="size-10 text-muted-foreground/40" />
					<p className="mt-3 text-sm font-medium text-foreground">
						No document selected
					</p>
					<p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
						Select a document from the list to view details
					</p>
				</div>
			</CmsEdgeSectionPanel>
		);
	}

	return (
		<CmsEdgeSectionPanel title="Document Details">
			<div className="space-y-3 border-t border-border/50 px-4 py-4 text-xs">
				<div>
					<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Document Name
					</p>
					<p className="mt-1 font-medium break-all">
						{formatProgramFileName(selected.name, programType)}
					</p>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Type
						</p>
						<div className="mt-1">
							<StatusPill
								label={selected.documentType}
								className={MEDICAID_DOCUMENT_TYPE_STYLES[selected.documentType]}
							/>
						</div>
					</div>
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Status
						</p>
						<div className="mt-1">
							<StatusPill
								label={selected.status}
								className={MEDICAID_DOCUMENT_STATUS_STYLES[selected.status]}
							/>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							{isMedicare ? "Program" : "State"}
						</p>
						<p className="mt-1">
							{formatProgramState(selected.state, programType)}
						</p>
					</div>
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							File Size
						</p>
						<p className="mt-1 tabular-nums">{selected.fileSize}</p>
					</div>
				</div>
				<div>
					<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Vendor / MCO
					</p>
					<p className="mt-1">{selected.vendor}</p>
				</div>
				<div>
					<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Uploaded
					</p>
					<p className="mt-1 tabular-nums">{selected.uploadedOn}</p>
					<p className="text-muted-foreground">by {selected.uploadedBy}</p>
				</div>
				{selected.description ? (
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Description
						</p>
						<p className="mt-1 text-muted-foreground leading-relaxed">
							{selected.description}
						</p>
					</div>
				) : null}
			</div>
		</CmsEdgeSectionPanel>
	);
}

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
	"dq-1": CloudUpload,
	"dq-2": Download,
	"dq-3": Share2,
	"dq-4": FolderOpen,
};

function QuickActionsPanel() {
	return (
		<CmsEdgeSectionPanel title="Quick Actions">
			<ul className="divide-y divide-border/40 border-t border-border/50">
				{MEDICAID_DOCUMENT_QUICK_ACTIONS.map((action) => {
					const Icon = QUICK_ACTION_ICONS[action.id] ?? FileText;
					return (
						<li key={action.id}>
							<button
								type="button"
								className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
								onClick={() => toast.message(action.title)}
							>
								<Icon className="mt-0.5 size-4 shrink-0 text-primary" />
								<div>
									<p className="text-xs font-semibold text-foreground">
										{action.title}
									</p>
									<p className="mt-0.5 text-[10px] text-muted-foreground">
										{action.description}
									</p>
								</div>
							</button>
						</li>
					);
				})}
			</ul>
		</CmsEdgeSectionPanel>
	);
}

function StorageSummaryPanel({
	kpis,
}: {
	kpis: ReturnType<typeof deriveDocumentKpis>;
}) {
	const k = kpis;
	const hasStorage = k.storageTotalGb > 0;
	const pct = hasStorage ? (k.storageUsedGb / k.storageTotalGb) * 100 : 0;

	return (
		<CmsEdgeSectionPanel title="Storage Summary">
			<div className="space-y-3 border-t border-border/50 px-4 py-4">
				{hasStorage ? (
					<>
						<div className="flex items-center justify-between gap-2 text-xs">
							<span className="font-medium tabular-nums">
								{k.storageUsedGb.toFixed(1)} GB of {k.storageTotalGb} GB used
							</span>
							<span className="text-muted-foreground tabular-nums">
								({pct.toFixed(1)}%)
							</span>
						</div>
						<div className="h-2.5 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${pct}%` }}
							/>
						</div>
					</>
				) : (
					<p className="text-xs text-muted-foreground">Storage metrics —</p>
				)}
				<PanelLink>View Storage Details</PanelLink>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function DocumentLibraryPanel({
	rows,
	selectedId,
	onSelect,
	selectedIds,
	onToggleSelect,
	onToggleAll,
	programType,
}: {
	rows: MedicaidDocumentRow[];
	selectedId: string | null;
	onSelect: (row: MedicaidDocumentRow) => void;
	selectedIds: Set<string>;
	onToggleSelect: (id: string) => void;
	onToggleAll: (checked: boolean) => void;
	programType?: ProgramType;
}) {
	const isMedicare = programType === "medicare";
	const allSelected =
		rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={`Document Library (${scaleProgramCount(rows.length, programType).toLocaleString()})`}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			action={
				<Button
					size="sm"
					className="h-8"
					onClick={() => toast.message("Upload document")}
				>
					<CloudUpload className="mr-1.5 size-3.5" />
					Upload Document
				</Button>
			}
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>
						Showing 1 to {rows.length} of{" "}
						{scaleProgramCount(1248, programType).toLocaleString()} entries
					</span>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							<Button variant="default" size="icon" className="size-7 text-xs">
								1
							</Button>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								2
							</Button>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								3
							</Button>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								4
							</Button>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								5
							</Button>
							<span className="px-1">…</span>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								105
							</Button>
						</div>
						<span className="text-[11px]">Rows per page: 12</span>
					</div>
				</div>
			}
		>
			<CmsEdgeTableScroll className="min-h-[360px] flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1280px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={cn(DOCS_TABLE_HEAD, "w-10 px-3")}>
								<Checkbox
									checked={allSelected}
									onCheckedChange={(checked) => onToggleAll(checked === true)}
									aria-label="Select all documents"
								/>
							</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>Document Name</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>Document Type</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>
								Reporting Period
							</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>
								{isMedicare ? "Program" : "State"}
							</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>Vendor / MCO</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>Uploaded On</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>Uploaded By</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>Status</TableHead>
							<TableHead className={DOCS_TABLE_HEAD}>File Size</TableHead>
							<TableHead className={cn(DOCS_TABLE_HEAD, "pr-4 text-right")}>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow
								key={row.id}
								className={cn(
									"cursor-pointer border-b border-border/40 hover:bg-muted/20",
									selectedId === row.id && "bg-primary/5"
								)}
								onClick={() => onSelect(row)}
							>
								<TableCell
									className={cn(DOCS_TABLE_CELL, "w-10 px-3")}
									onClick={(e) => e.stopPropagation()}
								>
									<Checkbox
										checked={selectedIds.has(row.id)}
										onCheckedChange={() => onToggleSelect(row.id)}
										aria-label={`Select ${row.name}`}
									/>
								</TableCell>
								<TableCell className={DOCS_TABLE_CELL}>
									<span className="flex min-w-0 items-center gap-2">
										<FileKindIcon kind={row.fileKind} />
										<Button
											variant="link"
											className={cn(
												CMS_EDGE_TABLE_LINK_CLASS,
												"whitespace-normal text-left"
											)}
											onClick={(e) => {
												e.stopPropagation();
												onSelect(row);
											}}
										>
											{formatProgramFileName(row.name, programType)}
										</Button>
									</span>
								</TableCell>
								<TableCell className={DOCS_TABLE_CELL}>
									<StatusPill
										label={row.documentType}
										className={MEDICAID_DOCUMENT_TYPE_STYLES[row.documentType]}
									/>
								</TableCell>
								<TableCell className={DOCS_TABLE_CELL}>
									{row.reportingPeriod}
								</TableCell>
								<TableCell className={DOCS_TABLE_CELL}>
									{formatProgramState(row.state, programType)}
								</TableCell>
								<TableCell
									className={cn(DOCS_TABLE_CELL, "text-muted-foreground")}
								>
									{row.vendor}
								</TableCell>
								<TableCell className={cn(DOCS_TABLE_CELL, "tabular-nums")}>
									{row.uploadedOn}
								</TableCell>
								<TableCell className={DOCS_TABLE_CELL}>
									{row.uploadedBy}
								</TableCell>
								<TableCell className={DOCS_TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={MEDICAID_DOCUMENT_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell className={cn(DOCS_TABLE_CELL, "tabular-nums")}>
									{row.fileSize}
								</TableCell>
								<TableCell
									className={cn(DOCS_TABLE_CELL, "pr-4 text-right")}
									onClick={(e) => e.stopPropagation()}
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

function DocumentCategoriesRow() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			{MEDICAID_DOCUMENT_CATEGORIES.map((category) => {
				const Icon = CATEGORY_ICONS[category.id] ?? FolderOpen;
				return (
					<div
						key={category.id}
						className="flex flex-col rounded-lg border border-border/70 bg-card p-4 shadow-sm"
					>
						<div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
							<Icon className="size-5" />
						</div>
						<p className="mt-3 text-sm font-semibold text-foreground">
							{category.title}
						</p>
						<p className="mt-1 text-lg font-bold tabular-nums">
							{category.count.toLocaleString()}
						</p>
						<p className="mt-1 flex-1 text-[11px] leading-snug text-muted-foreground">
							{category.description}
						</p>
						<PanelLink>
							<span className="mt-3 inline-block">View All</span>
						</PanelLink>
					</div>
				);
			})}
		</div>
	);
}

export function MedicaidEncounterDocumentsTab({
	programType = "medicaid",
	reportingPeriod,
}: { programType?: ProgramType; reportingPeriod?: string } = {}) {
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState(reportingPeriod ?? "q2-2027");
	const [documentType, setDocumentType] = useState("All Types");
	const [state, setState] = useState("All States");
	const [vendor, setVendor] = useState("All Vendors");
	const [status, setStatus] = useState("All Statuses");
	const [selectedDoc, setSelectedDoc] = useState<MedicaidDocumentRow | null>(
		null
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const { documentLibrary, isLoading } = useMedicaidEncounterDocumentLibraryList(
		programType,
		period
	);
	const docKpis = deriveDocumentKpis(documentLibrary);

	const rows = useMemo(
		() =>
			filterMedicaidDocuments(documentLibrary, search, {
				documentType,
				state,
				vendor,
				status,
			}),
		[documentLibrary, search, documentType, state, vendor, status]
	);

	const resetFilters = () => {
		setSearch("");
		setPeriod("q2-2027");
		setDocumentType("All Types");
		setState("All States");
		setVendor("All Vendors");
		setStatus("All Statuses");
	};

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleAll = (checked: boolean) => {
		setSelectedIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
	};

	return (
		<div className={DOCS_PAGE_STACK}>
			{isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading documents…
				</p>
			) : null}
			<DocumentsKpiRow programType={programType} kpis={docKpis} />

			<DocumentFiltersBar
				search={search}
				onSearchChange={setSearch}
				period={period}
				onPeriodChange={setPeriod}
				documentType={documentType}
				onDocumentTypeChange={setDocumentType}
				state={state}
				onStateChange={setState}
				vendor={vendor}
				onVendorChange={setVendor}
				status={status}
				onStatusChange={setStatus}
				onReset={resetFilters}
				programType={programType}
			/>

			<CmsEdgeSplitRow
				wideMain
				sideWidth="300px"
				main={
					<DocumentLibraryPanel
						rows={rows}
						selectedId={selectedDoc?.id ?? null}
						onSelect={setSelectedDoc}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onToggleAll={toggleAll}
						programType={programType}
					/>
				}
				side={
					<div className="flex flex-col gap-4">
						<DocumentDetailsPanel
							selected={selectedDoc}
							programType={programType}
						/>
						<QuickActionsPanel />
						<StorageSummaryPanel kpis={docKpis} />
					</div>
				}
			/>

			<div>
				<h3 className="mb-3 text-sm font-semibold text-foreground">
					Document Categories
				</h3>
				<DocumentCategoriesRow />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}
