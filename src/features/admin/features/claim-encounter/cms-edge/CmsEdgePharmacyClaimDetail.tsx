"use client";

import { useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	ArrowLeftRight,
	Ban,
	CalendarDays,
	CheckCircle2,
	CircleDollarSign,
	CreditCard,
	Download,
	FileText,
	type LucideIcon,
	Pill,
	User,
	XCircle,
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
	CMS_EDGE_KPI_CARD_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { useCmsEdgePharmacyClaimDetailQuery } from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import type { CmsEdgePharmacyClaimDetailView } from "@/features/admin/features/claim-encounter/cms-edge/live-pharmacy-claims";
import {
	PHARMACY_CLAIM_DETAIL_STATUS_STYLES,
	PHARMACY_CLAIM_TXN_STYLES,
	PHARMACY_CLAIM_VALIDATION_RESULT_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const DETAIL_TAB_TRIGGER =
	"rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

const SUMMARY_ICONS = {
	user: User,
	id: CreditCard,
	pill: Pill,
	calendar: CalendarDays,
	dollar: CircleDollarSign,
} satisfies Record<
	CmsEdgePharmacyClaimDetailView["summary"][number]["icon"],
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

function ClaimInfoPanel({ claim }: { claim: CmsEdgePharmacyClaimDetailView }) {
	return (
		<CmsEdgeSectionPanel
			title="1. Claim & Prescription Information"
			bodyClassName="px-4 py-4"
		>
			<FieldGrid left={claim.claimInfoLeft} right={claim.claimInfoRight} />
		</CmsEdgeSectionPanel>
	);
}

function DrugInfoPanel({ claim }: { claim: CmsEdgePharmacyClaimDetailView }) {
	return (
		<CmsEdgeSectionPanel
			title="2. Drug & Dispensing Information"
			bodyClassName="px-4 py-4"
		>
			<FieldGrid left={claim.drugInfoLeft} right={claim.drugInfoRight} />
		</CmsEdgeSectionPanel>
	);
}

function FinancialPanel({ claim }: { claim: CmsEdgePharmacyClaimDetailView }) {
	const f = claim.financial;
	return (
		<CmsEdgeSectionPanel title="3. Financial Information" bodyClassName="p-4">
			<div className="overflow-hidden rounded-lg border border-sky-200/80 bg-sky-50/50">
				<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{ label: "Total Allowed Cost", value: f.allowedCost },
						{ label: "Plan Paid Amount", value: f.planPaid },
						{ label: "Member Responsibility", value: f.memberResponsibility },
						{ label: "Financial Difference", value: f.difference },
					].map((item) => (
						<div key={item.label}>
							<p className="text-[11px] text-muted-foreground">{item.label}</p>
							<p className="mt-1 text-base font-semibold tabular-nums text-sky-900">
								{item.value}
							</p>
						</div>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-3 border-t border-sky-200/70 bg-card px-4 py-2.5 text-xs">
					<span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
						<CheckCircle2 className="size-3.5" />
						Balance Check: Allowed Cost = Plan Paid + Member Responsibility
					</span>
					<span className="font-mono tabular-nums text-muted-foreground">
						{f.equation}
					</span>
					<span className="ml-auto">
						<StatusPill
							label={`Status: ${f.status}`}
							className="border-emerald-200/80 bg-emerald-50 text-emerald-800"
						/>
					</span>
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TransactionHistoryPanel({
	claim,
}: {
	claim: CmsEdgePharmacyClaimDetailView;
}) {
	return (
		<CmsEdgeSectionPanel title="4. Transaction History" bodyClassName="pb-2">
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
								Claim ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Original Claim ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Processed Date
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Allowed Cost
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Plan Paid
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
						{claim.transactionHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<span
										className={cn(
											CMS_EDGE_STATUS_PILL_CLASS,
											row.transaction === "Original"
												? PHARMACY_CLAIM_TXN_STYLES.Original
												: "border-sky-200/80 bg-sky-50 text-sky-800"
										)}
									>
										{row.transaction}
									</span>
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.claimId}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.originalClaimId}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.processedDate}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.allowedCost}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.planPaid}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.cmsStatus}
										className={
											PHARMACY_CLAIM_DETAIL_STATUS_STYLES[row.cmsStatus]
										}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.message(`Open ${row.claimId}`)}
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

function ValidationHistoryPanel({
	claim,
}: {
	claim: CmsEdgePharmacyClaimDetailView;
}) {
	return (
		<CmsEdgeSectionPanel title="5. Validation History" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[900px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Validation Rule
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Result
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Message
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Source File
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Reviewed By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{claim.validationHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 tabular-nums text-muted-foreground">
									{row.date}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-medium">
									{row.rule}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.result}
										className={
											PHARMACY_CLAIM_VALIDATION_RESULT_STYLES[row.result]
										}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 text-muted-foreground">
									{row.message}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.sourceFile}
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

function CmsValidationSidebar({
	claim,
}: {
	claim: CmsEdgePharmacyClaimDetailView;
}) {
	const v = claim.cmsValidation;
	return (
		<CmsEdgeSectionPanel title="CMS Validation" bodyClassName="space-y-3 p-4">
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-3 text-center">
					<div className="mx-auto mb-1 flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
						<CheckCircle2 className="size-3.5" />
					</div>
					<p className="text-[10px] font-medium text-emerald-800">Passed</p>
					<p className="text-lg font-semibold tabular-nums text-emerald-800">
						{v.passed}
					</p>
				</div>
				<div className="rounded-md border border-amber-200/80 bg-amber-50 px-2 py-3 text-center">
					<div className="mx-auto mb-1 flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
						<AlertTriangle className="size-3.5" />
					</div>
					<p className="text-[10px] font-medium text-amber-900">Warnings</p>
					<p className="text-lg font-semibold tabular-nums text-amber-900">
						{v.warnings}
					</p>
				</div>
				<div className="rounded-md border border-red-200/80 bg-red-50 px-2 py-3 text-center">
					<div className="mx-auto mb-1 flex size-6 items-center justify-center rounded-full bg-red-100 text-red-700">
						<XCircle className="size-3.5" />
					</div>
					<p className="text-[10px] font-medium text-red-800">Errors</p>
					<p className="text-lg font-semibold tabular-nums text-red-800">
						{v.errors}
					</p>
				</div>
			</div>
			<ul className="divide-y divide-border/40 rounded-md border border-border/60">
				{v.checks.map((check) => (
					<li
						key={check.id}
						className="flex items-center gap-2 px-3 py-2.5 text-xs"
					>
						<CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
						<span className="min-w-0 flex-1 font-medium">{check.label}</span>
						<span className="font-semibold text-emerald-700">
							{check.result}
						</span>
					</li>
				))}
			</ul>
			{v.alert ? (
				<div className="flex items-start gap-2 rounded-md border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-950">
					<AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
					<p>{v.alert}</p>
				</div>
			) : null}
		</CmsEdgeSectionPanel>
	);
}

function SubmissionHistoryPanel({
	claim,
}: {
	claim: CmsEdgePharmacyClaimDetailView;
}) {
	return (
		<CmsEdgeSectionPanel title="Submission History" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Submission Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Reporting Period
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Submitted Date
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								File Name
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{claim.submissionHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 font-medium">
									{row.submissionType}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									{row.reportingPeriod}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.submittedDate}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.status}
										className="border-emerald-200/80 bg-emerald-50 text-emerald-800"
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4 font-mono text-[11px]">
									{row.fileName}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgePharmacyClaimDetail({
	id,
	onBack,
}: {
	id: string;
	onBack: () => void;
}) {
	const [tab, setTab] = useState("overview");
	const {
		data: claim,
		isLoading,
		isError,
		error,
	} = useCmsEdgePharmacyClaimDetailQuery(id);

	if (isLoading) {
		return (
			<div className="flex min-h-[240px] items-center justify-center rounded-sm border border-dashed border-border/70 bg-card px-6 py-12 text-sm text-muted-foreground">
				Loading pharmacy claim…
			</div>
		);
	}

	if (isError || !claim) {
		return (
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Pharmacy Claims
				</Button>
				<div className="flex min-h-[240px] flex-col items-center justify-center rounded-sm border border-dashed border-border/70 bg-card px-6 py-12 text-center">
					<p className="text-sm font-semibold text-foreground">
						Pharmacy claim not found
					</p>
					<p className="mt-1 max-w-md text-sm text-muted-foreground">
						{error instanceof Error
							? error.message
							: "No detail payload returned for this claim id."}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Pharmacy Claims
				</Button>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h2 className="text-xl font-semibold tracking-tight text-foreground">
						Pharmacy Claim Details
					</h2>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm text-muted-foreground">
							Claim ID:{" "}
							<span className="font-semibold text-foreground">
								{claim.claimId}
							</span>
						</span>
						<StatusPill
							label={claim.cmsStatus}
							className={PHARMACY_CLAIM_DETAIL_STATUS_STYLES[claim.cmsStatus]}
							withCheck
						/>
						<span className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
							Transaction: {claim.transaction}
						</span>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					{claim.summary.map((item) => {
						const Icon = SUMMARY_ICONS[item.icon];
						return (
							<div key={item.label} className={CMS_EDGE_KPI_CARD_CLASS}>
								<div className="flex items-start gap-2.5 pl-1.5">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
										<Icon className="size-[18px]" aria-hidden />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
											{item.label}
										</p>
										<p className="mt-1.5 text-sm font-semibold tabular-nums">
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
						<TabsTrigger value="transactions" className={DETAIL_TAB_TRIGGER}>
							Transaction History
						</TabsTrigger>
						<TabsTrigger value="validation" className={DETAIL_TAB_TRIGGER}>
							CMS Validation
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
								<ClaimInfoPanel claim={claim} />
								<DrugInfoPanel claim={claim} />
								<FinancialPanel claim={claim} />
								<TransactionHistoryPanel claim={claim} />
								<ValidationHistoryPanel claim={claim} />
							</div>
						}
						side={<CmsValidationSidebar claim={claim} />}
					/>
				</TabsContent>

				<TabsContent value="transactions" className="mt-4">
					<TransactionHistoryPanel claim={claim} />
				</TabsContent>

				<TabsContent value="validation" className="mt-4 max-w-md">
					<CmsValidationSidebar claim={claim} />
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<SubmissionHistoryPanel claim={claim} />
				</TabsContent>
			</Tabs>

			<div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
				<Button variant="outline" className="h-9" onClick={onBack}>
					<ArrowLeft className="mr-1.5 size-3.5" />
					Return to Pharmacy Claims
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => toast.message("Opening source pharmacy record.")}
				>
					<FileText className="mr-1.5 size-3.5" />
					View Source Record
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => toast.success("Claim export started.")}
				>
					<Download className="mr-1.5 size-3.5" />
					Export Claim
				</Button>
				<div className="ml-auto flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="h-9"
						onClick={() => toast.message("Void draft created.")}
					>
						<Ban className="mr-1.5 size-3.5" />
						Generate Void
					</Button>
					<Button
						className="h-9"
						onClick={() => toast.message("Replacement draft created.")}
					>
						<ArrowLeftRight className="mr-1.5 size-3.5" />
						Generate Replacement
					</Button>
				</div>
			</div>
		</div>
	);
}
