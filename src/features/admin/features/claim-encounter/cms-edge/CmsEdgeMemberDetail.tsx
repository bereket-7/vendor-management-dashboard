"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	useCmsEdgeMemberDetailQuery,
	useExportEdgeMemberDetailCsv,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import type { CmsEdgeMemberDetailView } from "@/features/admin/features/claim-encounter/cms-edge/live-members";
import {
	MEMBER_CMS_STATUS_STYLES,
	MEMBER_VALIDATION_RESULT_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { useCreateMemberExceptionMutation } from "@/features/admin/features/members/feature/queries/useMembersQuery";
import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { downloadBlob, stampFilename } from "@/lib/export/csv";
import { cn } from "@/lib/utils";

const CORRECTION_TYPES = [
	"Coverage Mismatch",
	"Unmapped Plan ID",
	"Missing Subscriber ID",
	"Invalid Coverage Dates",
	"Identity / Demographics",
	"Eligibility Status",
	"Other",
] as const;

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

function IdentificationPanel({ member }: { member: CmsEdgeMemberDetailView }) {
	const fields = member.identification;
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

function EnrollmentPeriodsPanel({
	member,
}: {
	member: CmsEdgeMemberDetailView;
}) {
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
						{member.enrollmentPeriods.map((row) => (
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

function ValidationHistoryPanel({
	member,
}: {
	member: CmsEdgeMemberDetailView;
}) {
	return (
		<CmsEdgeSectionPanel
			title="3. Corrections & exceptions"
			bodyClassName="pb-2"
		>
			<p className="border-b border-border/50 px-4 py-2 text-[11px] text-muted-foreground">
				Saved on this member via{" "}
				<code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
					POST /api/v1/members/&#123;id&#125;/exceptions/create/
				</code>
				. Also under Admin → Members → Exceptions.
			</p>
			<CmsEdgeTableScroll>
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[860px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Correction type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Result
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Message
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Source
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Reviewed By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{member.validationHistory.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="px-3 py-8 text-center text-muted-foreground"
								>
									No corrections or exceptions for this member yet.
								</TableCell>
							</TableRow>
						) : (
							member.validationHistory.map((row) => (
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
							))
						)}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function FamilyRelationshipsCard({
	member,
}: {
	member: CmsEdgeMemberDetailView;
}) {
	return (
		<CmsEdgeSectionPanel title="Family Relationships" bodyClassName="px-4 py-4">
			{member.family.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No family members linked.
				</p>
			) : (
				<ul className="relative space-y-4 pl-1">
					{member.family.map((famMember, index) => (
						<li key={famMember.id} className="relative flex gap-3">
							{index < member.family.length - 1 ? (
								<span
									className="absolute top-5 left-[7px] h-[calc(100%+4px)] w-px bg-border"
									aria-hidden
								/>
							) : null}
							<span
								className={cn(
									"relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2",
									famMember.primary
										? "border-primary bg-primary"
										: "border-primary/50 bg-card"
								)}
								aria-hidden
							/>
							<div className="min-w-0">
								<p className="text-sm font-semibold text-foreground">
									{famMember.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{famMember.role} · {famMember.uniqueEnrolleeId}
								</p>
							</div>
						</li>
					))}
				</ul>
			)}
		</CmsEdgeSectionPanel>
	);
}

function CurrentValidationCard({
	member,
}: {
	member: CmsEdgeMemberDetailView;
}) {
	const v = member.currentValidation;
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
	member,
}: {
	member: CmsEdgeMemberDetailView;
}) {
	return (
		<CmsEdgeSectionPanel
			title="Change / Eligibility History"
			bodyClassName="pb-2"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Event Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Field / Period
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Detail
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{member.submissionHistory.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="px-3 py-8 text-center text-muted-foreground"
								>
									No change or eligibility history for this member.
								</TableCell>
							</TableRow>
						) : (
							member.submissionHistory.map((row) => (
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
							))
						)}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgeMemberDetail({
	id,
	onBack,
}: {
	id: string;
	onBack: () => void;
}) {
	const queryClient = useQueryClient();
	const [tab, setTab] = useState("overview");
	const [correctionOpen, setCorrectionOpen] = useState(false);
	const [correctionType, setCorrectionType] = useState<string>(
		CORRECTION_TYPES[0]
	);
	const [correctionCustomType, setCorrectionCustomType] = useState("");
	const [correctionNotes, setCorrectionNotes] = useState("");
	const createCorrection = useCreateMemberExceptionMutation(id);
	const exportDetail = useExportEdgeMemberDetailCsv();
	const {
		data: member,
		isLoading,
		isError,
		error,
	} = useCmsEdgeMemberDetailQuery(id);

	function resetCorrectionForm() {
		setCorrectionType(CORRECTION_TYPES[0]);
		setCorrectionCustomType("");
		setCorrectionNotes("");
	}

	async function submitCorrection() {
		const resolvedType =
			correctionType === "Other"
				? correctionCustomType.trim()
				: correctionType.trim();
		if (!resolvedType) {
			toast.error("Correction type is required.");
			return;
		}

		const notes =
			correctionNotes.trim() ||
			`CMS EDGE correction for enrollee ${member?.uniqueEnrolleeId ?? id}`;

		try {
			const created = await createCorrection.mutateAsync({
				exception_type: resolvedType,
				description: notes,
				status: "open",
				source: "cms-edge",
			});

			const historyKey = featureQueryKey("cms-edge", "memberDetail", { id });
			queryClient.setQueryData(
				historyKey,
				(prev: CmsEdgeMemberDetailView | null | undefined) => {
					if (!prev) return prev;
					const nextRow = {
						id: created.id,
						date: new Date().toLocaleDateString("en-US", {
							month: "2-digit",
							day: "2-digit",
							year: "numeric",
						}),
						rule: created.exceptionType || resolvedType,
						result: "Failed" as const,
						message: created.description || notes,
						sourceFile: created.source || "cms-edge",
						reviewedBy: "—",
					};
					const validationHistory = [
						nextRow,
						...prev.validationHistory.filter((row) => row.id !== created.id),
					];
					return {
						...prev,
						validationHistory,
						currentValidation: {
							passed: validationHistory.filter((v) => v.result === "Passed")
								.length,
							warnings: validationHistory.filter((v) => v.result === "Warning")
								.length,
							errors: validationHistory.filter((v) => v.result === "Failed")
								.length,
							alert: `Open correction: ${nextRow.rule}`,
						},
					};
				}
			);

			// Background refresh — keep optimistic row if list lag/empty.
			void queryClient.invalidateQueries({
				queryKey: historyKey,
				refetchType: "active",
			});
			toast.success("Correction saved to member exceptions.");
			setCorrectionOpen(false);
			resetCorrectionForm();
			setTab("validation");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create correction."
			);
		}
	}

	if (isLoading) {
		return (
			<div className="flex min-h-[240px] items-center justify-center rounded-sm border border-dashed border-border/70 bg-card px-6 py-12 text-sm text-muted-foreground">
				Loading member…
			</div>
		);
	}

	if (isError || !member) {
		return (
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Members & Enrollment
				</Button>
				<div className="flex min-h-[240px] flex-col items-center justify-center rounded-sm border border-dashed border-border/70 bg-card px-6 py-12 text-center">
					<p className="text-sm font-semibold text-foreground">
						Member not found
					</p>
					<p className="mt-1 max-w-md text-sm text-muted-foreground">
						{error instanceof Error
							? error.message
							: "No detail payload returned for this member id."}
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
							Corrections
						</TabsTrigger>
						<TabsTrigger value="submissions" className={DETAIL_TAB_TRIGGER}>
							Submission History
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="mt-4 space-y-0">
					<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
						<div className="space-y-4">
							<IdentificationPanel member={member} />
							<EnrollmentPeriodsPanel member={member} />
							<ValidationHistoryPanel member={member} />
						</div>
						<div className="space-y-4">
							<FamilyRelationshipsCard member={member} />
							<CurrentValidationCard member={member} />
						</div>
					</div>
				</TabsContent>

				<TabsContent value="enrollment" className="mt-4">
					<EnrollmentPeriodsPanel member={member} />
				</TabsContent>

				<TabsContent value="family" className="mt-4 max-w-md">
					<FamilyRelationshipsCard member={member} />
				</TabsContent>

				<TabsContent value="validation" className="mt-4">
					<ValidationHistoryPanel member={member} />
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<SubmissionHistoryPanel member={member} />
				</TabsContent>
			</Tabs>

			<div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
				<Button variant="outline" className="h-9" onClick={onBack}>
					Return to Members
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => {
						if (member.sourceRecordLabel) {
							toast.message(`Source record: ${member.sourceRecordLabel}`);
						} else {
							toast.message("No source record linked for this member.");
						}
					}}
				>
					View Source Record
				</Button>
				<Button
					variant="outline"
					className="h-9"
					disabled={exportDetail.isPending}
					onClick={() => {
						void exportDetail
							.mutateAsync(member.id)
							.then(({ blob, filename }) => {
								downloadBlob(
									filename ?? stampFilename("cms-edge-member-detail"),
									blob
								);
								toast.success("Member export downloaded.");
							})
							.catch(() => toast.error("Member export failed."));
					}}
				>
					<Download className="mr-1.5 size-3.5" />
					Export Member
				</Button>
				<Button className="h-9" onClick={() => setCorrectionOpen(true)}>
					<Pencil className="mr-1.5 size-3.5" />
					Create Correction
				</Button>
			</div>

			<Dialog
				open={correctionOpen}
				onOpenChange={(open) => {
					setCorrectionOpen(open);
					if (!open) resetCorrectionForm();
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Create correction</DialogTitle>
						<DialogDescription>
							Opens an eligibility exception on this member for CMS EDGE
							follow-up. Member{" "}
							<span className="font-medium text-foreground">{member.name}</span>{" "}
							({member.uniqueEnrolleeId}).
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-1">
						<div className="space-y-1.5">
							<Label htmlFor="edge-correction-type">
								Correction type{" "}
								<span className="text-destructive" aria-hidden>
									*
								</span>
							</Label>
							<Select value={correctionType} onValueChange={setCorrectionType}>
								<SelectTrigger id="edge-correction-type" className="h-9 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CORRECTION_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{correctionType === "Other" ? (
							<div className="space-y-1.5">
								<Label htmlFor="edge-correction-custom">
									Custom type{" "}
									<span className="text-destructive" aria-hidden>
										*
									</span>
								</Label>
								<Input
									id="edge-correction-custom"
									value={correctionCustomType}
									onChange={(e) => setCorrectionCustomType(e.target.value)}
									placeholder="Describe the correction type"
									className="h-9"
								/>
							</div>
						) : null}
						<div className="space-y-1.5">
							<Label htmlFor="edge-correction-notes">Notes</Label>
							<Textarea
								id="edge-correction-notes"
								value={correctionNotes}
								onChange={(e) => setCorrectionNotes(e.target.value)}
								placeholder="What needs to be fixed for EDGE submission?"
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							className="h-9"
							onClick={() => setCorrectionOpen(false)}
							disabled={createCorrection.isPending}
						>
							Cancel
						</Button>
						<Button
							className="h-9"
							onClick={() => void submitCorrection()}
							disabled={createCorrection.isPending}
						>
							{createCorrection.isPending ? "Saving…" : "Create correction"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
