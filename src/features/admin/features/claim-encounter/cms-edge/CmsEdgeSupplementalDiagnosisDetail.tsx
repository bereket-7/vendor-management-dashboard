"use client";

import { useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	Ban,
	CalendarDays,
	CheckCircle2,
	ClipboardList,
	Download,
	FileText,
	Link2,
	type LucideIcon,
	RefreshCw,
	Shield,
	Stethoscope,
	User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_SUPPLEMENTAL_DX_DETAIL,
	SUPPLEMENTAL_DX_DETAIL_STATUS_STYLES,
	SUPPLEMENTAL_DX_HISTORY_RESULT_STYLES,
	SUPPLEMENTAL_DX_TXN_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const DETAIL_TAB_TRIGGER =
	"rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

const SUMMARY_ICONS = {
	user: User,
	clipboard: ClipboardList,
	stethoscope: Stethoscope,
	calendar: CalendarDays,
	shield: Shield,
	link: Link2,
} satisfies Record<
	(typeof CMS_EDGE_SUPPLEMENTAL_DX_DETAIL.summary)[number]["icon"],
	LucideIcon
>;

function StatusPill({
	label,
	className,
	withCheck,
}: {
	label: string;
	className: string;
	withCheck?: boolean;
}) {
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, "gap-1", className)}>
			{withCheck ? <CheckCircle2 className="size-3" /> : null}
			{label}
		</span>
	);
}

function FieldGrid({
	left,
	right,
}: {
	left: readonly { label: string; value: string }[];
	right: readonly { label: string; value: string }[];
}) {
	return (
		<div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
			{[left, right].map((col, colIdx) => (
				<dl key={colIdx} className="space-y-2.5 text-xs">
					{col.map((field) => (
						<div
							key={field.label}
							className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3"
						>
							<dt className="text-muted-foreground">{field.label}</dt>
							<dd className="font-medium text-foreground">{field.value}</dd>
						</div>
					))}
				</dl>
			))}
		</div>
	);
}

function RecordInfoPanel() {
	const d = CMS_EDGE_SUPPLEMENTAL_DX_DETAIL;
	return (
		<CmsEdgeSectionPanel
			title="1. Record & Diagnosis Information"
			bodyClassName="px-4 py-4"
		>
			<FieldGrid left={d.recordInfoLeft} right={d.recordInfoRight} />
		</CmsEdgeSectionPanel>
	);
}

function LinkagePanel() {
	const d = CMS_EDGE_SUPPLEMENTAL_DX_DETAIL;
	return (
		<CmsEdgeSectionPanel
			title="2. Member & Medical Claim Linkage"
			bodyClassName="p-4"
		>
			<div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
				<div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
					<p className="text-sm font-semibold text-foreground">
						{d.memberLink.name}
					</p>
					<dl className="mt-3 space-y-2 text-xs">
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Unique Enrollee ID</dt>
							<dd className="font-mono font-medium">
								{d.memberLink.enrolleeId}
							</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Enrollment Status</dt>
							<dd className="font-semibold text-emerald-700">
								{d.memberLink.enrollmentStatus}
							</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Coverage Period</dt>
							<dd className="font-medium">{d.memberLink.coveragePeriod}</dd>
						</div>
					</dl>
					<Button
						variant="outline"
						size="sm"
						className="mt-4 h-8 w-full text-xs"
						onClick={() => toast.message("Opening member record.")}
					>
						View Member
					</Button>
				</div>

				<div className="flex flex-col items-center gap-1 px-2">
					<div className="hidden h-px w-10 border-t border-dashed border-border lg:block" />
					<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
						<CheckCircle2 className="size-3.5" />
						Matched
					</span>
					<div className="hidden h-px w-10 border-t border-dashed border-border lg:block" />
				</div>

				<div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
					<p className="text-sm font-semibold text-foreground">Medical Claim</p>
					<dl className="mt-3 space-y-2 text-xs">
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Claim ID</dt>
							<dd className="font-mono font-medium">{d.claimLink.claimId}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Claim Status</dt>
							<dd className="font-semibold text-emerald-700">
								{d.claimLink.claimStatus}
							</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Primary Diagnosis</dt>
							<dd className="font-mono font-medium">
								{d.claimLink.primaryDiagnosis}
							</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Allowed Amount</dt>
							<dd className="font-medium tabular-nums">
								{d.claimLink.allowedAmount}
							</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-muted-foreground">Plan Paid</dt>
							<dd className="font-medium tabular-nums">
								{d.claimLink.planPaid}
							</dd>
						</div>
					</dl>
					<Button
						variant="outline"
						size="sm"
						className="mt-4 h-8 w-full text-xs"
						onClick={() => toast.message("Opening medical claim.")}
					>
						View Medical Claim
					</Button>
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TransactionHistoryPanel() {
	return (
		<CmsEdgeSectionPanel title="3. Transaction History" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[860px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Transaction
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Record ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Original Detail Record ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Diagnosis Code
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Processed Date
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								CMS Status
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_SUPPLEMENTAL_DX_DETAIL.transactionHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<span
										className={cn(
											CMS_EDGE_STATUS_PILL_CLASS,
											row.transaction === "Original"
												? SUPPLEMENTAL_DX_TXN_STYLES.Original
												: "border-sky-200/80 bg-sky-50 text-sky-800"
										)}
									>
										{row.transaction}
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.recordId}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.originalDetailRecordId}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.diagnosisCode}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.processedDate}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.cmsStatus}
										className={
											SUPPLEMENTAL_DX_DETAIL_STATUS_STYLES[row.cmsStatus]
										}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.message(`Open ${row.recordId}`)}
									>
										<FileText className="size-3.5" />
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

function SubmissionHistoryPanel() {
	return (
		<CmsEdgeSectionPanel
			title="4. Submission & Validation History"
			bodyClassName="pb-2"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[900px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Activity
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Environment
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Result
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Submitted / Reviewed By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_SUPPLEMENTAL_DX_DETAIL.submissionHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 tabular-nums text-muted-foreground">
									{row.date}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-medium">
									{row.activity}
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.environment}</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.fileName}
								</TableCell>
								<TableCell
									className={cn(
										"px-3 py-2.5 font-semibold",
										SUPPLEMENTAL_DX_HISTORY_RESULT_STYLES[row.result]
									)}
								>
									{row.result}
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 text-muted-foreground">
									{row.reviewedBy}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function CmsValidationSidebar() {
	const v = CMS_EDGE_SUPPLEMENTAL_DX_DETAIL.cmsValidation;
	return (
		<div className="space-y-3">
			<CmsEdgeSectionPanel title="CMS Validation" bodyClassName="space-y-3 p-4">
				<div className="grid grid-cols-3 gap-2">
					<div className="rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-3 text-center">
						<p className="text-[10px] font-medium text-emerald-800">Passed</p>
						<p className="mt-1 text-lg font-semibold tabular-nums text-emerald-800">
							{v.passed}
						</p>
					</div>
					<div className="rounded-md border border-amber-200/80 bg-amber-50 px-2 py-3 text-center">
						<p className="text-[10px] font-medium text-amber-900">Warnings</p>
						<p className="mt-1 text-lg font-semibold tabular-nums text-amber-900">
							{v.warnings}
						</p>
					</div>
					<div className="rounded-md border border-red-200/80 bg-red-50 px-2 py-3 text-center">
						<p className="text-[10px] font-medium text-red-800">Errors</p>
						<p className="mt-1 text-lg font-semibold tabular-nums text-red-800">
							{v.errors}
						</p>
					</div>
				</div>
				<div>
					<p className="mb-2 text-xs font-semibold text-foreground">
						Validation Check
					</p>
					<ul className="divide-y divide-border/40 rounded-md border border-border/60">
						{v.checks.map((check) => (
							<li
								key={check.id}
								className="flex items-center gap-2 px-3 py-2.5 text-xs"
							>
								<CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
								<span className="min-w-0 flex-1 font-medium">
									{check.label}
								</span>
								<span className="font-semibold text-emerald-700">
									{check.result}
								</span>
							</li>
						))}
					</ul>
				</div>
			</CmsEdgeSectionPanel>
			<div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950">
				<AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
				<p>{v.alert}</p>
			</div>
		</div>
	);
}

export function CmsEdgeSupplementalDiagnosisDetail({
	onBack,
}: {
	onBack: () => void;
}) {
	const [tab, setTab] = useState("overview");
	const detail = CMS_EDGE_SUPPLEMENTAL_DX_DETAIL;

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Supplemental Diagnoses
				</Button>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h2 className="text-xl font-semibold tracking-tight text-foreground">
						Supplemental Diagnosis Details
					</h2>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm text-muted-foreground">
							Record ID:{" "}
							<span className="font-semibold text-foreground">
								{detail.recordId}
							</span>
						</span>
						<StatusPill
							label={detail.cmsStatus}
							className={SUPPLEMENTAL_DX_DETAIL_STATUS_STYLES[detail.cmsStatus]}
							withCheck
						/>
						<span
							className={cn(
								CMS_EDGE_STATUS_PILL_CLASS,
								SUPPLEMENTAL_DX_TXN_STYLES[detail.transaction]
							)}
						>
							{detail.transaction}
						</span>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					{detail.summary.map((item) => {
						const Icon = SUMMARY_ICONS[item.icon];
						return (
							<div
								key={item.label}
								className="rounded-lg border border-border/70 bg-card p-3 shadow-sm"
							>
								<div className="flex items-start gap-2.5">
									<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
										<Icon className="size-4" aria-hidden />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] text-muted-foreground">
											{item.label}
										</p>
										<p
											className={cn(
												"mt-0.5 text-sm font-semibold",
												item.label === "Claim Link" && "text-emerald-700"
											)}
										>
											{item.value}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<div className="border-b border-border/70 bg-card">
					<TabsList className="h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
						<TabsTrigger value="overview" className={DETAIL_TAB_TRIGGER}>
							Overview
						</TabsTrigger>
						<TabsTrigger value="validation" className={DETAIL_TAB_TRIGGER}>
							Validation
						</TabsTrigger>
						<TabsTrigger value="transactions" className={DETAIL_TAB_TRIGGER}>
							Transaction History
						</TabsTrigger>
						<TabsTrigger value="submissions" className={DETAIL_TAB_TRIGGER}>
							Submission History
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="mt-4 space-y-0">
					<CmsEdgeSplitRow
						className="gap-4"
						sideWidth="300px"
						align="start"
						main={
							<div className="space-y-4">
								<RecordInfoPanel />
								<LinkagePanel />
								<TransactionHistoryPanel />
								<SubmissionHistoryPanel />
							</div>
						}
						side={<CmsValidationSidebar />}
					/>
				</TabsContent>

				<TabsContent value="validation" className="mt-4 max-w-md">
					<CmsValidationSidebar />
				</TabsContent>

				<TabsContent value="transactions" className="mt-4">
					<TransactionHistoryPanel />
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<SubmissionHistoryPanel />
				</TabsContent>
			</Tabs>

			<div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
				<Button variant="outline" className="h-9" onClick={onBack}>
					<ArrowLeft className="mr-1.5 size-3.5" />
					Return to Diagnoses
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => toast.message("Opening source supplemental record.")}
				>
					<FileText className="mr-1.5 size-3.5" />
					View Source Record
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => toast.success("Record export started.")}
				>
					<Download className="mr-1.5 size-3.5" />
					Export Record
				</Button>
				<div className="ml-auto flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="h-9 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
						onClick={() => toast.message("Void draft created.")}
					>
						<Ban className="mr-1.5 size-3.5" />
						Generate Void
					</Button>
					<Button
						className="h-9"
						onClick={() => toast.message("Replacement draft created.")}
					>
						<RefreshCw className="mr-1.5 size-3.5" />
						Generate Replacement
					</Button>
				</div>
			</div>
		</div>
	);
}
