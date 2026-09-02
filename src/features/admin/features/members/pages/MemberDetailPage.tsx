"use client";

import { useParams, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	Activity,
	BriefcaseMedical,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Clock,
	DollarSign,
	Download,
	Eye,
	EyeOff,
	History,
	Network,
	Pill,
	Plus,
	Printer,
	Shield,
	ShieldAlert,
	ShieldCheck,
	Tablets,
	UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { VendorCoreLoadingRow } from "@/components/vendor-core/VendorCoreLiveChrome";
import {
	type ClaimStatus,
	type EligibilityStatus,
	type ExceptionStatus,
	type MemberStatus,
	displayName,
	formatCurrency,
	formatDate,
	formatDateTime,
	getMember,
	maskSsn,
	memberAge,
} from "@/features/admin/features/members/feature/api/membersApi";
import {
	useMemberChangeEventsQuery,
	useMemberDetailQuery,
} from "@/features/admin/features/members/feature/queries/useMembersQuery";
import { buildAccumulatorSummaryForMember } from "@/features/admin/features/members/map-member-core";
import type {
	AccumulatorAmountTriple,
	AccumulatorKpi,
	AccumulatorSummary,
	AccumulatorTableRow,
	MemberDetail,
} from "@/features/admin/features/members/mock-data";
import {
	MemberAccumulatorRowActions,
	MemberChangeEventsPanel,
	MemberClaimRowActions,
	MemberCreateAccumulatorButton,
	MemberCreateClaimButton,
	MemberCreateExceptionButton,
	MemberExceptionRowActions,
	MemberSourceRecordViewer,
	useMemberTabData,
} from "@/features/admin/features/members/pages/member-detail-actions";
import {
	downloadMemberDetailCsv,
	downloadMemberDetailPdf,
	openMemberDocumentPdf,
	printMemberProfile,
} from "@/features/admin/features/members/pages/member-detail-export-actions";
import { MemberFamilyEditor } from "@/features/admin/features/members/pages/member-family-editor";
import { MemberEditPanel } from "@/features/admin/features/members/pages/member-write-form";
import { Link } from "@/i18n/navigation";
import { isMembersMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

const TABS = [
	"Overview",
	"Demographics",
	"Employment & Group",
	"Eligibility",
	"Coverage & Plan History",
	"Family / Dependents",
	"Claims & Encounters",
	"Accumulators",
	"Vendor / Source History",
	"Eligibility Exceptions",
	"Other Status",
	"Change Events",
] as const;

type Tab = "Edit" | (typeof TABS)[number];

function statusPillClass(positive: boolean, negative: boolean) {
	if (positive) return "border-chart-2/20 bg-chart-2/10 text-chart-2";
	if (negative)
		return "border-destructive/20 bg-destructive/10 text-destructive";
	return "border-border/60 bg-muted text-muted-foreground";
}

function MemberStatusPill({ status }: { status: MemberStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(status === "active", status === "termed")
			)}
		>
			{status}
		</span>
	);
}

function EligPill({ status }: { status: EligibilityStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(
					status === "eligible",
					status === "termed" || status === "ineligible"
				)
			)}
		>
			{status === "eligible" ? "Eligible" : status}
		</span>
	);
}

function ClaimPill({ status }: { status: ClaimStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(status === "paid", status === "denied")
			)}
		>
			{status}
		</span>
	);
}

function ExceptionPill({ status }: { status: ExceptionStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(status === "resolved", status === "open")
			)}
		>
			{status.replace("_", " ")}
		</span>
	);
}

/** Sharp, table-forward member profile UI system */
const MEMBER_UI = {
	radius: "rounded-sm",
	radiusSm: "rounded-sm",
	surface: "overflow-hidden border border-border/80 bg-card",
	label:
		"text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
	labelAccent:
		"text-[9px] font-semibold uppercase tracking-[0.12em] text-primary/85",
	title: "text-[13px] font-semibold tracking-tight text-foreground",
} as const;

function OverviewCard({
	title,
	icon: Icon,
	iconTone = "primary",
	action,
	children,
	className,
	contentClassName,
}: {
	title: string;
	icon: typeof ShieldCheck;
	iconTone?: "primary" | "chart-2" | "chart-3" | "chart-5";
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
}) {
	const iconClass = {
		primary: "bg-muted text-muted-foreground border-border/70",
		"chart-2": "bg-muted text-muted-foreground border-border/70",
		"chart-3": "bg-muted text-muted-foreground border-border/70",
		"chart-5": "bg-muted text-muted-foreground border-border/70",
	}[iconTone];

	return (
		<section
			className={cn(
				"relative flex flex-col",
				MEMBER_UI.surface,
				MEMBER_UI.radius,
				className
			)}
		>
			<div className="flex items-center gap-2 border-b border-border/50 bg-slate-50/90 px-3 py-2 dark:bg-muted/30">
				<span
					className={cn(
						"flex size-6 shrink-0 items-center justify-center border",
						MEMBER_UI.radiusSm,
						iconClass
					)}
				>
					<Icon className="size-3.5" strokeWidth={2.25} />
				</span>
				<h3 className={cn("min-w-0 flex-1", MEMBER_UI.title)}>{title}</h3>
				{action}
			</div>
			<div className={cn("min-h-0 flex-1", contentClassName ?? "px-3 py-1")}>
				{children}
			</div>
		</section>
	);
}

function Panel({
	title,
	icon: Icon,
	action,
	children,
	className,
	dense,
	bodyClassName,
}: {
	title: string;
	icon?: typeof ShieldCheck;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	dense?: boolean;
	bodyClassName?: string;
}) {
	return (
		<section
			className={cn(
				"relative flex flex-col",
				MEMBER_UI.surface,
				MEMBER_UI.radius,
				className
			)}
		>
			<div
				className={cn(
					"flex items-center gap-2 border-b border-border/50 bg-slate-50/90 dark:bg-muted/30",
					dense ? "px-3 py-2" : "px-3.5 py-2.5"
				)}
			>
				{Icon ? (
					<span
						className={cn(
							"flex size-6 shrink-0 items-center justify-center border border-border/70 bg-muted text-muted-foreground",
							MEMBER_UI.radiusSm
						)}
					>
						<Icon className="size-3.5" strokeWidth={2.25} />
					</span>
				) : null}
				<h3 className={cn("min-w-0 flex-1", MEMBER_UI.title)}>{title}</h3>
				{action}
			</div>
			<div
				className={cn(
					"min-h-0 flex-1",
					bodyClassName ?? (dense ? "p-0" : "p-3.5")
				)}
			>
				{children}
			</div>
		</section>
	);
}

function ViewAllLink({
	onClick,
	label = "View all",
}: {
	onClick?: () => void;
	label?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="mt-3 text-sm font-medium text-primary hover:underline"
		>
			{label} →
		</button>
	);
}

function MetaField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<div className="text-sm font-medium text-foreground break-words">
				{value ?? "—"}
			</div>
		</div>
	);
}

function OverviewRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className="group flex items-center justify-between gap-3 border-b border-border/25 py-2 transition-colors last:border-b-0 hover:bg-muted/[0.08]">
			<span className="shrink-0 pl-0.5 text-[11px] leading-tight text-muted-foreground transition-colors group-hover:text-foreground/70">
				{label}
			</span>
			<span
				className={cn(
					"min-w-0 pr-0.5 text-right text-xs leading-tight font-semibold text-foreground",
					valueClassName
				)}
			>
				{value ?? "—"}
			</span>
		</div>
	);
}

/** Two-column Field | Label table used by Member Summary. */
function SummaryColumn({
	rows,
}: {
	rows: { field: string; label: ReactNode }[];
}) {
	return (
		<Table className="w-full table-fixed">
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					<TableHead className={overviewTh("w-[48%]")}>Field</TableHead>
					<TableHead className={overviewTh("text-right")}>Label</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row, i) => (
					<TableRow
						key={row.field}
						className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
					>
						<TableCell
							className={overviewTd("text-[11px] text-muted-foreground")}
						>
							{row.field}
						</TableCell>
						<TableCell
							className={overviewTd(
								"text-right text-xs font-semibold text-foreground"
							)}
						>
							{row.label ?? "—"}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function StatusWithDot({
	label,
	tone = "success",
}: {
	label: string;
	tone?: "success" | "muted" | "danger";
}) {
	return (
		<span className="inline-flex items-center justify-end gap-1.5">
			<span
				className={cn(
					"size-1.5 shrink-0 rounded-full",
					tone === "success" && "bg-chart-2",
					tone === "muted" && "bg-muted-foreground/50",
					tone === "danger" && "bg-destructive"
				)}
			/>
			<span
				className={cn(
					tone === "success" && "text-chart-2",
					tone === "danger" && "text-destructive"
				)}
			>
				{label}
			</span>
		</span>
	);
}

function OverviewFooterLink({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<div className="border-t border-border/30 px-3 py-2.5 text-center">
			<button
				type="button"
				className="text-xs font-medium text-primary hover:underline"
				onClick={onClick}
			>
				{label}
			</button>
		</div>
	);
}

function overviewTh(className?: string) {
	return cn(
		"h-8 border-r border-border/30 bg-muted/10 px-2.5 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase last:border-r-0 dark:bg-muted/10",
		className
	);
}

function overviewTd(className?: string) {
	return cn(
		"border-r border-border/40 px-2.5 py-2.5 text-xs last:border-r-0",
		className
	);
}

function SoftGreenBadge({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex rounded-sm bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
			{children}
		</span>
	);
}

/** Inclusive calendar days between ISO dates; open end → today. */
function coverageDaysBetween(
	start?: string | null,
	end?: string | null
): string {
	if (!start || start === "—") return "—";
	const parse = (iso: string) => {
		const day = iso.includes("T") ? iso.slice(0, 10) : iso.slice(0, 10);
		const [y, m, d] = day.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	};
	const s = parse(String(start));
	if (!s) return "—";
	const e =
		end && end !== "—"
			? parse(String(end))
			: new Date(
					new Date().getFullYear(),
					new Date().getMonth(),
					new Date().getDate()
				);
	if (!e) return "—";
	const days = Math.max(
		0,
		Math.round((e.getTime() - s.getTime()) / 86_400_000)
	);
	return String(days);
}

function isPrimaryCoverageMember(
	member: NonNullable<ReturnType<typeof getMember>>
): boolean | null {
	const code = (member.relationshipCode || "").trim();
	const type = (member.memberType || "").toLowerCase();
	const person = (member.personCode || "").trim();
	if (code === "18" || person === "01") return true;
	if (
		type.includes("subscriber") ||
		type.includes("employee") ||
		type === "self"
	) {
		return true;
	}
	if (code && code !== "18") return false;
	if (person && person !== "01") return false;
	return null;
}

function primaryMemberLabel(primary: boolean | null): ReactNode {
	if (primary === true) return "Yes";
	if (primary === false) return "No";
	return "—";
}

/** Map known change_reason strings → CHANGE TYPE; else —. */
function planChangeTypeLabel(reason: string): string {
	const r = reason.toLowerCase().trim();
	if (!r || r === "—") return "—";
	if (
		r.includes("initial") ||
		r.includes("new coverage") ||
		r.includes("enroll")
	) {
		return "New Coverage";
	}
	if (
		r.includes("open enrollment") ||
		r.includes("plan change") ||
		r.includes("manual") ||
		r.includes("file update") ||
		r.includes("update")
	) {
		return "Plan Change";
	}
	return "—";
}

function CoverageTimelineLink({
	label,
	targetId,
}: {
	label: string;
	targetId: string;
}) {
	return (
		<button
			type="button"
			className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
			onClick={() =>
				document.getElementById(targetId)?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				})
			}
		>
			<CalendarDays className="size-3.5" />
			{label}
		</button>
	);
}

function SoftRedBadge({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex rounded-sm bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-500/20 dark:text-red-300">
			{children}
		</span>
	);
}

function SoftAmberBadge({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex rounded-sm bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
			{children}
		</span>
	);
}

function eligibilityStatusBadge(status: EligibilityStatus | string) {
	const s = String(status).toLowerCase();
	if (s === "eligible" || s === "active") {
		return <SoftGreenBadge>Eligible</SoftGreenBadge>;
	}
	if (s === "termed" || s === "terminated") {
		return <SoftRedBadge>Termed</SoftRedBadge>;
	}
	if (s === "pending") return <SoftAmberBadge>Pending</SoftAmberBadge>;
	if (s === "ineligible" || s === "inactive") {
		return <SoftRedBadge>Ineligible</SoftRedBadge>;
	}
	return <span className="text-xs text-muted-foreground">{status || "—"}</span>;
}

function exceptionStatusBadge(status: ExceptionStatus | string) {
	const s = String(status).toLowerCase();
	if (s === "resolved") return <SoftGreenBadge>Resolved</SoftGreenBadge>;
	if (s === "open") return <SoftAmberBadge>Open</SoftAmberBadge>;
	if (s === "in_progress") return <SoftAmberBadge>In Progress</SoftAmberBadge>;
	return (
		<span className="text-xs capitalize text-muted-foreground">{status}</span>
	);
}

function processedStatusBadge(status: string) {
	const s = status.toLowerCase();
	if (s.includes("process") || s === "success") {
		return <SoftGreenBadge>Processed</SoftGreenBadge>;
	}
	if (s === "failed" || s.includes("fail")) {
		return <SoftRedBadge>Failed</SoftRedBadge>;
	}
	if (s === "warning") return <SoftAmberBadge>Warning</SoftAmberBadge>;
	return (
		<span className="text-xs text-muted-foreground">
			{status?.trim() || "—"}
		</span>
	);
}

type FamilyTableRow = {
	key: string;
	name: string;
	relationship: string;
	dependentRelationship: string;
	personCode: string;
	dob: string;
	gender: string;
	eligibility: ReactNode;
	coverageLevel: string;
	effective: string;
	termed: string;
	primary: ReactNode;
	isDependent: boolean;
	studentStatus: string;
	disabilityStatus: string;
};

function familyRelationshipLabel(
	rel: string,
	opts?: { forDependentTable?: boolean }
): string {
	const r = rel.trim();
	if (!r || r === "—" || r === "Self") {
		return opts?.forDependentTable ? "—" : "Subscriber";
	}
	if (r === "Daughter" || r === "Son") {
		return opts?.forDependentTable ? "Dependent Child" : "Dependent";
	}
	if (r === "Other" && opts?.forDependentTable) return "Dependent";
	return r;
}

function eligibilityCell(status: MemberStatus | EligibilityStatus | string) {
	const s = String(status).toLowerCase();
	if (s === "active" || s === "eligible") {
		return <SoftGreenBadge>Eligible</SoftGreenBadge>;
	}
	if (s === "pending") return <MemberStatusPill status="pending" />;
	if (s === "termed" || s === "terminated") {
		return <MemberStatusPill status="termed" />;
	}
	if (s === "inactive" || s === "ineligible") {
		return <MemberStatusPill status="inactive" />;
	}
	return <span className="text-xs text-muted-foreground">{status || "—"}</span>;
}

/** Family + dependent rows from live member payload only (no invented fields). */
function buildFamilyRows(
	member: NonNullable<ReturnType<typeof getMember>>
): FamilyTableRow[] {
	const coverageLevel = member.coverageLevel?.trim() || "—";
	const effective =
		member.statusEffectiveDate || member.coverageStart
			? formatDate(member.statusEffectiveDate ?? member.coverageStart)
			: "—";
	const termed =
		member.statusTermDate || member.coverageEnd
			? formatDate(member.statusTermDate ?? member.coverageEnd)
			: "—";

	const deps = member.dependents ?? [];
	const hasSelfInDeps = deps.some(
		(d) =>
			d.relationship === "Self" ||
			(d.relationshipCode || "") === "18" ||
			(d.relationshipLabel || "").toLowerCase() === "self"
	);

	const rows: FamilyTableRow[] = [];

	if (!hasSelfInDeps) {
		rows.push({
			key: `sub-${member.id}`,
			name: displayName(member),
			relationship: "Subscriber",
			dependentRelationship: "—",
			personCode: member.personCode?.trim() || "—",
			dob: formatDate(member.dob),
			gender: member.gender?.trim() || "—",
			eligibility: eligibilityCell(member.eligibilityStatus),
			coverageLevel,
			effective,
			termed,
			primary: <SoftGreenBadge>Yes</SoftGreenBadge>,
			isDependent: false,
			studentStatus: "—",
			disabilityStatus: "—",
		});
	}

	for (const dep of deps) {
		const isSelf =
			dep.relationship === "Self" ||
			(dep.relationshipCode || "") === "18" ||
			(dep.relationshipLabel || "").toLowerCase() === "self";
		const relSource =
			dep.relationshipLabel || dep.relationship || dep.relationshipCode || "";
		rows.push({
			key: dep.id,
			name: dep.name || "—",
			relationship: familyRelationshipLabel(String(relSource), {
				forDependentTable: false,
			}),
			dependentRelationship: familyRelationshipLabel(String(relSource), {
				forDependentTable: true,
			}),
			personCode: "—",
			dob: formatDate(dep.dob),
			gender: dep.gender?.trim() && dep.gender !== "—" ? dep.gender : "—",
			eligibility: eligibilityCell(dep.coverageStatus),
			coverageLevel,
			effective,
			termed: "—",
			primary: isSelf ? (
				<SoftGreenBadge>Yes</SoftGreenBadge>
			) : (
				<span className="text-xs text-muted-foreground">No</span>
			),
			isDependent: !isSelf,
			studentStatus: "—",
			disabilityStatus: "—",
		});
	}

	return rows;
}

function OverviewRecentActivity({
	memberId,
	member,
	onViewAll,
}: {
	memberId: string;
	member: NonNullable<ReturnType<typeof getMember>>;
	onViewAll: () => void;
}) {
	const useApi = !isMembersMockEnabled();
	const eventsQ = useMemberChangeEventsQuery(memberId, useApi);
	const eventRows = eventsQ.data ?? [];

	const fallbackRows = useMemo(() => {
		const rows: {
			id: string;
			date: string;
			event: string;
			description: string;
		}[] = [];
		if (member.lastEligibilityUpdate || member.dataAsOf) {
			rows.push({
				id: "elig-update",
				date: formatDateTime(member.lastEligibilityUpdate ?? member.dataAsOf),
				event: "Eligibility Updated",
				description: `Status set to ${member.eligibilityStatus}`,
			});
		}
		if (member.planName) {
			rows.push({
				id: "plan",
				date: formatDateTime(member.dataAsOf),
				event: "Plan Changed",
				description: `Assigned to ${member.planName}`,
			});
		}
		for (const claim of member.claims.slice(0, 3)) {
			rows.push({
				id: claim.id,
				date: formatDate(claim.dos),
				event: `${claim.type} Claim`,
				description: claim.claimNumber
					? `Claim ${claim.claimNumber} ${claim.status}`
					: `${claim.provider} · ${claim.status}`,
			});
		}
		return rows.slice(0, 5);
	}, [member]);

	const rows =
		useApi && eventRows.length > 0
			? eventRows.slice(0, 5).map((row) => ({
					id: row.id,
					date: formatDateTime(row.createdAt),
					event: row.category !== "—" ? row.category : row.fieldName,
					description:
						row.oldValue !== "—" || row.newValue !== "—"
							? `${row.fieldName}: ${row.oldValue} → ${row.newValue}`
							: row.fieldName,
				}))
			: fallbackRows;

	return (
		<OverviewCard
			icon={History}
			title="Recent Activity"
			className="min-h-0"
			contentClassName="flex flex-col p-0"
		>
			<div className="min-h-0 flex-1 overflow-hidden">
				<Table className="w-full table-fixed">
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={overviewTh("w-[28%]")}>Date</TableHead>
							<TableHead className={overviewTh("w-[28%]")}>Event</TableHead>
							<TableHead className={overviewTh()}>Description</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{eventsQ.isLoading && useApi ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="py-6 text-center text-xs text-muted-foreground"
								>
									Loading…
								</TableCell>
							</TableRow>
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="py-6 text-center text-xs text-muted-foreground"
								>
									No recent activity.
								</TableCell>
							</TableRow>
						) : (
							rows.map((row, i) => (
								<TableRow
									key={row.id}
									className={cn(i % 2 === 1 && "bg-muted/[0.22]")}
								>
									<TableCell
										className={overviewTd("tabular-nums text-muted-foreground")}
									>
										{row.date}
									</TableCell>
									<TableCell className={overviewTd("font-medium")}>
										{row.event}
									</TableCell>
									<TruncateCell className="text-muted-foreground">
										{row.description}
									</TruncateCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			<OverviewFooterLink label="View Full Activity" onClick={onViewAll} />
		</OverviewCard>
	);
}

function ActiveBadge({ label = "Active" }: { label?: string }) {
	return (
		<span className="inline-flex rounded-sm border border-chart-2/20 bg-chart-2/10 px-1.5 py-px text-[9px] font-bold tracking-wide text-chart-2 uppercase">
			{label}
		</span>
	);
}

function ProfileStatusBadge({ status }: { status: MemberStatus }) {
	const label =
		status === "active"
			? "Active"
			: status === "pending"
				? "Pending"
				: status === "inactive"
					? "Inactive"
					: "Termed";

	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[9px] font-bold tracking-wide uppercase",
				status === "active" && "border-chart-2/20 bg-chart-2/10 text-chart-2",
				status === "pending" && "border-chart-3/20 bg-chart-3/10 text-chart-3",
				status === "inactive" &&
					"border-border/60 bg-muted text-muted-foreground",
				status === "termed" &&
					"border-destructive/20 bg-destructive/10 text-destructive"
			)}
		>
			{label}
		</span>
	);
}

function TruncateCell({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const text = typeof children === "string" ? children : undefined;
	return (
		<TableCell
			className={cn(overviewTd("max-w-0 overflow-hidden"), className)}
			title={text}
		>
			<span className="block truncate">{children}</span>
		</TableCell>
	);
}

function HeaderField({
	label,
	value,
	accent,
	mono,
}: {
	label: string;
	value: ReactNode;
	accent?: boolean;
	mono?: boolean;
}) {
	return (
		<div className="min-w-0 space-y-1">
			<p className={accent ? MEMBER_UI.labelAccent : MEMBER_UI.label}>
				{label}
			</p>
			<div
				className={cn(
					"text-[13px] font-semibold leading-tight",
					accent ? "text-primary" : "text-foreground",
					mono && "font-mono text-xs tabular-nums tracking-tight"
				)}
			>
				{value ?? "—"}
			</div>
		</div>
	);
}

const METRIC_DOT_TONES = [
	"bg-chart-3",
	"bg-primary",
	"bg-chart-5",
	"bg-chart-4",
	"bg-chart-2",
	"bg-primary/70",
	"bg-chart-5/80",
] as const;

function MetricStrip({
	title,
	items,
	compact,
	embedded,
	className,
}: {
	title?: string;
	items: Array<{
		label: string;
		value: ReactNode;
		accent?: boolean;
		mono?: boolean;
		sub?: ReactNode;
	}>;
	compact?: boolean;
	embedded?: boolean;
	className?: string;
}) {
	return (
		<section
			className={cn(
				!embedded && cn("relative", MEMBER_UI.surface, MEMBER_UI.radius),
				className
			)}
		>
			{title ? (
				<div className="border-b border-border/50 bg-slate-50/90 px-4 py-2 sm:px-5 dark:bg-muted/30">
					<p className={MEMBER_UI.label}>{title}</p>
				</div>
			) : null}
			<div className="flex w-full overflow-x-auto lg:overflow-visible">
				<div className="flex min-w-max flex-1 lg:min-w-0">
					{items.map((item, index) => (
						<div
							key={item.label}
							className={cn(
								"min-w-0 flex-1 transition-colors hover:bg-muted/[0.14]",
								compact
									? "min-w-[6.75rem] px-3 py-2.5 sm:min-w-[7.5rem] sm:px-4"
									: "min-w-[7.5rem] px-4 py-3 sm:px-5",
								index > 0 && "border-l border-border/30"
							)}
						>
							<div className="flex items-center gap-1">
								<span
									className={cn(
										"size-1 shrink-0 rounded-full",
										METRIC_DOT_TONES[index % METRIC_DOT_TONES.length]
									)}
								/>
								<p className={MEMBER_UI.label}>{item.label}</p>
							</div>
							<div
								className={cn(
									"mt-1 truncate text-xs font-semibold",
									item.mono &&
										"font-mono text-[11px] tabular-nums tracking-tight",
									item.accent ? "text-primary" : "text-foreground"
								)}
							>
								{item.value ?? "—"}
							</div>
							{item.sub ? (
								<p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
									{item.sub}
								</p>
							) : null}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function TableScroll({
	children,
	minWidthClassName = "min-w-[52rem]",
}: {
	children: ReactNode;
	minWidthClassName?: string;
}) {
	return (
		<ScrollArea
			type="hover"
			className="group w-full max-w-full overflow-hidden"
			viewportClassName="w-full [&>div]:!block [&>div]:w-full"
			scrollbarClassName="z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=visible]:opacity-100"
			thumbClassName="rounded-full bg-foreground/25 hover:bg-foreground/40"
		>
			<div className={cn("w-full", minWidthClassName)}>{children}</div>
		</ScrollArea>
	);
}

export function MemberDetailPage({
	memberId: memberIdProp,
}: {
	memberId?: string;
}) {
	const params = useParams<{ memberId?: string | string[] }>();
	const searchParams = useSearchParams();
	const openEdit =
		searchParams.get("edit") === "1" ||
		searchParams.get("tab")?.toLowerCase() === "edit";
	const raw = memberIdProp ?? params.memberId;
	const memberId = decodeURIComponent(
		Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")
	);
	const useApi = !isMembersMockEnabled();
	const detailQuery = useMemberDetailQuery(memberId, useApi);
	const mockMember = useMemo(
		() => (!useApi && memberId ? getMember(memberId) : undefined),
		[useApi, memberId]
	);
	const member = useApi ? detailQuery.data : mockMember;
	const [tab, setTab] = useState<Tab>(openEdit ? "Edit" : "Overview");
	const [claimsPane, setClaimsPane] = useState<"claims" | "encounters">(
		"claims"
	);
	const [showSsn, setShowSsn] = useState(false);

	const body = (() => {
		if (useApi && detailQuery.isLoading && !detailQuery.data) {
			return <VendorCoreLoadingRow label="Loading member…" />;
		}
		if (useApi && detailQuery.error) {
			return (
				<div className="space-y-4">
					<p className="text-sm text-destructive">
						{detailQuery.error.message}
					</p>
					<Button asChild variant="outline" size="sm">
						<Link href="/admin/members">Back to members</Link>
					</Button>
				</div>
			);
		}
		if (!member) {
			return (
				<div className="space-y-4">
					<p className="text-sm text-destructive">Member not found.</p>
					<Button asChild variant="outline" size="sm">
						<Link href="/admin/members">Back to members</Link>
					</Button>
				</div>
			);
		}
		return (
			<MemberDetailBody
				memberId={memberId}
				member={member}
				tab={tab}
				setTab={setTab}
				claimsPane={claimsPane}
				setClaimsPane={setClaimsPane}
				showSsn={showSsn}
				setShowSsn={setShowSsn}
				initialEditMode={openEdit}
			/>
		);
	})();

	if (useApi) {
		return <VendorCoreGate title="Member">{body}</VendorCoreGate>;
	}
	return body;
}

function MemberDetailBody({
	memberId,
	member: baseMember,
	tab,
	setTab,
	claimsPane,
	setClaimsPane,
	showSsn,
	setShowSsn,
	initialEditMode = false,
}: {
	memberId: string;
	member: NonNullable<ReturnType<typeof getMember>>;
	tab: Tab;
	setTab: (t: Tab) => void;
	claimsPane: "claims" | "encounters";
	setClaimsPane: (p: "claims" | "encounters") => void;
	showSsn: boolean;
	setShowSsn: (v: boolean | ((b: boolean) => boolean)) => void;
	initialEditMode?: boolean;
}) {
	const member =
		useMemberTabData(memberId, baseMember, tab, claimsPane) ?? baseMember;
	const [editMode, setEditMode] = useState(initialEditMode);
	const [sourceRecordId, setSourceRecordId] = useState<string | null>(null);
	const [exportBusy, setExportBusy] = useState(false);
	const apiMemberId = baseMember.id;
	const name = displayName(member);
	const visibleTabs: Tab[] = editMode ? ["Edit", ...TABS] : [...TABS];

	useEffect(() => {
		if (!initialEditMode) return;
		setEditMode(true);
		setTab("Edit");
	}, [initialEditMode, setTab]);

	function selectTab(next: Tab) {
		if (next !== "Edit") setEditMode(false);
		setTab(next);
	}

	function enterEditMode() {
		setEditMode(true);
		setTab("Edit");
	}

	function exitEditMode() {
		setEditMode(false);
		setTab("Overview");
	}

	async function runExport(task: () => Promise<void>) {
		if (exportBusy) return;
		setExportBusy(true);
		try {
			await task();
		} finally {
			setExportBusy(false);
		}
	}
	const claimRows = claimsPane === "claims" ? member.claims : member.encounters;

	return (
		<div className="space-y-3">
			{/* Page actions */}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">
					<span>Members</span>
					<span className="mx-1.5 text-border/80">/</span>
					<span className="font-semibold text-foreground">Member Profile</span>
				</p>
				<div className="flex flex-wrap items-center gap-1.5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 rounded-md border-border/70 bg-card px-3 text-xs shadow-none"
							>
								Member Summary
								<ChevronDown className="ml-1 size-3 opacity-60" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								disabled={exportBusy}
								onClick={() =>
									void runExport(() =>
										openMemberDocumentPdf(apiMemberId, "summary")
									)
								}
							>
								One-page summary
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={exportBusy}
								onClick={() =>
									void runExport(() =>
										openMemberDocumentPdf(apiMemberId, "eligibility-letter")
									)
								}
							>
								Eligibility letter
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={exportBusy}
								onClick={() =>
									void runExport(() =>
										openMemberDocumentPdf(apiMemberId, "coverage-card")
									)
								}
							>
								Coverage card
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						className="h-8 rounded-md border-border/70 bg-card px-3 text-xs shadow-none"
						disabled={exportBusy}
						onClick={() =>
							void runExport(() => printMemberProfile(apiMemberId))
						}
					>
						<Printer className="mr-1 size-3" />
						Print
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="sm"
								className="h-8 rounded-md px-3 text-xs shadow-none"
								disabled={exportBusy}
							>
								<Download className="mr-1 size-3" />
								Export
								<ChevronDown className="ml-1 size-3 opacity-80" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								disabled={exportBusy}
								onClick={() =>
									void runExport(() => downloadMemberDetailCsv(apiMemberId))
								}
							>
								Export CSV
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={exportBusy}
								onClick={() =>
									void runExport(() => downloadMemberDetailPdf(apiMemberId))
								}
							>
								Export PDF
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Identity header */}
			<section className={cn("relative", MEMBER_UI.surface, MEMBER_UI.radius)}>
				<div
					className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-primary/[0.035] blur-2xl"
					aria-hidden
				/>
				<div
					className="pointer-events-none absolute -bottom-8 left-1/4 size-28 rounded-full bg-chart-5/[0.04] blur-2xl"
					aria-hidden
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-chart-5/[0.015]" />

				<div className="relative border-b border-border/30 px-4 py-3 sm:px-5">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5 xl:gap-7">
						<div className="flex min-w-0 items-center gap-3 lg:max-w-[19rem] lg:shrink-0">
							<div className="relative shrink-0">
								<div className="flex size-11 items-center justify-center rounded-full border-2 border-primary/15 bg-primary text-primary-foreground">
									<UserRound className="size-5" strokeWidth={1.75} />
								</div>
								{member.status === "active" ? (
									<span className="absolute right-0 bottom-0 size-2 rounded-full border border-card bg-chart-2" />
								) : null}
							</div>
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<h1 className="text-base font-bold tracking-tight text-primary">
										{name}
									</h1>
									<ProfileStatusBadge status={member.status} />
								</div>
								<p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
									{member.memberType ?? "Subscriber"}
									<span className="mx-1.5 text-border/80">·</span>
									Person Code {member.personCode ?? "01"}
									<span className="mx-1.5 text-border/80">·</span>
									Relationship Code {member.relationshipCode ?? "18"}
								</p>
							</div>
						</div>

						<div className="hidden h-9 w-px shrink-0 bg-border/50 lg:block" />

						<div className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 sm:gap-x-6">
							<HeaderField
								label="Cardholder ID"
								value={member.memberId}
								accent
								mono
							/>
							<HeaderField
								label="NewTech Member ID"
								value={member.newtechMemberId ?? "—"}
								accent
								mono
							/>
							<HeaderField
								label="NewTech Family ID"
								value={member.newtechFamilyId ?? "—"}
								accent
								mono
							/>
							<div className="min-w-0 space-y-1">
								<p className={MEMBER_UI.labelAccent}>SSN</p>
								<div className="flex items-center gap-1">
									<span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
										{showSsn
											? `123-45-${member.ssnLast4}`
											: maskSsn(member.ssnLast4)}
									</span>
									<button
										type="button"
										aria-label={showSsn ? "Hide SSN" : "Show SSN"}
										onClick={() => setShowSsn((v) => !v)}
										className={cn(
											"p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
											MEMBER_UI.radiusSm
										)}
									>
										{showSsn ? (
											<EyeOff className="size-3" />
										) : (
											<Eye className="size-3" />
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<MetricStrip
					embedded
					compact
					className="relative bg-muted/[0.14]"
					items={[
						{
							label: "Date of Birth",
							value: formatDate(member.dob),
							sub:
								memberAge(member.dob) != null
									? `Age ${memberAge(member.dob)} · ${member.gender ?? "—"}`
									: (member.gender ?? undefined),
						},
						{
							label: "Account / Group",
							value: member.groupId ?? "—",
							sub: member.groupName ?? member.accountGroup ?? undefined,
							accent: Boolean(member.groupId),
						},
						{
							label: "Current Plan",
							value: member.planName ?? "—",
							sub: member.coverageLevel ?? undefined,
						},
						{
							label: "Employee Type",
							value: member.employeeType ?? member.accountStatus ?? "—",
						},
						{
							label: "Eligibility Status",
							value:
								member.eligibilityStatus === "eligible"
									? "Eligible"
									: member.eligibilityStatus === "termed"
										? "Termed"
										: member.eligibilityStatus === "pending"
											? "Pending"
											: "Ineligible",
							accent: member.eligibilityStatus === "eligible",
						},
						{
							label: "Source",
							value: member.sourceSystem ?? member.vendorSource ?? "—",
						},
						{
							label: "Gender",
							value: member.gender ?? "—",
						},
					]}
				/>
			</section>

			{/* Tabs */}
			<nav
				className={cn(
					"relative overflow-hidden border border-border/50 bg-muted/25 p-1",
					MEMBER_UI.radius
				)}
			>
				<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
				<div className="flex min-w-max gap-0.5 overflow-x-auto pr-7 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					{visibleTabs.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => selectTab(item)}
							className={cn(
								"px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
								MEMBER_UI.radiusSm,
								tab === item
									? "bg-primary text-primary-foreground shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]"
									: "text-muted-foreground hover:bg-background/80 hover:text-foreground"
							)}
						>
							{item}
						</button>
					))}
				</div>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-end bg-gradient-to-l from-muted/25 to-transparent pr-1.5">
					<ChevronDown className="size-3 rotate-[-90deg] text-muted-foreground/50" />
				</div>
			</nav>

			{tab === "Edit" ? (
				<MemberEditPanel member={member} onCancel={exitEditMode} />
			) : tab === "Overview" ? (
				<div className="space-y-3">
					{/* Top — Member Summary (wide) + Source Information (narrow) */}
					<div className="grid gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,0.85fr)]">
						<OverviewCard
							icon={UserRound}
							title="Member Summary"
							contentClassName="p-0"
						>
							<div className="grid sm:grid-cols-2 sm:divide-x sm:divide-border/50">
								<SummaryColumn
									rows={[
										{
											field: "Member Status",
											label:
												member.status === "active" ? (
													<StatusWithDot label="Active" />
												) : (
													<MemberStatusPill status={member.status} />
												),
										},
										{
											field: "Member Type",
											label: member.memberType ?? "—",
										},
										{
											field: "Eligibility Status",
											label:
												member.eligibilityStatus === "eligible" ? (
													<span className="text-chart-2">Eligible</span>
												) : (
													<EligPill status={member.eligibilityStatus} />
												),
										},
										{
											field: "Current Plan",
											label: member.planName,
										},
										{
											field: "Coverage Level",
											label: member.coverageLevel ?? "—",
										},
									]}
								/>
								<SummaryColumn
									rows={[
										{
											field: "Group",
											label:
												member.groupName ??
												member.groupId ??
												member.accountGroup ??
												"—",
										},
										{
											field: "Employer",
											label:
												member.accountGroup ??
												member.employeeType ??
												member.groupName ??
												"—",
										},
										{
											field: "Eligibility Effective Date",
											label: formatDate(
												member.statusEffectiveDate ?? member.coverageStart
											),
										},
										{
											field: "Eligibility Term Date",
											label: member.statusTermDate
												? formatDate(member.statusTermDate)
												: member.coverageEnd
													? formatDate(member.coverageEnd)
													: "—",
										},
										{
											field: "Last Eligibility Update",
											label: formatDateTime(
												member.lastEligibilityUpdate ?? member.dataAsOf
											),
										},
									]}
								/>
							</div>
						</OverviewCard>

						<Panel
							dense
							className="min-h-0"
							bodyClassName="flex flex-col p-0"
							title="Source Information (Latest)"
						>
							<div className="min-h-0 flex-1 overflow-hidden">
								<SummaryColumn
									rows={[
										{
											field: "Source System",
											label: member.sourceSystem ?? member.vendorSource,
										},
										{
											field: "File Name",
											label: (
												<span
													className="block truncate"
													title={member.sourceFileName}
												>
													{member.sourceFileName ?? "—"}
												</span>
											),
										},
										{
											field: "File Received",
											label: formatDateTime(member.sourceFileReceived),
										},
										{
											field: "Processing Status",
											label: String(member.recordStatus ?? "")
												.toLowerCase()
												.includes("process") ? (
												<ActiveBadge label="PROCESSED" />
											) : (
												(member.recordStatus ?? "—")
											),
										},
										{
											field: "Record Effective Date",
											label: formatDate(member.coverageStart),
										},
										{
											field: "Latest Change",
											label: member.changeDetected ?? "—",
										},
									]}
								/>
							</div>
							<OverviewFooterLink
								label="View Source History"
								onClick={() => selectTab("Vendor / Source History")}
							/>
						</Panel>
					</div>

					{/* Middle — Accumulators / Claims / Recent Activity */}
					<div className="grid gap-3 lg:grid-cols-3">
						<Panel
							dense
							bodyClassName="flex flex-col p-0"
							title={`Current Accumulators (as of ${formatDateTime(member.dataAsOf)})`}
						>
							<div className="min-h-0 flex-1 overflow-hidden">
								<Table className="w-full table-fixed">
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className={overviewTh("w-[40%] px-2")}>
												Type
											</TableHead>
											<TableHead
												className={overviewTh("w-[20%] px-2 text-right")}
											>
												Individual
											</TableHead>
											<TableHead
												className={overviewTh("w-[20%] px-2 text-right")}
											>
												Family
											</TableHead>
											<TableHead
												className={overviewTh("w-[20%] px-2 text-right")}
											>
												Remaining
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{member.accumulators.slice(0, 4).map((row, i) => (
											<TableRow
												key={row.id}
												className={cn(i % 2 === 1 && "bg-muted/[0.22]")}
											>
												<TableCell
													className={overviewTd(
														"min-w-0 overflow-hidden font-medium break-words whitespace-normal"
													)}
												>
													{row.label}
												</TableCell>
												<TableCell
													className={overviewTd("text-right tabular-nums")}
												>
													{formatCurrency(row.individual)}
												</TableCell>
												<TableCell
													className={overviewTd("text-right tabular-nums")}
												>
													{formatCurrency(row.family)}
												</TableCell>
												<TableCell
													className={overviewTd("text-right tabular-nums")}
												>
													{formatCurrency(row.remaining)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<OverviewFooterLink
								label="View All Accumulators"
								onClick={() => selectTab("Accumulators")}
							/>
						</Panel>

						<Panel
							dense
							bodyClassName="flex flex-col p-0"
							title="Latest Claims"
						>
							<div className="min-h-0 flex-1 overflow-hidden">
								<Table className="w-full table-fixed">
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className={overviewTh()}>
												Service Date
											</TableHead>
											<TableHead className={overviewTh()}>Type</TableHead>
											<TableHead className={overviewTh()}>Status</TableHead>
											<TableHead className={overviewTh("text-right")}>
												Billed Amount
											</TableHead>
											<TableHead className={overviewTh("text-right")}>
												Paid Amount
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{member.claims.slice(0, 4).map((claim, i) => (
											<TableRow
												key={claim.id}
												className={cn(i % 2 === 1 && "bg-muted/[0.22]")}
											>
												<TableCell className={overviewTd("tabular-nums")}>
													{formatDate(claim.dos)}
												</TableCell>
												<TableCell className={overviewTd()}>
													{claim.type}
												</TableCell>
												<TableCell className={overviewTd()}>
													<ClaimPill status={claim.status} />
												</TableCell>
												<TableCell
													className={overviewTd("text-right tabular-nums")}
												>
													{formatCurrency(claim.billed)}
												</TableCell>
												<TableCell
													className={overviewTd("text-right tabular-nums")}
												>
													{formatCurrency(claim.paid)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<OverviewFooterLink
								label="View All Claims"
								onClick={() => selectTab("Claims & Encounters")}
							/>
						</Panel>

						<OverviewRecentActivity
							memberId={memberId}
							member={member}
							onViewAll={() => selectTab("Change Events")}
						/>
					</div>

					{/* Bottom — Family Members (full width) */}
					<Panel dense bodyClassName="flex flex-col p-0" title="Family Members">
						<div className="min-h-0 flex-1 overflow-x-auto">
							<Table className="w-full min-w-[56rem]">
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										{(
											[
												"Name",
												"Relationship",
												"Person Code",
												"Date of Birth",
												"Gender",
												"Eligibility Status",
												"Coverage Level",
												"Effective Date",
												"Termed Date",
												"Primary Member",
											] as const
										).map((h) => (
											<TableHead key={h} className={overviewTh()}>
												{h}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{buildFamilyRows(member).map((row, i) => (
										<TableRow
											key={row.key}
											className={cn(i % 2 === 1 && "bg-muted/[0.22]")}
										>
											<TableCell className={overviewTd("font-medium")}>
												{row.name}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.relationship}
											</TableCell>
											<TableCell
												className={overviewTd("font-mono tabular-nums")}
											>
												{row.personCode}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.dob}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.gender}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.eligibility}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.coverageLevel}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.effective}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.termed}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.primary}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
						<OverviewFooterLink
							label="View All Dependents"
							onClick={() => selectTab("Family / Dependents")}
						/>
					</Panel>
				</div>
			) : (
				<TabBody
					tab={tab}
					member={member}
					memberId={memberId}
					onOpenSourceRecord={setSourceRecordId}
					showSsn={showSsn}
					setShowSsn={setShowSsn}
					onEdit={enterEditMode}
					onSelectTab={selectTab}
				/>
			)}
			<MemberSourceRecordViewer
				memberId={memberId}
				recordId={sourceRecordId ?? ""}
				open={Boolean(sourceRecordId)}
				onOpenChange={(open) => {
					if (!open) setSourceRecordId(null);
				}}
			/>
		</div>
	);
}

function FamilyRecordFooter({ count }: { count: number }) {
	if (count <= 0) {
		return (
			<p className="border-t border-border/40 px-3 py-1.5 text-[11px] text-muted-foreground">
				Showing 0 records
			</p>
		);
	}
	return (
		<p className="border-t border-border/40 px-3 py-1.5 text-[11px] text-muted-foreground">
			Showing 1 to {count} of {count} records
		</p>
	);
}

function formatAmountOrDash(v: number | null | undefined) {
	if (v == null) return "—";
	return formatCurrency(v);
}

function amountCell(
	triple: AccumulatorAmountTriple,
	field: keyof AccumulatorAmountTriple
) {
	return formatAmountOrDash(triple[field]);
}

const ACCUM_KPI_ICONS: Record<string, ReactNode> = {
	medical_deductible: <Activity className="size-3.5 text-sky-600" />,
	medical_oop: <Shield className="size-3.5 text-sky-600" />,
	medical_benefit_max: <BriefcaseMedical className="size-3.5 text-sky-600" />,
	pharmacy_deductible: <Pill className="size-3.5 text-violet-600" />,
	pharmacy_oop: <Tablets className="size-3.5 text-violet-600" />,
	pharmacy_benefit_max: <ClipboardList className="size-3.5 text-violet-600" />,
	total_paid: <DollarSign className="size-3.5 text-emerald-600" />,
};

function AccumulatorKpiCard({ kpi }: { kpi: AccumulatorKpi }) {
	const hasTotal = kpi.individualTotal != null || kpi.familyTotal != null;
	return (
		<div
			className={cn(
				"border border-border/70 bg-card px-3 py-2.5",
				MEMBER_UI.radius
			)}
		>
			<div className="flex items-center gap-1.5">
				{ACCUM_KPI_ICONS[kpi.key] ?? (
					<Activity className="size-3.5 text-muted-foreground" />
				)}
				<p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
					{kpi.label}
				</p>
			</div>
			<div className="mt-2 space-y-1 text-[11px] tabular-nums">
				<p>
					<span className="text-muted-foreground">Individual: </span>
					<span className="font-semibold text-foreground">
						{formatCurrency(kpi.individualApplied)}
					</span>
					{hasTotal && kpi.individualTotal != null ? (
						<span className="text-muted-foreground">
							{" "}
							/ {formatCurrency(kpi.individualTotal)}
						</span>
					) : null}
				</p>
				<p>
					<span className="text-muted-foreground">Family: </span>
					<span className="font-semibold text-foreground">
						{formatCurrency(kpi.familyApplied)}
					</span>
					{hasTotal && kpi.familyTotal != null ? (
						<span className="text-muted-foreground">
							{" "}
							/ {formatCurrency(kpi.familyTotal)}
						</span>
					) : null}
				</p>
			</div>
		</div>
	);
}

function AccumulatorCategoryTable({
	title,
	rows,
	memberId,
	flatById,
	historyLabel,
	headerExtra,
}: {
	title: string;
	rows: AccumulatorTableRow[];
	memberId: string;
	flatById: Map<
		string,
		{
			label: string;
			individual: number;
			family: number;
			remaining: number;
			limit: number;
		}
	>;
	historyLabel: string;
	headerExtra?: ReactNode;
}) {
	return (
		<DemoSection
			title={title}
			bodyClassName="p-0"
			titleBadge={
				<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
					{rows.length}
				</span>
			}
			headerExtra={headerExtra}
		>
			<TableScroll minWidthClassName="min-w-[72rem]">
				<Table
					className="w-full min-w-[72rem]"
					containerClassName="overflow-visible"
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Plan ID
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Account Group ID
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Internal Member ID
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Internal Family ID
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Accumulator Type
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Level
							</TableHead>
							<TableHead colSpan={3} className={overviewTh("text-center")}>
								Deductible Amount
							</TableHead>
							<TableHead colSpan={3} className={overviewTh("text-center")}>
								OOP Amount
							</TableHead>
							<TableHead colSpan={3} className={overviewTh("text-center")}>
								Benefit Max Amount
							</TableHead>
							<TableHead
								rowSpan={2}
								className={overviewTh("align-bottom text-right")}
							>
								Plan Year
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Plan Year
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Reset Date
							</TableHead>
							<TableHead rowSpan={2} className={overviewTh("align-bottom")}>
								Actions
							</TableHead>
						</TableRow>
						<TableRow className="hover:bg-transparent">
							{(
								[
									"Applied",
									"Remaining",
									"Total",
									"Applied",
									"Remaining",
									"Total",
									"Applied",
									"Remaining",
									"Total",
								] as const
							).map((h, i) => (
								<TableHead
									key={`${h}-${i}`}
									className={overviewTh("text-right")}
								>
									{h}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={19}
									className="h-10 text-center text-xs text-muted-foreground"
								>
									No {title.toLowerCase()} for this member.
								</TableCell>
							</TableRow>
						) : (
							rows.map((r, i) => {
								const flat = r.sourceAccumulatorId
									? flatById.get(r.sourceAccumulatorId)
									: undefined;
								const range =
									r.planYearStart && r.planYearEnd
										? `${formatDate(r.planYearStart)} - ${formatDate(r.planYearEnd)}`
										: "—";
								return (
									<TableRow
										key={r.id}
										className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
									>
										<TableCell className={overviewTd("font-mono")}>
											{r.planId || "—"}
										</TableCell>
										<TableCell className={overviewTd()}>
											{r.accountGroupId || "—"}
										</TableCell>
										<TableCell className={overviewTd("font-mono")}>
											{r.internalMemberId || "—"}
										</TableCell>
										<TableCell className={overviewTd("font-mono")}>
											{r.internalFamilyId || "—"}
										</TableCell>
										<TableCell className={overviewTd("font-medium")}>
											{r.accumulatorType || "—"}
										</TableCell>
										<TableCell className={overviewTd("capitalize")}>
											{r.level}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.deductible, "applied")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.deductible, "remaining")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.deductible, "total")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.oop, "applied")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.oop, "remaining")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.oop, "total")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.benefitMax, "applied")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.benefitMax, "remaining")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{amountCell(r.benefitMax, "total")}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{formatAmountOrDash(r.planYearAmount)}
										</TableCell>
										<TableCell
											className={overviewTd("tabular-nums whitespace-nowrap")}
										>
											{range}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{formatDate(r.resetDate)}
										</TableCell>
										<TableCell className={overviewTd()}>
											{flat && r.sourceAccumulatorId ? (
												<MemberAccumulatorRowActions
													memberId={memberId}
													accumulatorId={r.sourceAccumulatorId}
													label={flat.label}
													individual={flat.individual}
													family={flat.family}
													limit={flat.limit}
													remaining={flat.remaining}
												/>
											) : (
												<span className="text-xs text-muted-foreground">—</span>
											)}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableScroll>
			<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 px-3 py-1.5">
				<p className="text-[11px] text-muted-foreground">
					{rows.length <= 0
						? "Showing 0 records"
						: `Showing 1 to ${rows.length} of ${rows.length} records`}
				</p>
				<button
					type="button"
					className="text-[11px] font-medium text-primary hover:underline"
					onClick={() => undefined}
				>
					{historyLabel}
				</button>
			</div>
		</DemoSection>
	);
}

function AccumulatorSummaryTab({
	member,
	memberId,
}: {
	member: MemberDetail;
	memberId: string;
}) {
	const summary: AccumulatorSummary =
		member.accumulatorSummary ?? buildAccumulatorSummaryForMember(member);
	const flatById = useMemo(() => {
		const m = new Map<
			string,
			{
				label: string;
				individual: number;
				family: number;
				remaining: number;
				limit: number;
			}
		>();
		for (const a of member.accumulators ?? []) {
			m.set(a.id, a);
		}
		return m;
	}, [member.accumulators]);

	const planLabel = summary.currentPlanName?.trim() || member.planName || "—";

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<h3 className="text-sm font-semibold tracking-tight text-foreground">
					Accumulator Summary{" "}
					<span className="font-medium text-muted-foreground">
						(Current Plan: {planLabel})
					</span>
				</h3>
				<div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
					<span>
						Effective Date:{" "}
						<span className="font-medium tabular-nums text-foreground">
							{formatDate(summary.effectiveDate)}
						</span>
					</span>
					<span className="inline-flex items-center gap-1">
						As of Date:{" "}
						<span className="font-medium tabular-nums text-foreground">
							{formatDate(summary.asOfDate)}
						</span>
						<CalendarDays className="size-3.5" />
					</span>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
				{summary.kpis.map((kpi) => (
					<AccumulatorKpiCard key={kpi.key} kpi={kpi} />
				))}
			</div>

			<AccumulatorCategoryTable
				title="Medical Accumulators"
				rows={summary.medicalRows}
				memberId={memberId}
				flatById={flatById}
				historyLabel="View Full Medical Accumulator History >"
				headerExtra={<MemberCreateAccumulatorButton memberId={memberId} />}
			/>

			<AccumulatorCategoryTable
				title="Pharmacy Accumulators"
				rows={summary.pharmacyRows}
				memberId={memberId}
				flatById={flatById}
				historyLabel="View Full Pharmacy Accumulator History >"
			/>

			<DemoSection
				title="Recent Accumulator Transactions"
				bodyClassName="p-0"
				titleBadge={
					<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
						{summary.recentTransactions.length}
					</span>
				}
			>
				<TableScroll minWidthClassName="min-w-[56rem]">
					<Table
						className="w-full min-w-[56rem] table-fixed"
						containerClassName="overflow-visible"
					>
						<TableHeader className="w-full">
							<TableRow className="hover:bg-transparent">
								{(
									[
										"Date",
										"Plan ID",
										"Accumulator Type",
										"Level",
										"Service Date",
										"Description",
										"Amount",
										"Individual Amount",
										"Family Amount",
										"Source",
									] as const
								).map((h) => (
									<TableHead
										key={h}
										className={overviewTh(
											h.includes("Amount") ? "text-right" : undefined
										)}
									>
										{h}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{summary.recentTransactions.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-10 text-center text-xs text-muted-foreground"
									>
										No accumulator transactions for this member.
									</TableCell>
								</TableRow>
							) : (
								summary.recentTransactions.map((tx, i) => (
									<TableRow
										key={tx.id}
										className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
									>
										<TableCell className={overviewTd("tabular-nums")}>
											{formatDate(tx.date)}
										</TableCell>
										<TableCell className={overviewTd("font-mono")}>
											{tx.planId || "—"}
										</TableCell>
										<TableCell className={overviewTd()}>
											{tx.accumulatorType || "—"}
										</TableCell>
										<TableCell className={overviewTd("capitalize")}>
											{tx.level}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{formatDate(tx.serviceDate)}
										</TableCell>
										<TableCell className={overviewTd()}>
											{tx.description || "—"}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{formatCurrency(tx.amount)}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{formatCurrency(tx.individualAmount)}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{formatCurrency(tx.familyAmount)}
										</TableCell>
										<TableCell className={overviewTd()}>
											{tx.source || "—"}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableScroll>
				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 px-3 py-1.5">
					<p className="text-[11px] text-muted-foreground">
						{summary.recentTransactions.length <= 0
							? "Showing 0 records"
							: `Showing 1 to ${summary.recentTransactions.length} of ${summary.recentTransactions.length} records`}
					</p>
					<button
						type="button"
						className="text-[11px] font-medium text-primary hover:underline"
						onClick={() => undefined}
					>
						View Full Accumulator History &gt;
					</button>
				</div>
			</DemoSection>
		</div>
	);
}

function FamilyDependentsTab({
	member,
	memberId,
}: {
	member: NonNullable<ReturnType<typeof getMember>>;
	memberId: string;
}) {
	const [showAdd, setShowAdd] = useState(false);
	const familyRows = buildFamilyRows(member);
	const dependentRows = familyRows.filter((r) => r.isDependent);

	return (
		<div className="space-y-2.5">
			<DemoSection
				title="Family Members"
				editLabel="View Family Tree"
				onEdit={() => {
					/* tree view not available — keep real data only */
				}}
				bodyClassName="p-0"
				actionIcon={<Network className="size-3.5" />}
			>
				<div className="overflow-x-auto">
					<Table className="w-full min-w-[56rem]">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								{(
									[
										"Name",
										"Relationship",
										"Person Code",
										"Date of Birth",
										"Gender",
										"Eligibility Status",
										"Coverage Level",
										"Effective Date",
										"Termed Date",
										"Primary Member",
									] as const
								).map((h) => (
									<TableHead key={h} className={overviewTh()}>
										{h}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{familyRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-10 text-center text-xs text-muted-foreground"
									>
										No family members for this member.
									</TableCell>
								</TableRow>
							) : (
								familyRows.map((row, i) => (
									<TableRow
										key={row.key}
										className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
									>
										<TableCell className={overviewTd("font-medium")}>
											{row.name}
										</TableCell>
										<TableCell className={overviewTd()}>
											{row.relationship}
										</TableCell>
										<TableCell className={overviewTd("font-mono tabular-nums")}>
											{row.personCode}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{row.dob}
										</TableCell>
										<TableCell className={overviewTd()}>{row.gender}</TableCell>
										<TableCell className={overviewTd()}>
											{row.eligibility}
										</TableCell>
										<TableCell className={overviewTd()}>
											{row.coverageLevel}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{row.effective}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{row.termed}
										</TableCell>
										<TableCell className={overviewTd()}>
											{row.primary}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				<FamilyRecordFooter count={familyRows.length} />
			</DemoSection>

			<DemoSection
				title="Dependents"
				editLabel="View Dependency History"
				onEdit={() => {
					/* history feed not on family links — no mock rows */
				}}
				bodyClassName="p-0"
				headerExtra={
					!isMembersMockEnabled() ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 border-primary/40 px-2.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
							onClick={() => setShowAdd((v) => !v)}
						>
							<Plus className="mr-1 size-3" />
							Add Dependent
						</Button>
					) : null
				}
				actionIcon={<Clock className="size-3.5" />}
			>
				<div className="overflow-x-auto">
					<Table className="w-full min-w-[56rem]">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								{(
									[
										"Name",
										"Relationship",
										"Person Code",
										"Date of Birth",
										"Gender",
										"Student Status",
										"Disability Status",
										"Eligibility Status",
										"Effective Date",
										"Termed Date",
									] as const
								).map((h) => (
									<TableHead key={h} className={overviewTh()}>
										{h}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{dependentRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-10 text-center text-xs text-muted-foreground"
									>
										No dependents linked for this member.
									</TableCell>
								</TableRow>
							) : (
								dependentRows.map((row, i) => (
									<TableRow
										key={row.key}
										className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
									>
										<TableCell className={overviewTd("font-medium")}>
											{row.name}
										</TableCell>
										<TableCell className={overviewTd()}>
											{row.dependentRelationship}
										</TableCell>
										<TableCell className={overviewTd("font-mono tabular-nums")}>
											{row.personCode}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{row.dob}
										</TableCell>
										<TableCell className={overviewTd()}>{row.gender}</TableCell>
										<TableCell className={overviewTd()}>
											{row.studentStatus}
										</TableCell>
										<TableCell className={overviewTd()}>
											{row.disabilityStatus}
										</TableCell>
										<TableCell className={overviewTd()}>
											{row.eligibility}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{row.effective}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{row.termed}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				<FamilyRecordFooter count={dependentRows.length} />
			</DemoSection>

			{showAdd && !isMembersMockEnabled() ? (
				<div className="overflow-hidden border border-border/70 bg-card">
					<div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
						<h3 className="text-[13px] font-semibold text-primary">
							Add Dependent
						</h3>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => setShowAdd(false)}
						>
							Close
						</Button>
					</div>
					<div className="p-3">
						<MemberFamilyEditor
							memberId={memberId}
							vendorId={member.vendorId}
							subscriberCardholderId={member.memberId}
							planName={member.planName}
							program={member.program}
							defaultSubTab="add"
							showSync={false}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}

function FeedStatusPill({
	status,
}: {
	status: "success" | "warning" | "failed";
}) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "success" &&
					"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
				status === "warning" &&
					"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
				status === "failed" &&
					"bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300"
			)}
		>
			{status}
		</span>
	);
}

function claimStatusBadge(status: ClaimStatus) {
	if (status === "paid") return <SoftGreenBadge>Paid</SoftGreenBadge>;
	if (status === "denied") return <SoftRedBadge>Denied</SoftRedBadge>;
	if (status === "pending") return <SoftAmberBadge>Pending</SoftAmberBadge>;
	if (status === "partial") return <SoftAmberBadge>Partial</SoftAmberBadge>;
	return (
		<span className="text-xs capitalize text-muted-foreground">{status}</span>
	);
}

function MemberClaimsEncountersTab({
	member,
	memberId,
}: {
	member: NonNullable<ReturnType<typeof getMember>>;
	memberId: string;
}) {
	const claims = member.claims ?? [];
	const encounters = member.encounters ?? [];
	const billedTotal = claims.reduce((s, c) => s + (c.billed || 0), 0);
	const paidTotal = claims.reduce((s, c) => s + (c.paid || 0), 0);
	const denied = claims.filter((c) => c.status === "denied").length;
	const pending = claims.filter((c) => c.status === "pending").length;
	const lastClaim =
		member.lastClaimDate ||
		[...claims]
			.map((c) => c.dos)
			.filter((d) => d && d !== "—")
			.sort()
			.at(-1) ||
		null;

	function renderClaimTable(rows: typeof claims, emptyLabel: string) {
		return (
			<>
				<div className="overflow-x-auto">
					<Table className="w-full min-w-[56rem]">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								{(
									[
										"Service Date",
										"Claim #",
										"Type",
										"Provider",
										"Billed",
										"Paid",
										"Status",
										"Actions",
									] as const
								).map((h) => (
									<TableHead
										key={h}
										className={overviewTh(
											h === "Billed" || h === "Paid" ? "text-right" : undefined
										)}
									>
										{h}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="h-10 text-center text-xs text-muted-foreground"
									>
										{emptyLabel}
									</TableCell>
								</TableRow>
							) : (
								rows.map((c, i) => (
									<TableRow
										key={c.id}
										className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
									>
										<TableCell className={overviewTd("tabular-nums")}>
											{formatDate(c.dos)}
										</TableCell>
										<TableCell className={overviewTd("font-mono")}>
											{c.claimNumber?.trim() || "—"}
										</TableCell>
										<TableCell className={overviewTd()}>
											{c.type?.trim() || "—"}
										</TableCell>
										<TableCell className={overviewTd()}>
											{c.provider?.trim() || "—"}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{formatCurrency(c.billed)}
										</TableCell>
										<TableCell
											className={overviewTd("text-right tabular-nums")}
										>
											{formatCurrency(c.paid)}
										</TableCell>
										<TableCell className={overviewTd()}>
											{claimStatusBadge(c.status)}
										</TableCell>
										<TableCell className={overviewTd()}>
											<MemberClaimRowActions
												memberId={memberId}
												claimId={c.id}
												dos={c.dos}
												claimNumber={c.claimNumber}
												claimKind={c.type}
												provider={c.provider}
												billed={c.billed}
												paid={c.paid}
												status={c.status}
											/>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				<FamilyRecordFooter count={rows.length} />
			</>
		);
	}

	const kpis: {
		label: string;
		value: string;
		hint?: string;
		tone?: "danger" | "warn";
	}[] = [
		{
			label: "Claims YTD",
			value: String(member.claimsYtd ?? claims.length),
			hint: lastClaim != null ? `Last ${formatDate(lastClaim)}` : undefined,
		},
		{
			label: "Paid YTD",
			value: formatCurrency(member.paidYtd ?? 0),
		},
		{
			label: "Billed (Listed)",
			value: formatCurrency(billedTotal),
			hint: paidTotal > 0 ? `Paid ${formatCurrency(paidTotal)}` : undefined,
		},
		{
			label: "Denied",
			value: String(denied),
			tone: denied > 0 ? "danger" : undefined,
		},
		{
			label: "Pending",
			value: String(pending),
			tone: pending > 0 ? "warn" : undefined,
		},
		{
			label: "Encounters",
			value: String(encounters.length),
		},
	];

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
				{kpis.map((kpi) => (
					<div
						key={kpi.label}
						className={cn(
							"border border-border/70 bg-card px-3 py-2.5",
							MEMBER_UI.radius
						)}
					>
						<p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
							{kpi.label}
						</p>
						<p
							className={cn(
								"mt-1 text-lg font-semibold tracking-tight tabular-nums",
								kpi.tone === "danger"
									? "text-red-700 dark:text-red-400"
									: kpi.tone === "warn"
										? "text-amber-800 dark:text-amber-300"
										: "text-foreground"
							)}
						>
							{kpi.value}
						</p>
						{kpi.hint ? (
							<p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
								{kpi.hint}
							</p>
						) : null}
					</div>
				))}
			</div>

			<DemoSection
				title="Claims"
				bodyClassName="p-0"
				titleBadge={
					<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
						{claims.length}
					</span>
				}
				headerExtra={<MemberCreateClaimButton memberId={memberId} />}
			>
				{renderClaimTable(claims, "No claims for this member.")}
			</DemoSection>

			<DemoSection
				title="Encounters"
				bodyClassName="p-0"
				titleBadge={
					<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
						{encounters.length}
					</span>
				}
			>
				{renderClaimTable(encounters, "No encounters for this member.")}
			</DemoSection>
		</div>
	);
}

function DemoSection({
	title,
	editLabel,
	onEdit,
	children,
	className,
	bodyClassName,
	headerExtra,
	actionIcon,
	titleBadge,
}: {
	title: string;
	editLabel?: string;
	onEdit?: () => void;
	children: ReactNode;
	className?: string;
	bodyClassName?: string;
	headerExtra?: ReactNode;
	actionIcon?: ReactNode;
	titleBadge?: ReactNode;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden border border-border/70 bg-card",
				MEMBER_UI.radius,
				className
			)}
		>
			<div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-1.5">
				<div className="flex min-w-0 items-center gap-2">
					<h3 className="text-[13px] font-semibold tracking-tight text-primary">
						{title}
					</h3>
					{titleBadge}
				</div>
				<div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
					{headerExtra}
					{editLabel && onEdit ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 border-primary/40 px-2.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
							onClick={onEdit}
						>
							{actionIcon ? (
								<span className="mr-1 inline-flex">{actionIcon}</span>
							) : null}
							{editLabel}
						</Button>
					) : null}
				</div>
			</div>
			<div className={cn(bodyClassName ?? "px-3 py-1")}>{children}</div>
		</section>
	);
}

function DemoField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="grid min-w-0 grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] items-baseline gap-x-2 border-b border-border/35 py-1.5 last:border-b-0 sm:grid-cols-[minmax(8.5rem,10.5rem)_minmax(0,1fr)]">
			<span className="text-[11px] leading-snug font-semibold text-foreground/80">
				{label}
			</span>
			<div className="min-w-0 text-[13px] leading-snug text-foreground break-words">
				{value ?? "—"}
			</div>
		</div>
	);
}

function OptionalDemoField({
	label,
	value,
}: {
	label: string;
	value: ReactNode;
}) {
	if (value == null) return null;
	if (typeof value === "string" && (value === "—" || value.trim() === ""))
		return null;
	return <DemoField label={label} value={value} />;
}

function relationshipToSubscriber(code?: string | null): string {
	if (!code || code === "—") return "—";
	const normalized = code.trim();
	const known: Record<string, string> = {
		"18": "Self",
		"01": "Spouse",
		"19": "Child",
		"17": "Child",
		G8: "Other",
	};
	return known[normalized] ?? normalized;
}

function dash(v: string | null | undefined): string {
	if (v == null) return "—";
	const t = String(v).trim();
	return !t || t === "—" ? "—" : t;
}

function TabBody({
	tab,
	member,
	memberId,
	onOpenSourceRecord,
	showSsn,
	setShowSsn,
	onEdit,
	onSelectTab,
}: {
	tab: Tab;
	member: NonNullable<ReturnType<typeof getMember>>;
	memberId: string;
	onOpenSourceRecord: (id: string) => void;
	showSsn: boolean;
	setShowSsn: (v: boolean | ((b: boolean) => boolean)) => void;
	onEdit?: () => void;
	onSelectTab?: (t: Tab) => void;
}) {
	if (tab === "Demographics") {
		const age = memberAge(member.dob);
		const legalName = displayName(member);

		const homeStreet = [member.addressLine1, member.addressLine2]
			.map((p) => (p ?? "").trim())
			.filter(Boolean)
			.join(", ");
		const hasHome =
			Boolean(homeStreet) ||
			Boolean(member.city?.trim()) ||
			Boolean(member.state?.trim()) ||
			Boolean(member.zip?.trim());

		const mailStreet = [member.mailingAddressLine1, member.mailingAddressLine2]
			.map((p) => (p ?? "").trim())
			.filter(Boolean)
			.join(", ");
		const hasMail =
			Boolean(mailStreet) ||
			Boolean(member.mailingCity?.trim()) ||
			Boolean(member.mailingState?.trim()) ||
			Boolean(member.mailingZip?.trim());

		const addressEffective = dash(
			member.statusEffectiveDate ??
				member.coverageStart ??
				member.enrollmentDate ??
				member.memberSince
		);

		type AddressRow = {
			type: string;
			address: string;
			city: string;
			state: string;
			zip: string;
			country: string;
			phone: string;
			email: string;
			effective: string;
		};

		const addressRows: AddressRow[] = [];
		if (hasHome) {
			addressRows.push({
				type: "Home",
				address: dash(homeStreet),
				city: dash(member.city),
				state: dash(member.state),
				zip: dash(member.zip),
				country: "—",
				phone: dash(member.phone),
				email: dash(member.email),
				effective: addressEffective,
			});
		}
		if (hasMail) {
			addressRows.push({
				type: "Mailing",
				address: dash(mailStreet),
				city: dash(member.mailingCity),
				state: dash(member.mailingState),
				zip: dash(member.mailingZip),
				country: "—",
				phone: "—",
				email: "—",
				effective: addressEffective,
			});
		}

		type IdRow = {
			type: string;
			number: string;
			issuedBy: string;
			issueDate: string;
			expirationDate: string;
		};
		const idRows: IdRow[] = [];
		if (member.newtechMemberId?.trim()) {
			idRows.push({
				type: "NewTech Member ID",
				number: member.newtechMemberId.trim(),
				issuedBy: "NewTech",
				issueDate: "—",
				expirationDate: "—",
			});
		}
		if (member.newtechFamilyId?.trim()) {
			idRows.push({
				type: "NewTech Family ID",
				number: member.newtechFamilyId.trim(),
				issuedBy: "NewTech",
				issueDate: "—",
				expirationDate: "—",
			});
		}
		if (member.alternateId?.trim()) {
			idRows.push({
				type: "Alternate ID",
				number: member.alternateId.trim(),
				issuedBy: "—",
				issueDate: "—",
				expirationDate: "—",
			});
		}
		if (member.externalId?.trim()) {
			idRows.push({
				type: "External ID",
				number: member.externalId.trim(),
				issuedBy: "—",
				issueDate: "—",
				expirationDate: "—",
			});
		}

		return (
			<div className="space-y-2.5">
				<DemoSection
					title="Personal Information"
					editLabel="Edit Personal Information"
					onEdit={onEdit}
				>
					<div className="grid gap-x-4 sm:grid-cols-2">
						<div>
							<DemoField label="Full Legal Name" value={legalName} />
							<DemoField
								label="Preferred Name"
								value={dash(member.preferredName)}
							/>
							<DemoField
								label="Date of Birth"
								value={
									<span className="inline-flex flex-wrap items-center gap-2">
										<span className="tabular-nums">
											{formatDate(member.dob)}
										</span>
										{age != null ? (
											<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
												Age {age}
											</span>
										) : null}
									</span>
								}
							/>
							<DemoField label="Gender" value={dash(member.gender)} />
							<DemoField label="Marital Status" value="—" />
							<DemoField
								label="Language Preference"
								value={dash(member.preferredLanguage)}
							/>
							<DemoField
								label="SSN"
								value={
									<span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
										{showSsn
											? `***-**-${member.ssnLast4}`
											: maskSsn(member.ssnLast4)}
										<button
											type="button"
											className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
											aria-label={showSsn ? "Hide SSN" : "Show SSN"}
											onClick={() => setShowSsn((v) => !v)}
										>
											{showSsn ? (
												<EyeOff className="size-3.5" />
											) : (
												<Eye className="size-3.5" />
											)}
										</button>
									</span>
								}
							/>
						</div>
						<div>
							<DemoField label="Person Code" value={dash(member.personCode)} />
							<DemoField
								label="Relationship to Subscriber"
								value={relationshipToSubscriber(member.relationshipCode)}
							/>
							<DemoField label="Member Type" value={dash(member.memberType)} />
							<DemoField label="Citizenship Status" value="—" />
							<DemoField label="Ethnicity" value={dash(member.ethnicity)} />
							<DemoField label="Race" value={dash(member.race)} />
							<DemoField label="Veteran Status" value="—" />
						</div>
					</div>
				</DemoSection>

				<DemoSection
					title="Contact Information"
					editLabel="Edit Contact Information"
					onEdit={onEdit}
					bodyClassName="p-0"
				>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Address Type",
											"Address",
											"City",
											"State",
											"Zip Code",
											"Country",
											"Phone",
											"Email",
											"Effective Date",
										] as const
									).map((h) => (
										<TableHead
											key={h}
											className={overviewTh("whitespace-nowrap")}
										>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{addressRows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={9}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No address records for this member.
										</TableCell>
									</TableRow>
								) : (
									addressRows.map((row) => (
										<TableRow key={row.type}>
											<TableCell className={overviewTd("font-medium")}>
												{row.type}
											</TableCell>
											<TableCell
												className={overviewTd("max-w-[14rem] truncate")}
											>
												{row.address}
											</TableCell>
											<TableCell className={overviewTd()}>{row.city}</TableCell>
											<TableCell className={overviewTd()}>
												{row.state}
											</TableCell>
											<TableCell
												className={overviewTd("font-mono tabular-nums")}
											>
												{row.zip}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.country}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.phone}
											</TableCell>
											<TableCell
												className={overviewTd("max-w-[12rem] truncate")}
											>
												{row.email}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.effective === "—"
													? "—"
													: formatDate(row.effective)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					{onEdit ? (
						<div className="flex justify-center border-t border-border/50 py-1.5">
							<button
								type="button"
								onClick={onEdit}
								className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
							>
								<Plus className="size-3" />
								Add New Address
							</button>
						</div>
					) : null}
				</DemoSection>

				<div className="grid gap-2.5 lg:grid-cols-2">
					<DemoSection
						title="Identification Information"
						editLabel="Edit Identification"
						onEdit={onEdit}
						bodyClassName="p-0"
						className="min-h-0"
					>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										{(
											[
												"ID Type",
												"ID Number",
												"Issued By",
												"Issue Date",
												"Expiration Date",
											] as const
										).map((h) => (
											<TableHead
												key={h}
												className={overviewTh("whitespace-nowrap")}
											>
												{h}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{idRows.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="h-10 text-center text-xs text-muted-foreground"
											>
												No identification records for this member.
											</TableCell>
										</TableRow>
									) : (
										idRows.map((row) => (
											<TableRow key={`${row.type}-${row.number}`}>
												<TableCell className={overviewTd("font-medium")}>
													{row.type}
												</TableCell>
												<TableCell className={overviewTd("font-mono")}>
													{row.number}
												</TableCell>
												<TableCell className={overviewTd()}>
													{row.issuedBy}
												</TableCell>
												<TableCell className={overviewTd()}>
													{row.issueDate}
												</TableCell>
												<TableCell className={overviewTd()}>
													{row.expirationDate}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
						{onEdit ? (
							<div className="flex justify-center border-t border-border/50 py-1.5">
								<button
									type="button"
									onClick={onEdit}
									className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
								>
									<Plus className="size-3" />
									Add New ID
								</button>
							</div>
						) : null}
					</DemoSection>
				</div>
			</div>
		);
	}

	if (tab === "Employment & Group") {
		const groupName = dash(member.groupName ?? member.accountGroup);
		const groupId = dash(member.groupId);
		const clientId = dash(member.clientId);
		const accountType = dash(member.accountType);
		const accountStatus = dash(member.accountStatus);
		const memberType = dash(member.memberType);
		const employeeType = dash(member.employeeType);
		const hireDate = member.enrollmentDate ?? member.memberSince;
		const program = member.program;

		return (
			<div className="space-y-2.5">
				<DemoSection
					title="Employment & Group"
					editLabel="Edit employment & group"
					onEdit={onEdit}
				>
					<div className="grid gap-x-4 sm:grid-cols-2">
						<div>
							<OptionalDemoField label="Group name" value={groupName} />
							<OptionalDemoField
								label="Group ID"
								value={
									groupId === "—" ? null : (
										<span className="font-mono text-sm">{groupId}</span>
									)
								}
							/>
							<OptionalDemoField
								label="Client ID"
								value={
									clientId === "—" ? null : (
										<span className="font-mono text-sm">{clientId}</span>
									)
								}
							/>
							<OptionalDemoField label="Account type" value={accountType} />
							<OptionalDemoField label="Account status" value={accountStatus} />
						</div>
						<div>
							<OptionalDemoField label="Member type" value={memberType} />
							<OptionalDemoField label="Employee type" value={employeeType} />
							<OptionalDemoField
								label="Hire / enrollment date"
								value={
									hireDate ? (
										<span className="tabular-nums">{formatDate(hireDate)}</span>
									) : null
								}
							/>
							<OptionalDemoField label="Program" value={program} />
							<OptionalDemoField label="Line of business" value={member.lob} />
						</div>
					</div>
				</DemoSection>
			</div>
		);
	}

	if (tab === "Eligibility") {
		const history = member.eligibilityHistory ?? [];
		const exceptions = member.exceptions ?? [];
		const openExceptionCount = exceptions.filter(
			(e) => e.status === "open" || e.status === "in_progress"
		).length;
		const sources = member.vendorHistory ?? [];
		const statusEffective = member.statusEffectiveDate ?? member.coverageStart;
		const statusTerm = member.statusTermDate ?? null;
		const eligibilityTerm =
			member.disenrollmentDate ?? member.coverageEnd ?? null;
		const lastUpdate = member.lastEligibilityUpdate ?? member.dataAsOf ?? null;
		const sourceSystem =
			member.sourceSystem?.trim() ||
			member.vendorSource?.trim() ||
			history[0]?.source ||
			"—";

		return (
			<div className="space-y-2.5">
				<DemoSection title="Eligibility Summary" bodyClassName="p-0">
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[52rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Eligibility Status",
											"Status Effective Date",
											"Status Term Date",
											"Coverage Level",
											"Eligibility Term Date",
											"Last Eligibility Update",
											"Source System",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell className={overviewTd()}>
										{eligibilityStatusBadge(member.eligibilityStatus)}
									</TableCell>
									<TableCell className={overviewTd("tabular-nums")}>
										{formatDate(statusEffective)}
									</TableCell>
									<TableCell className={overviewTd("tabular-nums")}>
										{statusTerm ? formatDate(statusTerm) : "—"}
									</TableCell>
									<TableCell className={overviewTd()}>
										{member.coverageLevel?.trim() || "—"}
									</TableCell>
									<TableCell className={overviewTd("tabular-nums")}>
										{eligibilityTerm ? formatDate(eligibilityTerm) : "—"}
									</TableCell>
									<TableCell className={overviewTd("tabular-nums")}>
										{lastUpdate ? formatDateTime(lastUpdate) : "—"}
									</TableCell>
									<TableCell className={overviewTd()}>{sourceSystem}</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</DemoSection>

				<DemoSection title="Eligibility History" bodyClassName="p-0">
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[56rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Effective Date",
											"Term Date",
											"Eligibility Status",
											"Reason",
											"Eligibility Type",
											"Updated By",
											"Updated Date",
											"Source System",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{history.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No eligibility history for this member.
										</TableCell>
									</TableRow>
								) : (
									history.map((r, i) => (
										<TableRow
											key={r.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd("tabular-nums")}>
												{formatDate(r.startDate)}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{r.endDate ? formatDate(r.endDate) : "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{eligibilityStatusBadge(r.status)}
											</TableCell>
											<TableCell className={overviewTd()}>
												{r.reason?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{r.status === "eligible"
													? "Active"
													: r.status === "termed"
														? "Termed"
														: r.status === "pending"
															? "Pending"
															: "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{r.verifiedBy?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												—
											</TableCell>
											<TableCell className={overviewTd()}>
												{r.source?.trim() || "—"}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</DemoSection>

				<DemoSection
					title="Eligibility Exceptions"
					bodyClassName="p-0"
					titleBadge={
						openExceptionCount > 0 ? (
							<span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
								{openExceptionCount > 9 ? "9+" : openExceptionCount}
							</span>
						) : null
					}
				>
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[56rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Exception Type",
											"Description",
											"Identified Date",
											"Status",
											"Priority",
											"Resolution",
											"Resolved Date",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{exceptions.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No eligibility exceptions for this member.
										</TableCell>
									</TableRow>
								) : (
									exceptions.map((ex, i) => (
										<TableRow
											key={ex.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd("font-medium")}>
												{ex.exceptionType}
											</TableCell>
											<TableCell
												className={overviewTd(
													"max-w-[16rem] truncate text-muted-foreground"
												)}
												title={ex.description}
											>
												{ex.description}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{formatDate(ex.startDetected)}
											</TableCell>
											<TableCell className={overviewTd()}>
												{exceptionStatusBadge(ex.status)}
											</TableCell>
											<TableCell className={overviewTd()}>—</TableCell>
											<TableCell
												className={overviewTd("max-w-[12rem] truncate")}
												title={ex.resolution}
											>
												{ex.resolution?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												—
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					{onSelectTab ? (
						<OverviewFooterLink
							label="View All Eligibility Exceptions →"
							onClick={() => onSelectTab("Eligibility Exceptions")}
						/>
					) : null}
				</DemoSection>

				<DemoSection title="Eligibility Source Files" bodyClassName="p-0">
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[48rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"File Name",
											"File Received",
											"Record Effective Date",
											"Record Count",
											"Status",
											"Processed By",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{sources.length === 0 && !member.sourceFileName ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No eligibility source files for this member.
										</TableCell>
									</TableRow>
								) : sources.length === 0 && member.sourceFileName ? (
									<TableRow>
										<TableCell className={overviewTd()}>
											<span className="font-medium text-primary">
												{member.sourceFileName}
											</span>
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{formatDateTime(member.sourceFileReceived)}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											{formatDate(member.coverageStart)}
										</TableCell>
										<TableCell className={overviewTd("tabular-nums")}>
											1
										</TableCell>
										<TableCell className={overviewTd()}>
											{processedStatusBadge(
												String(member.recordStatus ?? "processed")
											)}
										</TableCell>
										<TableCell className={overviewTd()}>—</TableCell>
									</TableRow>
								) : (
									sources.map((v, i) => (
										<TableRow
											key={v.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd()}>
												<button
													type="button"
													className="text-left font-medium text-primary hover:underline"
													onClick={() => onOpenSourceRecord(v.id)}
												>
													{v.vendor}
												</button>
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{formatDateTime(v.lastReceived)}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{v.frequency && v.frequency !== "—"
													? formatDate(v.frequency)
													: "—"}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{v.recordsProcessed || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{processedStatusBadge(
													v.status === "success" ? "processed" : v.status
												)}
											</TableCell>
											<TableCell className={overviewTd()}>—</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					{onSelectTab ? (
						<OverviewFooterLink
							label="View All Source Files →"
							onClick={() => onSelectTab("Vendor / Source History")}
						/>
					) : null}
				</DemoSection>
			</div>
		);
	}

	if (tab === "Coverage & Plan History") {
		const planHistory = member.planHistory ?? [];
		const currentPlan = planHistory.find((p) => !p.endDate) ?? planHistory[0];
		const coverageLevel = member.coverageLevel?.trim() || "—";
		const planCode =
			member.planCode?.trim() ||
			member.planId?.trim() ||
			currentPlan?.planId?.trim() ||
			"—";
		const currentPlanName =
			currentPlan?.planName?.trim() || member.planName?.trim() || "—";
		const effectiveRaw =
			currentPlan?.startDate ||
			member.coverageStart ||
			member.statusEffectiveDate ||
			"";
		const termRaw =
			currentPlan?.endDate ??
			member.coverageEnd ??
			member.statusTermDate ??
			null;
		const primary = isPrimaryCoverageMember(member);
		const deps = (member.dependents ?? []).filter((d) => {
			const rel = (d.relationship || "").toLowerCase();
			const code = d.relationshipCode || "";
			return rel !== "self" && code !== "18";
		});
		const dependentCount = deps.length;
		const memberCount = dependentCount + 1;
		const sourceSystem =
			member.sourceSystem?.trim() || member.vendorSource?.trim() || "—";

		const periods =
			planHistory.length > 0
				? planHistory
				: currentPlanName !== "—"
					? [
							{
								id: "current-coverage",
								planName: currentPlanName,
								planType: member.planType || "—",
								planId: planCode,
								carrier: "—",
								startDate: effectiveRaw || "—",
								endDate: termRaw,
								changeReason: "—",
							},
						]
					: [];

		const levelHistory =
			coverageLevel !== "—" || effectiveRaw
				? [
						{
							id: "current-level",
							effective: effectiveRaw || "—",
							level: coverageLevel,
							memberCount: String(memberCount),
							dependents: String(dependentCount),
							reason: (() => {
								const raw = currentPlan?.changeReason?.trim();
								if (!raw || raw === "—") return "—";
								const typed = planChangeTypeLabel(raw);
								return typed !== "—" ? typed : raw;
							})(),
							source: sourceSystem,
						},
					]
				: [];

		return (
			<div className="space-y-3">
				<DemoSection title="Coverage Summary" bodyClassName="p-0">
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[56rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Total Coverage Periods",
											"Current Coverage",
											"Coverage Level",
											"Effective Date",
											"Termination Date",
											"Days in Current Coverage",
											"Primary Member",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell className={overviewTd("font-semibold")}>
										{periods.length}
									</TableCell>
									<TableCell className={overviewTd("font-semibold")}>
										{currentPlanName}
									</TableCell>
									<TableCell className={overviewTd("font-semibold")}>
										{coverageLevel}
									</TableCell>
									<TableCell
										className={overviewTd("font-semibold tabular-nums")}
									>
										{effectiveRaw ? formatDate(effectiveRaw) : "—"}
									</TableCell>
									<TableCell
										className={overviewTd("font-semibold tabular-nums")}
									>
										{termRaw ? formatDate(termRaw) : "—"}
									</TableCell>
									<TableCell
										className={overviewTd("font-semibold tabular-nums")}
									>
										{coverageDaysBetween(effectiveRaw, termRaw)}
									</TableCell>
									<TableCell className={overviewTd("font-semibold")}>
										{primaryMemberLabel(primary)}
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</DemoSection>

				<DemoSection
					title="Coverage Periods"
					bodyClassName="p-0"
					headerExtra={
						<CoverageTimelineLink
							label="View Coverage Timeline"
							targetId="plan-history"
						/>
					}
				>
					<div id="coverage-periods" className="overflow-x-auto">
						<Table className="w-full min-w-[64rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Period",
											"Plan Name",
											"Plan Code",
											"Coverage Level",
											"Effective Date",
											"Termination Date",
											"Days",
											"Primary Member",
											"Eligibility Status",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{periods.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={9}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No coverage periods for this member.
										</TableCell>
									</TableRow>
								) : (
									periods.map((r, i) => {
										const isCurrent = !r.endDate;
										const code =
											r.planId?.trim() && r.planId !== "—"
												? r.planId
												: isCurrent
													? planCode
													: "—";
										const level = isCurrent ? coverageLevel : "—";
										return (
											<TableRow
												key={r.id}
												className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
											>
												<TableCell className={overviewTd()}>
													{isCurrent ? (
														<SoftGreenBadge>Current</SoftGreenBadge>
													) : (
														<span className="text-xs text-muted-foreground">
															Previous
														</span>
													)}
												</TableCell>
												<TableCell className={overviewTd()}>
													{r.planName?.trim() || "—"}
												</TableCell>
												<TableCell className={overviewTd("font-mono")}>
													{code}
												</TableCell>
												<TableCell className={overviewTd()}>{level}</TableCell>
												<TableCell className={overviewTd("tabular-nums")}>
													{formatDate(r.startDate)}
												</TableCell>
												<TableCell className={overviewTd("tabular-nums")}>
													{r.endDate ? formatDate(r.endDate) : "—"}
												</TableCell>
												<TableCell className={overviewTd("tabular-nums")}>
													{coverageDaysBetween(r.startDate, r.endDate)}
												</TableCell>
												<TableCell className={overviewTd()}>
													{primaryMemberLabel(primary)}
												</TableCell>
												<TableCell className={overviewTd()}>
													{isCurrent
														? eligibilityStatusBadge(member.eligibilityStatus)
														: "—"}
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
					<FamilyRecordFooter count={periods.length} />
				</DemoSection>

				<DemoSection
					title="Plan History"
					bodyClassName="p-0"
					headerExtra={
						<CoverageTimelineLink
							label="View Plan Change Timeline"
							targetId="coverage-level-history"
						/>
					}
				>
					<div id="plan-history" className="overflow-x-auto">
						<Table className="w-full min-w-[56rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Change Date",
											"Plan Name",
											"Plan Code",
											"Change Type",
											"Reason",
											"Changed By",
											"Source System",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{planHistory.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No plan history for this member.
										</TableCell>
									</TableRow>
								) : (
									planHistory.map((r, i) => (
										<TableRow
											key={r.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd("tabular-nums")}>
												{formatDate(r.startDate)}
											</TableCell>
											<TableCell className={overviewTd()}>
												{r.planName?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd("font-mono")}>
												{r.planId?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{planChangeTypeLabel(r.changeReason)}
											</TableCell>
											<TableCell className={overviewTd()}>
												{r.changeReason?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>—</TableCell>
											<TableCell className={overviewTd()}>
												{sourceSystem}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					<FamilyRecordFooter count={planHistory.length} />
				</DemoSection>

				<DemoSection title="Coverage Level History" bodyClassName="p-0">
					<div id="coverage-level-history" className="overflow-x-auto">
						<Table className="w-full min-w-[48rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Effective Date",
											"Coverage Level",
											"Member Count",
											"Primary Member",
											"Dependents",
											"Change Reason",
											"Source System",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{levelHistory.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No coverage level history for this member.
										</TableCell>
									</TableRow>
								) : (
									levelHistory.map((r, i) => (
										<TableRow
											key={r.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd("tabular-nums")}>
												{r.effective !== "—" ? formatDate(r.effective) : "—"}
											</TableCell>
											<TableCell className={overviewTd()}>{r.level}</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{r.memberCount}
											</TableCell>
											<TableCell className={overviewTd()}>
												{primaryMemberLabel(primary)}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{r.dependents}
											</TableCell>
											<TableCell className={overviewTd()}>{r.reason}</TableCell>
											<TableCell className={overviewTd()}>{r.source}</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					<FamilyRecordFooter count={levelHistory.length} />
				</DemoSection>
			</div>
		);
	}

	if (tab === "Family / Dependents") {
		return <FamilyDependentsTab member={member} memberId={memberId} />;
	}

	if (tab === "Claims & Encounters") {
		return <MemberClaimsEncountersTab member={member} memberId={memberId} />;
	}

	if (tab === "Accumulators") {
		return <AccumulatorSummaryTab member={member} memberId={memberId} />;
	}

	if (tab === "Vendor / Source History") {
		const feeds = member.vendorHistory ?? [];
		const success = feeds.filter((v) => v.status === "success").length;
		const warning = feeds.filter((v) => v.status === "warning").length;
		const failed = feeds.filter((v) => v.status === "failed").length;
		const totalRecords = feeds.reduce(
			(s, v) => s + (v.recordsProcessed || 0),
			0
		);
		const latest = feeds[0];
		const primarySource =
			member.vendorSource?.trim() ||
			member.sourceSystem?.trim() ||
			latest?.vendor?.trim() ||
			"—";

		const kpis: {
			label: string;
			value: string;
			hint?: string;
			tone?: "danger" | "warn" | "ok";
		}[] = [
			{
				label: "Feeds",
				value: String(feeds.length),
				hint: latest?.lastReceived
					? `Latest ${formatDate(latest.lastReceived)}`
					: undefined,
			},
			{
				label: "Success",
				value: String(success),
				tone: success > 0 ? "ok" : undefined,
			},
			{
				label: "Warning",
				value: String(warning),
				tone: warning > 0 ? "warn" : undefined,
			},
			{
				label: "Failed",
				value: String(failed),
				tone: failed > 0 ? "danger" : undefined,
			},
			{
				label: "Records Processed",
				value: totalRecords.toLocaleString("en-US"),
			},
			{
				label: "Primary Source",
				value: primarySource,
			},
		];

		return (
			<div className="space-y-3">
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
					{kpis.map((kpi) => (
						<div
							key={kpi.label}
							className={cn(
								"border border-border/70 bg-card px-3 py-2.5",
								MEMBER_UI.radius
							)}
						>
							<p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
								{kpi.label}
							</p>
							<p
								className={cn(
									"mt-1 text-lg font-semibold tracking-tight tabular-nums break-words",
									kpi.tone === "ok"
										? "text-emerald-700 dark:text-emerald-400"
										: kpi.tone === "danger"
											? "text-red-700 dark:text-red-400"
											: kpi.tone === "warn"
												? "text-amber-800 dark:text-amber-300"
												: "text-foreground"
								)}
							>
								{kpi.value}
							</p>
							{kpi.hint ? (
								<p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
									{kpi.hint}
								</p>
							) : null}
						</div>
					))}
				</div>

				<DemoSection
					title="Feed History"
					bodyClassName="p-0"
					titleBadge={
						<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
							{feeds.length}
						</span>
					}
				>
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[56rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Vendor / Source",
											"Feed Type",
											"Direction",
											"Frequency",
											"Records",
											"Last Received",
											"Status",
											"Action",
										] as const
									).map((h) => (
										<TableHead
											key={h}
											className={overviewTh(
												h === "Records" ? "text-right" : undefined
											)}
										>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{feeds.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No vendor source history for this member.
										</TableCell>
									</TableRow>
								) : (
									feeds.map((v, i) => (
										<TableRow
											key={v.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd("font-medium")}>
												{v.vendor?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{v.fileFeedType?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{v.direction?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{v.frequency?.trim() || "—"}
											</TableCell>
											<TableCell
												className={overviewTd("text-right tabular-nums")}
											>
												{(v.recordsProcessed ?? 0).toLocaleString("en-US")}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{v.lastReceived ? formatDate(v.lastReceived) : "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												{v.status === "success" ? (
													<SoftGreenBadge>Success</SoftGreenBadge>
												) : v.status === "failed" ? (
													<SoftRedBadge>Failed</SoftRedBadge>
												) : v.status === "warning" ? (
													<SoftAmberBadge>Warning</SoftAmberBadge>
												) : (
													<span className="text-xs text-muted-foreground">
														—
													</span>
												)}
											</TableCell>
											<TableCell className={overviewTd()}>
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-[11px]"
													onClick={() => onOpenSourceRecord(v.id)}
												>
													View source
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					<FamilyRecordFooter count={feeds.length} />
				</DemoSection>
			</div>
		);
	}

	if (tab === "Eligibility Exceptions") {
		const rows = member.exceptions ?? [];
		const openCount = rows.filter((e) => e.status === "open").length;
		const inProgressCount = rows.filter(
			(e) => e.status === "in_progress"
		).length;
		const resolvedCount = rows.filter((e) => e.status === "resolved").length;
		const actionNeeded = openCount + inProgressCount;
		const eligibilityLabel =
			member.eligibilityStatus === "eligible"
				? "Eligible"
				: member.eligibilityStatus === "pending"
					? "Pending"
					: member.eligibilityStatus === "termed"
						? "Termed"
						: member.eligibilityStatus || "—";

		const kpis: {
			label: string;
			value: string;
			hint?: string;
			tone?: "danger" | "warn" | "ok";
		}[] = [
			{
				label: "Total",
				value: String(rows.length),
			},
			{
				label: "Open",
				value: String(openCount),
				tone: openCount > 0 ? "warn" : undefined,
			},
			{
				label: "In Progress",
				value: String(inProgressCount),
				tone: inProgressCount > 0 ? "warn" : undefined,
			},
			{
				label: "Resolved",
				value: String(resolvedCount),
				tone: resolvedCount > 0 ? "ok" : undefined,
			},
			{
				label: "Action Needed",
				value: String(actionNeeded),
				tone: actionNeeded > 0 ? "danger" : "ok",
			},
			{
				label: "Eligibility",
				value: eligibilityLabel,
				tone:
					member.eligibilityStatus === "eligible"
						? "ok"
						: member.eligibilityStatus === "pending"
							? "warn"
							: undefined,
			},
		];

		return (
			<div className="space-y-3">
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
					{kpis.map((kpi) => (
						<div
							key={kpi.label}
							className={cn(
								"border border-border/70 bg-card px-3 py-2.5",
								MEMBER_UI.radius
							)}
						>
							<p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
								{kpi.label}
							</p>
							<p
								className={cn(
									"mt-1 text-lg font-semibold tracking-tight tabular-nums",
									kpi.tone === "ok"
										? "text-emerald-700 dark:text-emerald-400"
										: kpi.tone === "danger"
											? "text-red-700 dark:text-red-400"
											: kpi.tone === "warn"
												? "text-amber-800 dark:text-amber-300"
												: "text-foreground"
								)}
							>
								{kpi.value}
							</p>
							{kpi.hint ? (
								<p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
									{kpi.hint}
								</p>
							) : null}
						</div>
					))}
				</div>

				<DemoSection
					title="Exceptions"
					bodyClassName="p-0"
					titleBadge={
						<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
							{rows.length}
						</span>
					}
					headerExtra={<MemberCreateExceptionButton memberId={memberId} />}
				>
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[56rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Type",
											"Description",
											"Detected",
											"Status",
											"Source",
											"Resolution",
											"Actions",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No eligibility exceptions for this member.
										</TableCell>
									</TableRow>
								) : (
									rows.map((ex, i) => (
										<TableRow
											key={ex.id}
											className={cn(i % 2 === 1 && "bg-muted/[0.18]")}
										>
											<TableCell className={overviewTd("font-medium")}>
												{ex.exceptionType?.trim() || "—"}
											</TableCell>
											<TableCell
												className={overviewTd(
													"max-w-[16rem] truncate text-muted-foreground"
												)}
												title={ex.description}
											>
												{ex.description?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{formatDate(ex.startDetected)}
											</TableCell>
											<TableCell className={overviewTd()}>
												{exceptionStatusBadge(ex.status)}
											</TableCell>
											<TableCell className={overviewTd()}>
												{ex.source?.trim() || "—"}
											</TableCell>
											<TableCell
												className={overviewTd("max-w-[12rem] truncate")}
												title={ex.resolution}
											>
												{ex.resolution?.trim() || "—"}
											</TableCell>
											<TableCell className={overviewTd()}>
												<MemberExceptionRowActions
													memberId={memberId}
													exceptionId={ex.id}
													exceptionType={ex.exceptionType}
													description={ex.description}
													startDetected={ex.startDetected}
													status={ex.status}
													source={ex.source}
													resolution={ex.resolution}
												/>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					<FamilyRecordFooter count={rows.length} />
				</DemoSection>
			</div>
		);
	}

	if (tab === "Change Events") {
		return <MemberChangeEventsPanel memberId={memberId} />;
	}

	if (tab === "Other Status") {
		const rows = member.otherStatuses ?? [];
		const populated = rows.filter(
			(r) =>
				(r.status && r.status !== "—") ||
				(r.detail && r.detail !== "—") ||
				r.effectiveStart ||
				r.effectiveEnd
		);
		const displayRows = populated.length > 0 ? populated : rows;

		return (
			<div className="space-y-2.5">
				<DemoSection title="Other Status" bodyClassName="p-0">
					<div className="overflow-x-auto">
						<Table className="w-full min-w-[40rem]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									{(
										[
											"Slot",
											"Status",
											"Detail",
											"Effective start",
											"Effective end",
										] as const
									).map((h) => (
										<TableHead key={h} className={overviewTh()}>
											{h}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{displayRows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-10 text-center text-xs text-muted-foreground"
										>
											No other status records for this member.
										</TableCell>
									</TableRow>
								) : (
									displayRows.map((row) => (
										<TableRow key={row.id}>
											<TableCell className={overviewTd("font-medium")}>
												{row.slot}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.status === "—" ? "—" : row.status}
											</TableCell>
											<TableCell className={overviewTd()}>
												{row.detail === "—" ? "—" : row.detail}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.effectiveStart
													? formatDate(row.effectiveStart)
													: "—"}
											</TableCell>
											<TableCell className={overviewTd("tabular-nums")}>
												{row.effectiveEnd ? formatDate(row.effectiveEnd) : "—"}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</DemoSection>
			</div>
		);
	}

	return null;
}
