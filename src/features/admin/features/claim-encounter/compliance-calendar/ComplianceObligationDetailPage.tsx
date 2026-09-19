"use client";

import { type ReactNode, useState } from "react";

import {
	ArrowLeft,
	ArrowUp,
	CalendarDays,
	ChevronDown,
	Download,
	ExternalLink,
	FileText,
	Pencil,
	Plus,
	Upload,
	UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CmsEdgeSectionPanel,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import type {
	ObligationDetail,
	ObligationStatus,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";
import {
	COMPLIANCE_PROGRAM_LABELS,
	complianceProgramPillClass,
	complianceStatusPillClass,
	useUpdateComplianceObligationMutation,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const STACK = "space-y-3 pb-20";

function DetailCard({
	title,
	action,
	children,
	bodyClassName,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	bodyClassName?: string;
}) {
	return (
		<CmsEdgeSectionPanel
			title={
				<div className="flex w-full items-center justify-between gap-2">
					<span>{title}</span>
					{action}
				</div>
			}
			bodyClassName={cn("p-3", bodyClassName)}
		>
			{children}
		</CmsEdgeSectionPanel>
	);
}

function FieldGrid({
	fields,
}: {
	fields: { label: string; value: ReactNode }[];
}) {
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{fields.map((field) => (
				<div key={field.label} className="min-w-0">
					<p className="text-[11px] font-medium text-muted-foreground">
						{field.label}
					</p>
					<div className="mt-0.5 text-sm text-foreground">{field.value}</div>
				</div>
			))}
		</div>
	);
}

function PanelLink({ children }: { children: ReactNode }) {
	return (
		<Button
			variant="link"
			size="sm"
			className="h-auto px-0 text-xs text-primary"
		>
			{children}
		</Button>
	);
}

export function ComplianceObligationDetailPage({
	obligation: initial,
}: {
	obligation: ObligationDetail;
}) {
	const [obligation, setObligation] = useState(initial);
	const updateMutation = useUpdateComplianceObligationMutation();
	const isOverdue = obligation.status === "Overdue";

	async function patch(body: {
		status?: ObligationStatus;
		owner?: string;
		notes?: string;
	}) {
		try {
			const next = await updateMutation.mutateAsync({
				id: obligation.id,
				body,
			});
			setObligation(next);
			toast.success("Obligation updated");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		}
	}

	return (
		<div className={STACK}>
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-3">
					<Button
						variant="ghost"
						size="icon"
						className="mt-0.5 size-8 shrink-0"
						asChild
					>
						<Link href="/admin/claim-encounter/regulatory/compliance-calendar">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="min-w-0">
						<h1 className="text-xl font-bold tracking-tight text-foreground">
							Obligation Detail
						</h1>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select defaultValue="cms-edge">
						<SelectTrigger className="h-9 w-[120px] bg-card text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="cms-edge">CMS EDGE</SelectItem>
							<SelectItem value="medicare">Medicare</SelectItem>
							<SelectItem value="medicaid">Medicaid</SelectItem>
						</SelectContent>
					</Select>
					<Select defaultValue="2025">
						<SelectTrigger className="h-9 w-[88px] bg-card text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="2025">2025</SelectItem>
							<SelectItem value="2024">2024</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
				{/* Main column */}
				<div className="space-y-3">
					<section className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
						<div className="space-y-4 p-4">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="flex min-w-0 items-start gap-3">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
										<CalendarDays className="size-5" />
									</div>
									<div className="min-w-0">
										<h2 className="text-lg font-bold text-foreground">
											{obligation.title}
										</h2>
										<span className="mt-1 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
											{obligation.obligationType}
										</span>
									</div>
								</div>
								<span
									className={cn(
										CMS_EDGE_STATUS_PILL_CLASS,
										complianceStatusPillClass(obligation.status),
										"text-xs"
									)}
								>
									{obligation.status}
								</span>
							</div>

							<FieldGrid
								fields={[
									{
										label: "Program",
										value: (
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													complianceProgramPillClass(obligation.program),
													"inline-flex"
												)}
											>
												{COMPLIANCE_PROGRAM_LABELS[obligation.program]}
											</span>
										),
									},
									{
										label: "Reporting Period",
										value: obligation.reportingPeriod,
									},
									{
										label: "Regulatory Due Date",
										value: (
											<span
												className={cn(
													isOverdue && "font-semibold text-red-600"
												)}
											>
												{obligation.dueDate}
											</span>
										),
									},
									{
										label: "Internal Due Date",
										value: obligation.internalDueDate,
									},
									{
										label: "Regulatory Agency",
										value: obligation.regulatoryAgency,
									},
									{
										label: "Obligation Type",
										value: obligation.obligationType,
									},
									{
										label: "Status",
										value: (
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													complianceStatusPillClass(obligation.status),
													"inline-flex"
												)}
											>
												{obligation.status}
											</span>
										),
									},
									{
										label: "Priority",
										value: (
											<span className="inline-flex items-center gap-1 font-semibold text-red-600">
												<ArrowUp className="size-3.5" />
												{obligation.priority}
											</span>
										),
									},
									{ label: "Owner / Assigned To", value: obligation.owner },
									{ label: "Source Module", value: obligation.sourceModule },
									{
										label: "Regulatory Reference",
										value: obligation.regulatoryReference,
									},
									{ label: "Last Updated", value: obligation.lastUpdated },
								]}
							/>

							<div className="border-t border-border/50 pt-3">
								<p className="text-xs font-semibold text-foreground">
									Description
								</p>
								<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
									{obligation.description}
								</p>
							</div>
						</div>
					</section>

					<div className="grid gap-3 lg:grid-cols-2">
						<DetailCard
							title="Notes"
							action={
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									aria-label="Edit notes"
								>
									<Pencil className="size-3.5" />
								</Button>
							}
						>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{obligation.notes}
							</p>
						</DetailCard>

						<DetailCard title="Related Information">
							<ul className="space-y-2.5 text-sm">
								<li className="flex items-center justify-between gap-2">
									<div>
										<p className="text-[11px] text-muted-foreground">
											Related Submission
										</p>
										<p className="font-medium text-foreground">
											{obligation.relatedSubmission}
										</p>
									</div>
									<PanelLink>Go to CMS EDGE →</PanelLink>
								</li>
								<li className="flex items-center justify-between gap-2">
									<div>
										<p className="text-[11px] text-muted-foreground">
											Latest CMS Response
										</p>
										<p className="font-medium text-foreground">
											{obligation.latestResponse}
										</p>
									</div>
									<PanelLink>Go to Response →</PanelLink>
								</li>
								<li className="flex items-center justify-between gap-2">
									<div>
										<p className="text-[11px] text-muted-foreground">
											Open Issues
										</p>
										<p className="font-medium text-foreground">
											{obligation.openIssues}
										</p>
									</div>
									<PanelLink>Go to Issues →</PanelLink>
								</li>
							</ul>
						</DetailCard>
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-3">
					<DetailCard
						title="Documents"
						action={<PanelLink>View All</PanelLink>}
					>
						<ul className="divide-y divide-border/40">
							{obligation.documents.map((doc) => (
								<li
									key={doc.id}
									className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
								>
									<div
										className={cn(
											"flex size-8 shrink-0 items-center justify-center rounded-md",
											doc.iconTone
										)}
									>
										<FileText className="size-4" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-xs font-semibold text-foreground">
											{doc.title}
										</p>
										<p className="text-[10px] text-muted-foreground">
											{doc.meta}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 shrink-0"
										aria-label="Download"
									>
										<Download className="size-3.5" />
									</Button>
								</li>
							))}
						</ul>
					</DetailCard>

					<DetailCard
						title="Activity History"
						action={<PanelLink>View All</PanelLink>}
					>
						<ul className="relative space-y-0 pl-4">
							<div
								className="absolute bottom-2 left-[7px] top-2 w-px bg-primary/30"
								aria-hidden
							/>
							{obligation.activity.map((entry) => (
								<li
									key={entry.id}
									className="relative flex gap-3 pb-4 last:pb-0"
								>
									<span className="absolute -left-4 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
									<div className="min-w-[72px] shrink-0 whitespace-pre-line text-[10px] tabular-nums text-muted-foreground">
										{entry.timestamp}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-medium text-foreground">
											{entry.action}
										</p>
										<p className="text-[10px] text-muted-foreground">
											{entry.actor}
										</p>
									</div>
								</li>
							))}
						</ul>
					</DetailCard>
				</div>
			</div>

			{/* Bottom action bar */}
			<div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:pl-[var(--sidebar-width,16rem)]">
				<div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2">
					<Button size="sm" className="h-9 gap-1.5 text-xs" asChild>
						<Link
							href={
								obligation.sourceModule?.toLowerCase().includes("cms")
									? "/admin/claim-encounter/regulatory/cms-edge"
									: "/admin/claim-encounter/regulatory/program-reporting"
							}
						>
							<ExternalLink className="size-3.5" />
							Go to Source Module
						</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-9 gap-1 text-xs"
								disabled={updateMutation.isPending}
							>
								Update Status
								<ChevronDown className="size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{(
								[
									"Upcoming",
									"At Risk",
									"Overdue",
									"Completed",
								] as ObligationStatus[]
							).map((status) => (
								<DropdownMenuItem
									key={status}
									onClick={() => void patch({ status })}
								>
									{status}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						className="h-9 gap-1.5 text-xs"
						disabled={updateMutation.isPending}
						onClick={() =>
							void patch({
								owner: prompt("Assign to", obligation.owner) || undefined,
							})
						}
					>
						<UserRound className="size-3.5" />
						Assign / Reassign
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-9 gap-1.5 text-xs"
						disabled={updateMutation.isPending}
						onClick={() => {
							const notes = prompt("Add note", obligation.notes);
							if (notes != null) void patch({ notes });
						}}
					>
						<Plus className="size-3.5" />
						Add Note
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-9 gap-1.5 text-xs"
						onClick={() =>
							toast.info(
								"Document metadata upload via PATCH documents JSON — use API for binary files"
							)
						}
					>
						<Upload className="size-3.5" />
						Upload Document
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-9 gap-1 text-xs"
						onClick={() => toast.info("More actions coming soon")}
					>
						More Actions
						<ChevronDown className="size-3.5" />
					</Button>
					<span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
						{obligation.sourceModule}
					</span>
				</div>
			</div>
		</div>
	);
}
