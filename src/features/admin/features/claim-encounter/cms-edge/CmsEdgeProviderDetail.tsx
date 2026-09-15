"use client";

import { useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	CheckCircle2,
	Download,
	FileText,
	Info,
	type LucideIcon,
	Pill,
	ShieldCheck,
	Stethoscope,
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
import { useCmsEdgeProviderDetailQuery } from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import type { CmsEdgeProviderDetailView } from "@/features/admin/features/claim-encounter/cms-edge/live-providers";
import {
	PROVIDER_CLAIM_STATUS_STYLES,
	PROVIDER_ERROR_STATUS_STYLES,
	PROVIDER_ROLE_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const DETAIL_TAB_TRIGGER =
	"rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

const KPI_ICONS = {
	building: Building2,
	stethoscope: Stethoscope,
	shield: ShieldCheck,
	file: FileText,
	pill: Pill,
	alert: AlertTriangle,
} satisfies Record<
	CmsEdgeProviderDetailView["kpis"][number]["icon"],
	LucideIcon
>;

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

function ProviderIdentificationPanel({
	provider,
}: {
	provider: CmsEdgeProviderDetailView;
}) {
	const left = provider.identificationLeft;
	const right = provider.identificationRight;

	return (
		<CmsEdgeSectionPanel
			title="Provider Identification"
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
								<dd
									className={cn(
										"font-medium",
										"tone" in field && field.tone === "success"
											? "text-emerald-700"
											: "text-foreground"
									)}
								>
									{field.value}
								</dd>
							</div>
						))}
					</dl>
				))}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function NpiValidationPanel({
	provider,
}: {
	provider: CmsEdgeProviderDetailView;
}) {
	const v = provider.npiValidation;
	return (
		<CmsEdgeSectionPanel title="NPI Validation" bodyClassName="space-y-3 p-4">
			<div className="flex flex-wrap gap-4 text-xs font-semibold">
				<span className="text-emerald-700">Passed: {v.passed}</span>
				<span className="text-amber-700">Warnings: {v.warnings}</span>
				<span className="text-red-600">Errors: {v.errors}</span>
			</div>
			<ul className="divide-y divide-border/40 rounded-md border border-border/60">
				{v.checks.map((check) => (
					<li
						key={check.id}
						className="flex items-center gap-2 px-3 py-2.5 text-xs"
					>
						<CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
						<span className="min-w-0 flex-1 font-medium text-foreground">
							{check.label}
						</span>
						<span className="font-semibold text-emerald-700">
							{check.result}
						</span>
					</li>
				))}
			</ul>
			<p className="text-[11px] text-muted-foreground">
				Last validated {v.lastValidated}
			</p>
		</CmsEdgeSectionPanel>
	);
}

function AssociatedClaimsPanel({
	provider,
}: {
	provider: CmsEdgeProviderDetailView;
}) {
	const [claimTab, setClaimTab] = useState<"medical" | "pharmacy">("medical");
	const rows =
		claimTab === "medical" ? provider.medicalClaims : provider.pharmacyClaims;
	const medicalCount = provider.medicalClaims.length;
	const pharmacyCount = provider.pharmacyClaims.length;

	return (
		<CmsEdgeSectionPanel
			title="Associated Claims"
			action={
				<div className="flex items-center gap-1 rounded-md border border-border/70 p-0.5">
					<button
						type="button"
						onClick={() => setClaimTab("medical")}
						className={cn(
							"rounded px-2.5 py-1 text-[11px] font-semibold transition-colors",
							claimTab === "medical"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground"
						)}
					>
						Medical Claims{" "}
						<span
							className={cn(
								"ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px]",
								claimTab === "medical" ? "bg-primary-foreground/20" : "bg-muted"
							)}
						>
							{medicalCount.toLocaleString("en-US")}
						</span>
					</button>
					<button
						type="button"
						onClick={() => setClaimTab("pharmacy")}
						className={cn(
							"rounded px-2.5 py-1 text-[11px] font-semibold transition-colors",
							claimTab === "pharmacy"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground"
						)}
					>
						Pharmacy Claims{" "}
						<span
							className={cn(
								"ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px]",
								claimTab === "pharmacy"
									? "bg-primary-foreground/20"
									: "bg-muted"
							)}
						>
							{pharmacyCount.toLocaleString("en-US")}
						</span>
					</button>
				</div>
			}
			bodyClassName="pb-2"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[980px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Claim ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Unique Enrollee ID
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Provider Role
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Service Date
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Procedure Code
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Allowed Amount
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Plan Paid
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								CMS Status
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Errors
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={10}
									className="px-3 py-8 text-center text-muted-foreground"
								>
									No {claimTab} claims for this provider.
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className="px-3 py-2.5 font-mono text-[11px]">
										{row.claimId}
									</TableCell>
									<TableCell className="px-3 py-2.5 font-mono text-[11px]">
										{row.uniqueEnrolleeId}
									</TableCell>
									<TableCell className="px-3 py-2.5">
										{row.providerRole}
									</TableCell>
									<TableCell className="px-3 py-2.5 tabular-nums">
										{row.serviceDate}
									</TableCell>
									<TableCell className="px-3 py-2.5 font-mono text-[11px]">
										{row.procedureCode}
									</TableCell>
									<TableCell className="px-3 py-2.5 text-right tabular-nums">
										{row.allowedAmount}
									</TableCell>
									<TableCell className="px-3 py-2.5 text-right tabular-nums">
										{row.planPaid}
									</TableCell>
									<TableCell className="px-3 py-2.5">
										<StatusPill
											label={row.cmsStatus}
											className={PROVIDER_CLAIM_STATUS_STYLES[row.cmsStatus]}
										/>
									</TableCell>
									<TableCell className="px-3 py-2.5 text-right tabular-nums">
										{row.errors}
									</TableCell>
									<TableCell className="px-3 py-2.5 pr-4">
										<Button
											variant="outline"
											size="sm"
											className="h-7 px-2 text-xs text-primary"
										>
											View
										</Button>
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

function ErrorHistoryPanel({
	provider,
}: {
	provider: CmsEdgeProviderDetailView;
}) {
	return (
		<CmsEdgeSectionPanel title="NPI Error History" bodyClassName="pb-2">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[900px]")}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Date</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Error Code
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Description
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Claims Impacted
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Resolution
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
								Resolved By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{provider.errorHistory.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="px-3 py-8 text-center text-muted-foreground"
								>
									No NPI errors recorded for this provider.
								</TableCell>
							</TableRow>
						) : (
							provider.errorHistory.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className="px-3 py-2.5 tabular-nums text-muted-foreground">
										{row.date}
									</TableCell>
									<TableCell className="px-3 py-2.5 font-mono text-[11px]">
										{row.errorCode}
									</TableCell>
									<TableCell className="px-3 py-2.5 text-muted-foreground">
										{row.description}
									</TableCell>
									<TableCell className="px-3 py-2.5 text-right tabular-nums">
										{row.claimsImpacted}
									</TableCell>
									<TableCell className="px-3 py-2.5">
										<StatusPill
											label={row.status}
											className={PROVIDER_ERROR_STATUS_STYLES[row.status]}
										/>
									</TableCell>
									<TableCell className="px-3 py-2.5 text-muted-foreground">
										{row.resolution}
									</TableCell>
									<TableCell className="px-3 py-2.5 pr-4 text-muted-foreground">
										{row.resolvedBy}
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

function SubmissionHistoryPanel({
	provider,
}: {
	provider: CmsEdgeProviderDetailView;
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
								File
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{provider.submissionHistory.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="px-3 py-8 text-center text-muted-foreground"
								>
									No submission history for this provider.
								</TableCell>
							</TableRow>
						) : (
							provider.submissionHistory.map((row) => (
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
							))
						)}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function CmsEdgeProviderDetail({
	id,
	onBack,
}: {
	id: string;
	onBack: () => void;
}) {
	const [tab, setTab] = useState("overview");
	const {
		data: provider,
		isLoading,
		isError,
		error,
	} = useCmsEdgeProviderDetailQuery(id);

	if (isLoading) {
		return (
			<div className="flex min-h-[240px] items-center justify-center rounded-sm border border-dashed border-border/70 bg-card px-6 py-12 text-sm text-muted-foreground">
				Loading provider…
			</div>
		);
	}

	if (isError || !provider) {
		return (
			<div className="space-y-3">
				<Button
					variant="link"
					className="h-auto gap-1.5 px-0 text-xs font-semibold text-primary"
					onClick={onBack}
				>
					<ArrowLeft className="size-3.5" />
					Back to Providers
				</Button>
				<div className="flex min-h-[240px] flex-col items-center justify-center rounded-sm border border-dashed border-border/70 bg-card px-6 py-12 text-center">
					<p className="text-sm font-semibold text-foreground">
						Provider not found
					</p>
					<p className="mt-1 max-w-md text-sm text-muted-foreground">
						{error instanceof Error
							? error.message
							: "No detail payload returned for this provider id."}
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
					Back to Providers
				</Button>
				<div>
					<h2 className="text-xl font-semibold tracking-tight text-foreground">
						Provider Details
					</h2>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<p className="text-base font-semibold text-foreground">
							{provider.name}
						</p>
						<span className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
							NPI: {provider.npi}
						</span>
						{provider.validated ? (
							<StatusPill
								label="Validated"
								className="border-emerald-200/80 bg-emerald-50 text-emerald-800"
							/>
						) : null}
						{provider.roles.map((role) => (
							<StatusPill
								key={role}
								label={role}
								className={
									PROVIDER_ROLE_STYLES[role] ??
									"border-border/70 bg-muted/40 text-muted-foreground"
								}
							/>
						))}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
					{provider.kpis.map((kpi) => {
						const Icon = KPI_ICONS[kpi.icon];
						return (
							<div
								key={kpi.id}
								className="rounded-lg border border-border/70 bg-card p-3 shadow-sm"
							>
								<div className="flex items-start gap-2.5">
									<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
										<Icon className="size-4" aria-hidden />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] font-medium text-muted-foreground">
											{kpi.label}
										</p>
										<p
											className={cn(
												"mt-0.5 text-sm font-semibold",
												kpi.tone === "success"
													? "text-emerald-700"
													: "text-foreground"
											)}
										>
											{kpi.value}
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
						<TabsTrigger value="claims" className={DETAIL_TAB_TRIGGER}>
							Associated Claims
						</TabsTrigger>
						<TabsTrigger value="npi" className={DETAIL_TAB_TRIGGER}>
							NPI Validation
						</TabsTrigger>
						<TabsTrigger value="errors" className={DETAIL_TAB_TRIGGER}>
							Error History
						</TabsTrigger>
						<TabsTrigger value="submissions" className={DETAIL_TAB_TRIGGER}>
							Submission History
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="mt-4 space-y-4">
					<div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
						<ProviderIdentificationPanel provider={provider} />
						<NpiValidationPanel provider={provider} />
					</div>
					<AssociatedClaimsPanel provider={provider} />
					<ErrorHistoryPanel provider={provider} />
				</TabsContent>

				<TabsContent value="claims" className="mt-4">
					<AssociatedClaimsPanel provider={provider} />
				</TabsContent>

				<TabsContent value="npi" className="mt-4 max-w-xl">
					<NpiValidationPanel provider={provider} />
				</TabsContent>

				<TabsContent value="errors" className="mt-4">
					<ErrorHistoryPanel provider={provider} />
				</TabsContent>

				<TabsContent value="submissions" className="mt-4">
					<SubmissionHistoryPanel provider={provider} />
				</TabsContent>
			</Tabs>

			<div className="flex items-start gap-2 rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-xs text-sky-950">
				<Info className="mt-0.5 size-3.5 shrink-0 text-sky-700" />
				<p>{provider.infoNote}</p>
			</div>

			<div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
				<Button variant="outline" className="h-9" onClick={onBack}>
					Return to Providers
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => {
						const source =
							provider.submissionHistory[0]?.fileName ||
							provider.identificationRight.find(
								(f) => f.label === "Source Vendor"
							)?.value;
						if (source && source !== "—") {
							toast.message(`Source: ${source}`);
						} else {
							toast.message("No vendor source record for this provider.");
						}
					}}
				>
					View Source Record
				</Button>
				<Button
					variant="outline"
					className="h-9"
					onClick={() => {
						toast.message(
							"Use Providers list Export for CSV. Detail PDF export not available."
						);
					}}
				>
					<Download className="mr-1.5 size-3.5" />
					Export Provider
				</Button>
				<Button
					className="h-9"
					onClick={() => {
						setTab("claims");
						toast.message("Reviewing impacted claims.");
					}}
				>
					Review Impacted Claims
				</Button>
			</div>
		</div>
	);
}
