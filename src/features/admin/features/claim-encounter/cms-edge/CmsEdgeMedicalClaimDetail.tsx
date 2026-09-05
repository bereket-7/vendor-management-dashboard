"use client";

import { Fragment, useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	Ban,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleDollarSign,
	Download,
	FileText,
	type LucideIcon,
	Pencil,
	RefreshCw,
	Shield,
	User,
	Wallet,
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
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgePairRow,
	CmsEdgeSectionPanel,
	CmsEdgeSplitRow,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_MEDICAL_CLAIM_DETAIL,
	MEDICAL_CLAIM_DETAIL_STATUS_STYLES,
	MEDICAL_CLAIM_LINE_VALIDATION_STYLES,
	MEDICAL_CLAIM_TXN_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const DETAIL_TAB_TRIGGER =
	"rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

const SUMMARY_ICONS = {
	user: User,
	shield: Shield,
	file: FileText,
	calendar: CalendarDays,
	dollar: CircleDollarSign,
	wallet: Wallet,
} satisfies Record<
	(typeof CMS_EDGE_MEDICAL_CLAIM_DETAIL.summary)[number]["icon"],
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

function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});
}

function ClaimHeaderPanel() {
	const d = CMS_EDGE_MEDICAL_CLAIM_DETAIL;
	return (
		<CmsEdgeSectionPanel title="1. Claim Header" bodyClassName="px-4 py-4">
			<div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
				{[d.headerLeft, d.headerRight].map((col, colIdx) => (
					<dl key={colIdx} className="space-y-2.5 text-xs">
						{col.map((field) => (
							<div
								key={field.label}
								className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3"
							>
								<dt className="text-muted-foreground">{field.label}</dt>
								<dd className="font-medium text-foreground">
									{field.value}
									{"link" in field && field.link ? (
										<Button
											variant="link"
											className="ml-2 h-auto p-0 text-[11px] font-semibold text-primary"
											onClick={() => toast.message(`Open ${field.link}`)}
										>
											{field.link} →
										</Button>
									) : null}
								</dd>
							</div>
						))}
					</dl>
				))}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ClaimLinesPanel() {
	const [expandedLine, setExpandedLine] = useState<string | null>("line-3");
	const lines = CMS_EDGE_MEDICAL_CLAIM_DETAIL.lines;
	const totals = CMS_EDGE_MEDICAL_CLAIM_DETAIL.lineTotals;

	return (
		<CmsEdgeSectionPanel title="2. Medical Claim Lines" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1100px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Line</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Service From
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Service To
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Revenue Code
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Procedure Code
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Modifiers
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Place of Service
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Rendering Provider NPI
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Allowed
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Plan Paid
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Validation
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{lines.map((row) => {
							const open = expandedLine === row.id;
							return (
								<Fragment key={row.id}>
									<TableRow
										className={cn(
											"border-b border-border/40 hover:bg-muted/20",
											row.validation === "Warning" && "bg-amber-50/70"
										)}
									>
										<TableCell className="px-3 py-2.5 tabular-nums font-medium">
											{row.line}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.serviceFrom}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.serviceTo}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.revenueCode}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px] font-semibold">
											{row.procedureCode}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.modifiers}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.placeOfService}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.renderingNpi}
										</TableCell>
										<TableCell className="px-3 py-2.5 text-right tabular-nums">
											{formatCurrency(row.allowed)}
										</TableCell>
										<TableCell className="px-3 py-2.5 text-right tabular-nums">
											{formatCurrency(row.planPaid)}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span
												className={cn(
													"inline-flex items-center gap-1 text-xs font-semibold",
													MEDICAL_CLAIM_LINE_VALIDATION_STYLES[row.validation]
												)}
											>
												{row.validation === "Passed" ? (
													<CheckCircle2 className="size-3.5" />
												) : (
													<AlertTriangle className="size-3.5" />
												)}
												{row.validation}
											</span>
										</TableCell>
										<TableCell className="px-3 py-2.5 pr-4">
											<Button
												variant="outline"
												size="sm"
												className="h-7 gap-1 px-2 text-xs"
												onClick={() => setExpandedLine(open ? null : row.id)}
											>
												{open ? "Collapse" : "Expand"}
												{open ? (
													<ChevronDown className="size-3" />
												) : (
													<ChevronRight className="size-3" />
												)}
											</Button>
										</TableCell>
									</TableRow>
									{open && row.warning ? (
										<TableRow className="border-b border-amber-200/80 bg-amber-50/80 hover:bg-amber-50/80">
											<TableCell colSpan={12} className="px-4 py-3">
												<div className="rounded-md border border-amber-200/80 bg-card/80 p-3">
													<p className="text-xs font-semibold text-amber-900">
														CMS Warning {row.warning.code}
													</p>
													<p className="mt-1 text-xs text-amber-950">
														{row.warning.message}
													</p>
													<p className="mt-2 text-[11px] text-muted-foreground">
														<span className="font-semibold text-foreground">
															Recommended Action:{" "}
														</span>
														{row.warning.recommendedAction}
													</p>
													<div className="mt-3 flex flex-wrap gap-2">
														<Button
															variant="outline"
															size="sm"
															className="h-8 text-xs"
															onClick={() =>
																toast.message("Opening source line.")
															}
														>
															View Source Line
														</Button>
														<Button
															size="sm"
															className="h-8 text-xs"
															onClick={() =>
																toast.message("Correction draft created.")
															}
														>
															Create Correction
														</Button>
													</div>
												</div>
											</TableCell>
										</TableRow>
									) : null}
								</Fragment>
							);
						})}
						<TableRow className="border-t border-border/60 bg-muted/20 hover:bg-muted/20">
							<TableCell
								colSpan={8}
								className="px-3 py-2.5 text-right text-xs font-semibold"
							>
								Totals
							</TableCell>
							<TableCell className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums">
								{formatCurrency(totals.allowed)}
							</TableCell>
							<TableCell className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums">
								{formatCurrency(totals.planPaid)}
							</TableCell>
							<TableCell colSpan={2} />
						</TableRow>
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function CmsValidationSidebar() {
	const [openSection, setOpenSection] = useState<
		"warnings" | "errors" | "passed"
	>("warnings");
	const v = CMS_EDGE_MEDICAL_CLAIM_DETAIL.cmsValidation;

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

			<div className="space-y-2">
				{(
					[
						{
							id: "warnings" as const,
							label: `Warnings (${v.warnings})`,
							body: (
								<div className="space-y-2 text-xs">
									<p className="font-semibold text-foreground">
										{v.warningDetail.title}
									</p>
									<dl className="space-y-1.5 text-muted-foreground">
										<div className="flex justify-between gap-2">
											<dt>Affected Field</dt>
											<dd className="font-medium text-foreground">
												{v.warningDetail.affectedField}
											</dd>
										</div>
										<div className="flex justify-between gap-2">
											<dt>Affected Line</dt>
											<dd className="font-medium text-foreground">
												{v.warningDetail.affectedLine}
											</dd>
										</div>
										<div className="flex justify-between gap-2">
											<dt>CMS Code</dt>
											<dd className="font-mono font-medium text-foreground">
												{v.warningDetail.cmsCode}
											</dd>
										</div>
										<div className="flex justify-between gap-2">
											<dt>Severity</dt>
											<dd className="font-medium text-amber-700">
												{v.warningDetail.severity}
											</dd>
										</div>
									</dl>
									<p className="text-amber-950">{v.warningDetail.message}</p>
								</div>
							),
						},
						{
							id: "errors" as const,
							label: `Errors (${v.errors})`,
							body: (
								<p className="text-xs text-muted-foreground">
									No validation errors.
								</p>
							),
						},
						{
							id: "passed" as const,
							label: `Passed (${v.passed})`,
							body: (
								<p className="text-xs text-muted-foreground">
									All other validation checks passed.
								</p>
							),
						},
					] as const
				).map((section) => {
					const open = openSection === section.id;
					return (
						<div
							key={section.id}
							className="overflow-hidden rounded-md border border-border/60"
						>
							<button
								type="button"
								className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold"
								onClick={() => setOpenSection(section.id)}
							>
								{section.label}
								{open ? (
									<ChevronDown className="size-3.5 text-muted-foreground" />
								) : (
									<ChevronRight className="size-3.5 text-muted-foreground" />
								)}
							</button>
							{open ? (
								<div className="border-t border-border/50 bg-muted/10 px-3 py-2.5">
									{section.body}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TransactionHistoryPanel() {
	return (
		<CmsEdgeSectionPanel title="Transaction History" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
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
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_MEDICAL_CLAIM_DETAIL.transactionHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">
									<span
										className={cn(
											CMS_EDGE_STATUS_PILL_CLASS,
											row.transaction === "Original"
												? MEDICAL_CLAIM_TXN_STYLES.Original
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
									{row.date}
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<StatusPill
										label={row.cmsStatus}
										className={
											MEDICAL_CLAIM_DETAIL_STATUS_STYLES[row.cmsStatus]
										}
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

function SubmissionHistoryPanel() {
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
								Environment
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Submitted Date
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								CMS Response
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_MEDICAL_CLAIM_DETAIL.submissionHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5">{row.environment}</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.fileName}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.submittedDate}
								</TableCell>
								<TableCell className="px-3 py-2.5">{row.cmsResponse}</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<StatusPill
										label={row.status}
										className="border-emerald-200/80 bg-emerald-50 text-emerald-800"
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

export function CmsEdgeMedicalClaimDetail({ onBack }: { onBack: () => void }) {
	const [tab, setTab] = useState("overview");
	const claim = CMS_EDGE_MEDICAL_CLAIM_DETAIL;

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Medical Claims
				</Button>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h2 className="text-xl font-semibold tracking-tight text-foreground">
						Medical Claim Details
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
							className={MEDICAL_CLAIM_DETAIL_STATUS_STYLES[claim.cmsStatus]}
							withCheck
						/>
						<span
							className={cn(
								CMS_EDGE_STATUS_PILL_CLASS,
								MEDICAL_CLAIM_TXN_STYLES[claim.transaction]
							)}
						>
							{claim.transaction}
						</span>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					{claim.summary.map((item) => {
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
										<p className="mt-0.5 text-sm font-semibold tabular-nums">
											{item.value}
										</p>
										{"link" in item && item.link ? (
											<Button
												variant="link"
												className="mt-0.5 h-auto p-0 text-[11px] font-semibold text-primary"
												onClick={() => toast.message("Opening member.")}
											>
												{item.link} →
											</Button>
										) : null}
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
						<TabsTrigger value="submissions" className={DETAIL_TAB_TRIGGER}>
							Submission History
						</TabsTrigger>
						<TabsTrigger value="audit" className={DETAIL_TAB_TRIGGER}>
							Audit History
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="mt-4 space-y-4">
					<CmsEdgeSplitRow
						className="gap-4"
						sideWidth="300px"
						align="start"
						main={
							<div className="space-y-4">
								<ClaimHeaderPanel />
								<ClaimLinesPanel />
							</div>
						}
						side={<CmsValidationSidebar />}
					/>
					<CmsEdgePairRow
						className="gap-4"
						left={<TransactionHistoryPanel />}
						right={<SubmissionHistoryPanel />}
					/>
				</TabsContent>

				<TabsContent value="transactions" className="mt-4">
					<TransactionHistoryPanel />
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<SubmissionHistoryPanel />
				</TabsContent>

				<TabsContent value="audit" className="mt-4">
					<CmsEdgeSectionPanel title="Audit History" bodyClassName="p-4">
						<p className="text-sm text-muted-foreground">
							No audit events for this claim in the selected reporting period.
						</p>
					</CmsEdgeSectionPanel>
				</TabsContent>
			</Tabs>

			<div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
				<Button variant="outline" className="h-9" onClick={onBack}>
					<ArrowLeft className="mr-1.5 size-3.5" />
					Return to Claims
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => toast.message("Opening source medical claim.")}
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
						Create Void
					</Button>
					<Button
						variant="outline"
						className="h-9"
						onClick={() => toast.message("Replacement draft created.")}
					>
						<RefreshCw className="mr-1.5 size-3.5" />
						Create Replacement
					</Button>
					<Button
						className="h-9"
						onClick={() => toast.message("Correction draft created.")}
					>
						<Pencil className="mr-1.5 size-3.5" />
						Create Correction
					</Button>
				</div>
			</div>
		</div>
	);
}
