"use client";

import { useMemo, useState } from "react";

import {
	AlertCircle,
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	Copy,
	Link2,
	type LucideIcon,
	Search,
	SlidersHorizontal,
	Tag,
	Upload,
	UserX,
	Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CmsEdgeMemberDetail } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeMemberDetail";
import {
	CMS_EDGE_KPI_CARD_CLASS,
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgePageFooter,
	CmsEdgeTableScroll,
	cmsEdgeKpiAccent,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_MEMBERS_KPIS,
	CMS_EDGE_MEMBERS_LIST,
	CMS_EDGE_MEMBERS_VALIDATION_SUMMARY,
	CMS_EDGE_MEMBER_FILTER_OPTIONS,
	CMS_EDGE_REPORTING_PERIODS,
	MEMBER_CMS_STATUS_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	users: Users,
	check: CheckCircle2,
	alert: AlertTriangle,
	circleAlert: AlertCircle,
	link: Link2,
} satisfies Record<(typeof CMS_EDGE_MEMBERS_KPIS)[number]["icon"], LucideIcon>;

const SUMMARY_ICONS = {
	userX: UserX,
	calendar: CalendarDays,
	tag: Tag,
	copy: Copy,
} satisfies Record<
	(typeof CMS_EDGE_MEMBERS_VALIDATION_SUMMARY)[number]["icon"],
	LucideIcon
>;

function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});
}

const DEFAULT_FILTERS = {
	status: "All",
	coverageType: "All",
	planId: "All",
	relationship: "All",
	errorType: "All",
};

export function CmsEdgeMembersEnrollmentTab() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("q2-2027");
	const [filters, setFilters] = useState(DEFAULT_FILTERS);

	const rows = useMemo(() => {
		let list = CMS_EDGE_MEMBERS_LIST;

		if (filters.status !== "All") {
			list = list.filter((row) => row.cmsStatus === filters.status);
		}
		if (filters.coverageType !== "All") {
			list = list.filter((row) => row.coverageType === filters.coverageType);
		}
		if (filters.planId !== "All") {
			list = list.filter((row) => row.planId === filters.planId);
		}
		if (filters.relationship !== "All") {
			list = list.filter((row) => row.relationship === filters.relationship);
		}
		if (filters.errorType !== "All") {
			list = list.filter((row) => row.errorType === filters.errorType);
		}

		const q = search.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(row) =>
				row.name.toLowerCase().includes(q) ||
				row.uniqueEnrolleeId.toLowerCase().includes(q) ||
				row.subscriberId.toLowerCase().includes(q) ||
				row.planId.toLowerCase().includes(q)
		);
	}, [filters, search]);

	if (selectedId) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<CmsEdgeMemberDetail onBack={() => setSelectedId(null)} />
				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h2 className="text-xl font-semibold tracking-tight text-foreground">
						Members & Enrollment
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Review member identity, enrollment periods, coverage, and CMS EDGE
						validation results.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-muted-foreground">
							Reporting Period
						</span>
						<Select value={period} onValueChange={setPeriod}>
							<SelectTrigger className="h-9 w-[140px] border-border/70 bg-card shadow-sm">
								<CalendarDays className="mr-2 size-3.5 text-muted-foreground" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CMS_EDGE_REPORTING_PERIODS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label.split(" (")[0]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="relative w-[260px]">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search member by ID, name, or plan"
							className="h-9 pl-8 text-xs"
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-border/70 bg-card shadow-sm"
					>
						<SlidersHorizontal className="mr-1.5 size-3.5" />
						Filters
					</Button>
					<Button
						size="sm"
						className="h-9 shadow-sm"
						onClick={() => toast.success("Member export started.")}
					>
						<Upload className="mr-1.5 size-3.5" />
						Export
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{CMS_EDGE_MEMBERS_KPIS.map((kpi) => {
					const Icon = KPI_ICONS[kpi.icon];
					return (
						<div key={kpi.id} className={CMS_EDGE_KPI_CARD_CLASS}>
							<span
								aria-hidden
								className={cn(
									"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
									cmsEdgeKpiAccent(kpi.tone)
								)}
							/>
							<div className="flex items-start justify-between gap-3 pl-1.5">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{kpi.label}
									</p>
									<p
										className={cn(
											"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
											kpi.valueClassName
										)}
									>
										{kpi.value}
									</p>
								</div>
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
										kpi.tone
									)}
								>
									<Icon className="size-[18px]" aria-hidden />
								</span>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
				<aside className={cn(CMS_EDGE_PANEL_CLASS, "p-4")}>
					<div className="mb-3 flex items-center justify-between gap-2">
						<h3 className="text-sm font-semibold text-foreground">Filters</h3>
						<Button
							variant="link"
							className="h-auto p-0 text-xs font-semibold text-primary"
							onClick={() => setFilters(DEFAULT_FILTERS)}
						>
							Clear All
						</Button>
					</div>
					<div className="space-y-3">
						{(
							[
								["status", "Status", CMS_EDGE_MEMBER_FILTER_OPTIONS.status],
								[
									"coverageType",
									"Coverage Type",
									CMS_EDGE_MEMBER_FILTER_OPTIONS.coverageType,
								],
								["planId", "Plan ID", CMS_EDGE_MEMBER_FILTER_OPTIONS.planId],
								[
									"relationship",
									"Relationship",
									CMS_EDGE_MEMBER_FILTER_OPTIONS.relationship,
								],
								[
									"errorType",
									"Error Type",
									CMS_EDGE_MEMBER_FILTER_OPTIONS.errorType,
								],
							] as const
						).map(([key, label, options]) => (
							<label key={key} className="block space-y-1.5">
								<span className="text-[11px] font-medium text-muted-foreground">
									{label}
								</span>
								<Select
									value={filters[key]}
									onValueChange={(value) =>
										setFilters((prev) => ({ ...prev, [key]: value }))
									}
								>
									<SelectTrigger className="h-9 w-full border-border/70 bg-background text-xs shadow-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{options.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</label>
						))}
					</div>
				</aside>

				<section
					className={cn("min-w-0 overflow-hidden", CMS_EDGE_PANEL_CLASS)}
				>
					<CmsEdgeTableScroll>
						<Table
							containerClassName={CMS_EDGE_TABLE_CONTAINER}
							className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1180px]")}
						>
							<TableHeader>
								<TableRow className="border-b border-border/50 hover:bg-transparent">
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Unique Enrollee ID
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Subscriber ID
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Relationship
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Date of Birth
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Sex
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										ZIP Code
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										HIOS Issuer ID
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Plan ID
									</TableHead>
									<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
										Coverage Period
									</TableHead>
									<TableHead
										className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
									>
										Premium
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
								{rows.map((row) => (
									<TableRow
										key={row.id}
										className="border-b border-border/40 hover:bg-muted/20"
									>
										<TableCell className="px-3 py-2.5 font-mono text-[11px] font-medium">
											{row.uniqueEnrolleeId}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.subscriberId}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.relationship}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.dateOfBirth}
										</TableCell>
										<TableCell className="px-3 py-2.5">{row.sex}</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.zipCode}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.hiosIssuerId}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.planId}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums text-muted-foreground">
											{row.coveragePeriod}
										</TableCell>
										<TableCell className="px-3 py-2.5 text-right tabular-nums">
											{formatCurrency(row.premium)}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													MEMBER_CMS_STATUS_STYLES[row.cmsStatus]
												)}
											>
												{row.cmsStatus}
											</span>
										</TableCell>
										<TableCell className="px-3 py-2.5 pr-4">
											<Button
												variant="outline"
												size="sm"
												className="h-7 px-2 text-xs text-primary"
												onClick={() => setSelectedId(row.id)}
											>
												View Details
											</Button>
										</TableCell>
									</TableRow>
								))}
								{rows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={12}
											className="px-3 py-8 text-center text-muted-foreground"
										>
											No members match these filters.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</CmsEdgeTableScroll>
				</section>
			</div>

			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-foreground">
					Enrollment Validation Summary
				</h3>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{CMS_EDGE_MEMBERS_VALIDATION_SUMMARY.map((item) => {
						const Icon = SUMMARY_ICONS[item.icon];
						return (
							<div
								key={item.id}
								className="rounded-lg border border-border/70 bg-card p-3 shadow-sm"
							>
								<div className="flex items-start gap-2.5">
									<div
										className={cn(
											"flex size-8 shrink-0 items-center justify-center rounded-md",
											item.tone
										)}
									>
										<Icon className="size-4" aria-hidden />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] font-medium text-muted-foreground">
											{item.label}
										</p>
										<p
											className={cn(
												"mt-0.5 text-lg font-semibold tabular-nums",
												item.valueClassName
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
			</section>

			<CmsEdgePageFooter />
		</div>
	);
}
