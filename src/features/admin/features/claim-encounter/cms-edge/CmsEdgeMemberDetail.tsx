"use client";

import { useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Download,
	Pencil,
	UserRound,
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
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_MEMBER_DETAIL,
	MEMBER_CMS_STATUS_STYLES,
	MEMBER_VALIDATION_RESULT_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const DETAIL_TAB_TRIGGER =
	"rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

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
			{withCheck ? <CheckCircle2 className="size-3" aria-hidden /> : null}
			{label}
		</span>
	);
}

function IdentificationPanel() {
	const fields = CMS_EDGE_MEMBER_DETAIL.identification;
	const mid = Math.ceil(fields.length / 2);
	const left = fields.slice(0, mid);
	const right = fields.slice(mid);

	return (
		<CmsEdgeSectionPanel
			title="1. Member & CMS Identification"
			bodyClassName="px-4 py-4"
		>
			<div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
				{[left, right].map((col, colIdx) => (
					<dl key={colIdx} className="space-y-2.5 text-xs">
						{col.map((field) => (
							<div
								key={field.label}
								className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-3"
							>
								<dt className="text-muted-foreground">{field.label}</dt>
								<dd className="font-medium text-foreground">{field.value}</dd>
							</div>
						))}
					</dl>
				))}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function EnrollmentPeriodsPanel() {
	return (
		<CmsEdgeSectionPanel title="2. Enrollment Periods" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[980px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Plan ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Coverage Start
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Coverage End
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Monthly Premium
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								EHB
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Federal APTC
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								State Subsidy
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								ICHRA / QSEHRA
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
						{CMS_EDGE_MEMBER_DETAIL.enrollmentPeriods.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.planId}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.coverageStart}
								</TableCell>
								<TableCell className="px-3 py-2.5 tabular-nums">
									{row.coverageEnd}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.monthlyPremium}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.ehb}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.federalAptc}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.stateSubsidy}
								</TableCell>
								<TableCell className="px-3 py-2.5 text-right tabular-nums">
									{row.ichra}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.cmsStatus}
										className={MEMBER_CMS_STATUS_STYLES[row.cmsStatus]}
									/>
								</TableCell>
								<TableCell className="px-3 py-2.5 pr-4">
									<Button
										variant="link"
										className="h-auto p-0 text-xs font-semibold text-primary"
									>
										View
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

function ValidationHistoryPanel() {
	return (
		<CmsEdgeSectionPanel title="3. Validation History" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[860px]")}
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
						{CMS_EDGE_MEMBER_DETAIL.validationHistory.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className="px-3 py-2.5 tabular-nums text-muted-foreground">
									{row.date}
								</TableCell>
								<TableCell className="px-3 py-2.5 font-mono text-[11px]">
									{row.rule}
								</TableCell>
								<TableCell className="px-3 py-2.5">
									<StatusPill
										label={row.result}
										className={MEMBER_VALIDATION_RESULT_STYLES[row.result]}
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

function FamilyRelationshipsCard() {
	return (
		<CmsEdgeSectionPanel title="Family Relationships" bodyClassName="px-4 py-4">
			<ul className="relative space-y-4 pl-1">
				{CMS_EDGE_MEMBER_DETAIL.family.map((member, index) => (
					<li key={member.id} className="relative flex gap-3">
						{index < CMS_EDGE_MEMBER_DETAIL.family.length - 1 ? (
							<span
								className="absolute top-5 left-[7px] h-[calc(100%+4px)] w-px bg-border"
								aria-hidden
							/>
						) : null}
						<span
							className={cn(
								"relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2",
								member.primary
									? "border-primary bg-primary"
									: "border-primary/50 bg-card"
							)}
							aria-hidden
						/>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-foreground">
								{member.name}
							</p>
							<p className="text-xs text-muted-foreground">
								{member.role} · {member.uniqueEnrolleeId}
							</p>
						</div>
					</li>
				))}
			</ul>
		</CmsEdgeSectionPanel>
	);
}

function CurrentValidationCard() {
	const v = CMS_EDGE_MEMBER_DETAIL.currentValidation;
	return (
		<CmsEdgeSectionPanel
			title="Current Validation"
			bodyClassName="space-y-3 p-4"
		>
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-3 text-center">
					<p className="text-[10px] font-medium uppercase tracking-wide text-emerald-800">
						Passed
					</p>
					<p className="mt-1 text-lg font-semibold tabular-nums text-emerald-800">
						{v.passed}
					</p>
				</div>
				<div className="rounded-md border border-amber-200/80 bg-amber-50 px-2 py-3 text-center">
					<p className="text-[10px] font-medium uppercase tracking-wide text-amber-900">
						Warnings
					</p>
					<p className="mt-1 text-lg font-semibold tabular-nums text-amber-900">
						{v.warnings}
					</p>
				</div>
				<div className="rounded-md border border-red-200/80 bg-red-50 px-2 py-3 text-center">
					<p className="text-[10px] font-medium uppercase tracking-wide text-red-800">
						Errors
					</p>
					<p className="mt-1 text-lg font-semibold tabular-nums text-red-800">
						{v.errors}
					</p>
				</div>
			</div>
			<div className="flex items-start gap-2 rounded-md border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-950">
				<AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
				<p>{v.alert}</p>
			</div>
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
								File
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_MEMBER_DETAIL.submissionHistory.map((row) => (
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
										className={MEMBER_CMS_STATUS_STYLES.Accepted}
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

export function CmsEdgeMemberDetail({ onBack }: { onBack: () => void }) {
	const [tab, setTab] = useState("overview");
	const member = CMS_EDGE_MEMBER_DETAIL;

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Members & Enrollment
				</Button>
				<h2 className="text-xl font-semibold tracking-tight text-foreground">
					Member Details
				</h2>

				<div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
					<div className="flex flex-wrap items-center gap-3 border-b border-border/50 px-4 py-4">
						<div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
							<UserRound className="size-5" aria-hidden />
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<p className="text-base font-semibold text-foreground">
									{member.name}
								</p>
								<StatusPill
									label={member.cmsStatus}
									className={MEMBER_CMS_STATUS_STYLES[member.cmsStatus]}
									withCheck
								/>
							</div>
							<p className="mt-0.5 text-sm text-muted-foreground">
								Unique Enrollee ID:{" "}
								<span className="font-medium text-foreground">
									{member.uniqueEnrolleeId}
								</span>
							</p>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-px border-t-0 bg-border/40 sm:grid-cols-3 xl:grid-cols-6">
						{member.summary.map((item) => (
							<div key={item.label} className="bg-card px-4 py-3">
								<p className="text-[11px] text-muted-foreground">
									{item.label}
								</p>
								<p
									className={cn(
										"mt-1 text-sm font-semibold",
										item.tone === "success"
											? "text-emerald-700"
											: "text-foreground"
									)}
								>
									{item.value}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<div className="border-b border-border/70 bg-card">
					<TabsList className="h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
						<TabsTrigger value="overview" className={DETAIL_TAB_TRIGGER}>
							Overview
						</TabsTrigger>
						<TabsTrigger value="enrollment" className={DETAIL_TAB_TRIGGER}>
							Enrollment Periods
						</TabsTrigger>
						<TabsTrigger value="family" className={DETAIL_TAB_TRIGGER}>
							Family Relationships
						</TabsTrigger>
						<TabsTrigger value="validation" className={DETAIL_TAB_TRIGGER}>
							Validation History
						</TabsTrigger>
						<TabsTrigger value="submissions" className={DETAIL_TAB_TRIGGER}>
							Submission History
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="mt-4 space-y-0">
					<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
						<div className="space-y-4">
							<IdentificationPanel />
							<EnrollmentPeriodsPanel />
							<ValidationHistoryPanel />
						</div>
						<div className="space-y-4">
							<FamilyRelationshipsCard />
							<CurrentValidationCard />
						</div>
					</div>
				</TabsContent>

				<TabsContent value="enrollment" className="mt-4">
					<EnrollmentPeriodsPanel />
				</TabsContent>

				<TabsContent value="family" className="mt-4 max-w-md">
					<FamilyRelationshipsCard />
				</TabsContent>

				<TabsContent value="validation" className="mt-4">
					<ValidationHistoryPanel />
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<SubmissionHistoryPanel />
				</TabsContent>
			</Tabs>

			<div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
				<Button variant="outline" className="h-9" onClick={onBack}>
					Return to Members
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() =>
						toast.message("Source record opens in enrollment feed.")
					}
				>
					View Source Record
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => toast.success("Member export started.")}
				>
					<Download className="mr-1.5 size-3.5" />
					Export Member
				</Button>
				<Button
					className="h-9"
					onClick={() => toast.message("Correction workflow opened.")}
				>
					<Pencil className="mr-1.5 size-3.5" />
					Create Correction
				</Button>
			</div>
		</div>
	);
}
