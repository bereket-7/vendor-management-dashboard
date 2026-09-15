"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
	AlertCircle,
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	ChevronRight,
	Download,
	Link2,
	type LucideIcon,
	RefreshCw,
	Search,
	Tag,
	UserX,
	Users,
	X,
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
import { CmsEdgeTablePagination } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeTablePagination";
import {
	useCmsEdgeMemberFacets,
	useCmsEdgeMembersList,
	useExportEdgeMembersCsv,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import {
	deriveMemberFilterOptions,
	deriveMemberValidationSummary,
} from "@/features/admin/features/claim-encounter/cms-edge/live-members";
import {
	CMS_EDGE_REPORTING_PERIODS,
	MEMBER_CMS_STATUS_STYLES,
	type MemberCmsStatus,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { downloadBlob, stampFilename } from "@/lib/export/csv";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	users: Users,
	check: CheckCircle2,
	alert: AlertTriangle,
	circleAlert: AlertCircle,
	link: Link2,
} satisfies Record<
	"users" | "check" | "alert" | "circleAlert" | "link",
	LucideIcon
>;

const SUMMARY_ICONS = {
	userX: UserX,
	calendar: CalendarDays,
	tag: Tag,
	copy: AlertCircle,
} satisfies Record<"userX" | "calendar" | "tag" | "copy", LucideIcon>;

const DEFAULT_FILTERS = {
	status: "All",
	coverageType: "All",
	planId: "All",
	relationship: "All",
	errorType: "All",
};

function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});
}

function statusTone(status: MemberCmsStatus) {
	return MEMBER_CMS_STATUS_STYLES[status] ?? MEMBER_CMS_STATUS_STYLES.Error;
}

export function CmsEdgeMembersEnrollmentTab() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("q2-2027");
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const deferredSearch = useDeferredValue(search.trim());
	const offset = (page - 1) * pageSize;
	const {
		members,
		kpis,
		total,
		isLoading,
		isError,
		error,
		refetch,
		isFetching,
	} = useCmsEdgeMembersList({
		search: deferredSearch || undefined,
		limit: pageSize,
		offset,
	});
	const { data: facets } = useCmsEdgeMemberFacets();
	const exportMembers = useExportEdgeMembersCsv();

	useEffect(() => {
		setPage(1);
	}, [deferredSearch, filters]);

	const filterOptions = useMemo(() => {
		const base = deriveMemberFilterOptions(members);
		const planNames = facets?.plan_name ?? [];
		if (planNames.length === 0) return base;
		return {
			...base,
			planId: [
				"All",
				...Array.from(
					new Set([...base.planId.filter((p) => p !== "All"), ...planNames])
				).sort(),
			],
		};
	}, [members, facets]);

	const validationSummary = useMemo(
		() => deriveMemberValidationSummary(members),
		[members]
	);

	const activeFilterCount = useMemo(
		() => Object.values(filters).filter((v) => v !== "All").length,
		[filters]
	);

	const rows = useMemo(() => {
		let list = members;

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

		return list;
	}, [filters, members]);

	if (selectedId) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<CmsEdgeMemberDetail
					id={selectedId}
					onBack={() => setSelectedId(null)}
				/>
				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{/* Header */}
			<div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
				<div className="min-w-0">
					<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						CMS EDGE · Enrollment
					</p>
					<h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
						Members
					</h2>
					<p className="mt-1 max-w-xl text-sm text-muted-foreground">
						Live enrollment roster for CMS EDGE validation. Identity, coverage,
						and readiness status from source systems.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select value={period} onValueChange={setPeriod}>
						<SelectTrigger className="h-9 w-[148px] border-border/70 bg-card">
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
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						disabled={isFetching}
						onClick={() => void refetch()}
					>
						<RefreshCw
							className={cn("mr-1.5 size-3.5", isFetching && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button
						size="sm"
						className="h-9"
						disabled={exportMembers.isPending}
						onClick={() => {
							void exportMembers
								.mutateAsync()
								.then(({ blob, filename }) => {
									downloadBlob(
										filename ?? stampFilename("cms-edge-members"),
										blob
									);
									toast.success("Member export downloaded.");
								})
								.catch(() => toast.error("Member export failed."));
						}}
					>
						<Download className="mr-1.5 size-3.5" />
						Export
					</Button>
				</div>
			</div>

			{/* KPIs */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{kpis.map((kpi) => {
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
										{isLoading ? "—" : kpi.value}
									</p>
								</div>
								<span
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-md",
										kpi.tone
									)}
								>
									<Icon className="size-4" aria-hidden />
								</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* Table workspace */}
			<section className={cn("overflow-hidden", CMS_EDGE_PANEL_CLASS)}>
				<div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
					<div className="relative min-w-[220px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search name, enrollee ID, subscriber, or plan"
							className="h-9 border-border/70 bg-background pl-8 text-xs"
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs tabular-nums text-muted-foreground">
							{isLoading
								? "Loading…"
								: `${rows.length.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`}
						</span>
						<Button
							variant={filtersOpen || activeFilterCount ? "default" : "outline"}
							size="sm"
							className="h-9"
							onClick={() => setFiltersOpen((v) => !v)}
						>
							Filters
							{activeFilterCount > 0 ? (
								<span className="ml-1.5 rounded-sm bg-background/20 px-1.5 text-[10px] font-semibold">
									{activeFilterCount}
								</span>
							) : null}
						</Button>
						{activeFilterCount > 0 ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-9 px-2 text-muted-foreground"
								onClick={() => setFilters(DEFAULT_FILTERS)}
							>
								<X className="mr-1 size-3.5" />
								Clear
							</Button>
						) : null}
					</div>
				</div>

				{filtersOpen ? (
					<div className="grid gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
						{(
							[
								["status", "Status", filterOptions.status],
								["coverageType", "Coverage", filterOptions.coverageType],
								["planId", "Plan", filterOptions.planId],
								["relationship", "Relationship", filterOptions.relationship],
								["errorType", "Error type", filterOptions.errorType],
							] as const
						).map(([key, label, options]) => (
							<label key={key} className="block space-y-1">
								<span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
									{label}
								</span>
								<Select
									value={filters[key]}
									onValueChange={(value) =>
										setFilters((prev) => ({ ...prev, [key]: value }))
									}
								>
									<SelectTrigger className="h-8 w-full border-border/70 bg-card text-xs">
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
				) : null}

				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1080px]")}
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pl-4")}>
									Member
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Relationship
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>DOB</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>Sex</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Location
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Plan
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Coverage
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Paid YTD
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									CMS Status
								</TableHead>
								<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")} />
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="px-4 py-16 text-center text-sm text-muted-foreground"
									>
										Loading members from source…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell colSpan={10} className="px-4 py-16">
										<div className="mx-auto flex max-w-md flex-col items-center text-center">
											<p className="text-sm font-semibold text-foreground">
												Unable to load members
											</p>
											<p className="mt-1 text-sm text-muted-foreground">
												{error instanceof Error
													? error.message
													: "The members API did not return data."}
											</p>
											<Button
												variant="outline"
												size="sm"
												className="mt-4 h-9"
												onClick={() => void refetch()}
											>
												<RefreshCw className="mr-1.5 size-3.5" />
												Retry
											</Button>
										</div>
									</TableCell>
								</TableRow>
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="px-4 py-16 text-center text-sm text-muted-foreground"
									>
										No members match the current search or filters.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => (
									<TableRow
										key={row.id}
										className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30"
										onClick={() => setSelectedId(row.id)}
									>
										<TableCell className="px-4 py-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-foreground">
													{row.name}
												</p>
												<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
													{row.uniqueEnrolleeId}
													{row.subscriberId !== "—" ? (
														<span className="text-muted-foreground/70">
															{" "}
															· Sub {row.subscriberId}
														</span>
													) : null}
												</p>
											</div>
										</TableCell>
										<TableCell className="px-3 py-3 text-muted-foreground">
											{row.relationship}
										</TableCell>
										<TableCell className="px-3 py-3 tabular-nums text-muted-foreground">
											{row.dateOfBirth}
										</TableCell>
										<TableCell className="px-3 py-3 text-muted-foreground">
											{row.sex}
										</TableCell>
										<TableCell className="px-3 py-3 text-muted-foreground">
											{row.location}
										</TableCell>
										<TableCell className="max-w-[180px] truncate px-3 py-3 font-medium">
											{row.planId}
										</TableCell>
										<TableCell className="px-3 py-3 tabular-nums text-muted-foreground">
											{row.coveragePeriod}
										</TableCell>
										<TableCell className="px-3 py-3 text-right tabular-nums font-medium">
											{formatCurrency(row.premium)}
										</TableCell>
										<TableCell className="px-3 py-3">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													statusTone(row.cmsStatus)
												)}
											>
												{row.cmsStatus}
											</span>
										</TableCell>
										<TableCell className="px-3 py-3 pr-4">
											<span className="inline-flex items-center text-xs font-semibold text-primary">
												Open
												<ChevronRight className="ml-0.5 size-3.5" />
											</span>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
				<CmsEdgeTablePagination
					page={page}
					pageSize={pageSize}
					total={total}
					onPageChange={setPage}
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPage(1);
					}}
				/>
			</section>

			{/* Live-derived data quality */}
			<section className="space-y-3">
				<div className="flex items-center justify-between gap-2">
					<h3 className="text-sm font-semibold text-foreground">
						Data quality (current page)
					</h3>
					<p className="text-[11px] text-muted-foreground">
						Computed from live roster — not fixture counts
					</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{validationSummary.map((item) => {
						const Icon = SUMMARY_ICONS[item.icon];
						return (
							<div
								key={item.id}
								className="rounded-lg border border-border/70 bg-card px-3.5 py-3 shadow-sm"
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
											{isLoading ? "—" : item.value}
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
