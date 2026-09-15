"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	Ban,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleDollarSign,
	FileText,
	Link2,
	type LucideIcon,
	MoreVertical,
	Search,
	Upload,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CmsEdgeClaimLinesExpandPanel } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeClaimLinesExpandPanel";
import { CmsEdgeMedicalClaimDetail } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeMedicalClaimDetail";
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
import { useCmsEdgeMedicalClaimsList } from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import {
	deriveMedicalClaimFilterOptions,
	deriveMedicalClaimKpis,
	deriveMedicalValidationSummary,
} from "@/features/admin/features/claim-encounter/cms-edge/live-medical-claims";
import {
	CMS_EDGE_MEDICAL_CLAIM_FILTER_TABS,
	CMS_EDGE_REPORTING_PERIODS,
	MEDICAL_CLAIM_CMS_STATUS_STYLES,
	MEDICAL_CLAIM_TXN_STYLES,
	MEDICAL_FILTER_BADGE_STYLES,
	type MedicalClaimFilterTab,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	file: FileText,
	check: CheckCircle2,
	alert: AlertTriangle,
	ban: Ban,
	user: User,
} satisfies Record<"file" | "check" | "alert" | "ban" | "user", LucideIcon>;

const VALIDATION_ICONS = {
	alert: AlertTriangle,
	ban: Ban,
	user: User,
	dollar: CircleDollarSign,
	link: Link2,
} satisfies Record<
	ReturnType<typeof deriveMedicalValidationSummary>[number]["icon"],
	LucideIcon
>;

const DEFAULT_FILTERS = {
	cmsStatus: "All",
	transaction: "All",
	formType: "All",
	enrolleeId: "All",
	billingNpi: "All",
};

const MEDICAL_LINE_COLUMNS = [
	{ key: "line", label: "Line" },
	{ key: "serviceDate", label: "Service Date" },
	{ key: "procedure", label: "Procedure" },
	{ key: "revenue", label: "Revenue" },
	{ key: "allowed", label: "Allowed", align: "right" as const },
	{ key: "planPaid", label: "Plan Paid", align: "right" as const },
	{ key: "status", label: "Status" },
];

const TABLE_COL_SPAN = 13;

function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});
}

export function CmsEdgeClaimsTab() {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("q2-2027");
	const [filterTab, setFilterTab] = useState<MedicalClaimFilterTab>("all");
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const offset = (page - 1) * pageSize;
	const { medicalClaims, total, isLoading, isError, error } =
		useCmsEdgeMedicalClaimsList({ limit: pageSize, offset });

	useEffect(() => {
		setPage(1);
	}, [search, filterTab, filters]);

	const filterOptions = useMemo(
		() => deriveMedicalClaimFilterOptions(medicalClaims),
		[medicalClaims]
	);

	const activeFilterCount = useMemo(
		() => Object.values(filters).filter((v) => v !== "All").length,
		[filters]
	);

	const rows = useMemo(() => {
		let list = medicalClaims;

		if (filterTab === "ready") {
			list = list.filter((row) => row.cmsStatus === "Ready");
		} else if (filterTab === "errors") {
			list = list.filter((row) => row.cmsStatus === "Error");
		} else if (filterTab === "warnings") {
			list = list.filter((row) => row.cmsStatus === "Warning");
		} else if (filterTab === "voids") {
			list = list.filter(
				(row) => row.transaction === "Void" || row.transaction === "Replacement"
			);
		}

		if (filters.cmsStatus !== "All") {
			list = list.filter((row) => row.cmsStatus === filters.cmsStatus);
		}
		if (filters.transaction !== "All") {
			list = list.filter((row) => row.transaction === filters.transaction);
		}
		if (filters.formType !== "All") {
			list = list.filter((row) => row.formType === filters.formType);
		}
		if (filters.enrolleeId !== "All") {
			list = list.filter((row) => row.enrolleeId === filters.enrolleeId);
		}
		if (filters.billingNpi !== "All") {
			list = list.filter((row) => row.billingNpi === filters.billingNpi);
		}

		const q = search.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(row) =>
				row.claimId.toLowerCase().includes(q) ||
				row.enrolleeId.toLowerCase().includes(q) ||
				row.primaryDiagnosis.toLowerCase().includes(q) ||
				row.billingNpi.includes(q) ||
				row.formType.toLowerCase().includes(q)
		);
	}, [filterTab, filters, medicalClaims, search]);

	const validationSummary = useMemo(
		() => deriveMedicalValidationSummary(rows),
		[rows]
	);

	const kpis = useMemo(() => deriveMedicalClaimKpis(rows), [rows]);

	function openClaimLineDetail(claimReferenceId: string) {
		router.push(
			`/admin/claim-encounter/claims/${encodeURIComponent(claimReferenceId)}`
		);
	}

	function toggleExpand(groupKey: string) {
		setExpandedId((prev) => (prev === groupKey ? null : groupKey));
	}

	if (selectedId) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<CmsEdgeMedicalClaimDetail
					id={selectedId}
					onBack={() => setSelectedId(null)}
				/>
				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h2 className="text-xl font-semibold tracking-tight text-foreground">
						Medical Claims
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Review medical claims, claim lines, providers, financial values, and
						CMS EDGE validation.
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
					<Button
						size="sm"
						className="h-9 shadow-sm"
						onClick={() => toast.success("Medical claims export started.")}
					>
						<Upload className="mr-1.5 size-3.5" />
						Export
						<ChevronDown className="ml-1 size-3.5" />
					</Button>
				</div>
			</div>

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
										{kpi.value}
									</p>
									{kpi.hint ? (
										<p
											className={cn(
												"mt-1.5 text-xs font-medium",
												kpi.hintClassName
											)}
										>
											{kpi.hint}
										</p>
									) : null}
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

			<section className={cn("overflow-hidden", CMS_EDGE_PANEL_CLASS)}>
				<div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
					<div className="relative min-w-[220px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search claim, enrollee, diagnosis, or NPI"
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
					<div className="grid gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
						{(
							[
								["cmsStatus", "CMS status", filterOptions.cmsStatus],
								["transaction", "Transaction", filterOptions.transaction],
								["formType", "Form type", filterOptions.formType],
								["enrolleeId", "Enrollee ID", filterOptions.enrolleeId],
								["billingNpi", "Billing NPI", filterOptions.billingNpi],
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
				<div className="flex flex-wrap items-center gap-1 border-b border-border/50 px-3">
					{CMS_EDGE_MEDICAL_CLAIM_FILTER_TABS.map((tab) => {
						const active = filterTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setFilterTab(tab.id)}
								className={cn(
									"relative inline-flex h-10 items-center gap-1.5 px-3 text-xs font-semibold transition-colors",
									active
										? "text-primary"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{tab.label}
								{tab.badge != null && tab.badgeTone ? (
									<span
										className={cn(
											"inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
											MEDICAL_FILTER_BADGE_STYLES[tab.badgeTone]
										)}
									>
										{tab.badge}
									</span>
								) : null}
								{active ? (
									<span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
								) : null}
							</button>
						);
					})}
				</div>

				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1200px]")}
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "w-8")} />
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Claim ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Unique Enrollee ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Form Type
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Statement From
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Statement Through
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Billing Provider NPI
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Primary Diagnosis
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
									Transaction
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
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={TABLE_COL_SPAN}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										Loading medical claims…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell
										colSpan={TABLE_COL_SPAN}
										className="px-3 py-8 text-center text-red-600"
									>
										Failed to load medical claims
										{error instanceof Error ? `: ${error.message}` : "."}
									</TableCell>
								</TableRow>
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={TABLE_COL_SPAN}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										No medical claims match this filter.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row, index) => {
									const expanded = expandedId === row.groupKey;
									return (
										<Fragment key={row.groupKey}>
											<TableRow
												className={cn(
													"border-b border-border/40 hover:bg-muted/20",
													index % 2 === 1 && "bg-muted/10",
													expanded && "bg-sky-50/70 dark:bg-sky-950/20"
												)}
											>
												<TableCell className="px-2 py-2.5">
													<button
														type="button"
														aria-expanded={expanded}
														aria-label={
															expanded
																? "Collapse claim lines"
																: "Expand claim lines"
														}
														className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
														onClick={() => toggleExpand(row.groupKey)}
													>
														<ChevronRight
															className={cn(
																"size-3.5 transition-transform",
																expanded && "rotate-90"
															)}
														/>
													</button>
												</TableCell>
												<TableCell className="px-3 py-2.5 font-mono text-[11px] font-medium text-primary">
													<button
														type="button"
														className="hover:underline"
														onClick={() => toggleExpand(row.groupKey)}
													>
														{row.claimId}
													</button>
													<span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">
														({row.lines.length})
													</span>
												</TableCell>
												<TableCell className="px-3 py-2.5 font-mono text-[11px]">
													{row.enrolleeId}
												</TableCell>
												<TableCell className="px-3 py-2.5">
													{row.formType}
												</TableCell>
												<TableCell className="px-3 py-2.5 tabular-nums">
													{row.statementFrom}
												</TableCell>
												<TableCell className="px-3 py-2.5 tabular-nums">
													{row.statementThrough}
												</TableCell>
												<TableCell className="px-3 py-2.5 font-mono text-[11px]">
													{row.billingNpi}
												</TableCell>
												<TableCell className="px-3 py-2.5 font-mono text-[11px]">
													{row.primaryDiagnosis}
												</TableCell>
												<TableCell className="px-3 py-2.5 text-right tabular-nums">
													{formatCurrency(row.allowedAmount)}
												</TableCell>
												<TableCell className="px-3 py-2.5 text-right tabular-nums">
													{formatCurrency(row.planPaid)}
												</TableCell>
												<TableCell className="px-3 py-2.5">
													<span
														className={cn(
															CMS_EDGE_STATUS_PILL_CLASS,
															MEDICAL_CLAIM_TXN_STYLES[row.transaction]
														)}
													>
														{row.transaction}
													</span>
												</TableCell>
												<TableCell className="px-3 py-2.5">
													<span
														className={cn(
															CMS_EDGE_STATUS_PILL_CLASS,
															MEDICAL_CLAIM_CMS_STATUS_STYLES[row.cmsStatus]
														)}
													>
														{row.cmsStatus}
													</span>
												</TableCell>
												<TableCell className="px-3 py-2.5 pr-4">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="size-7 text-muted-foreground"
															>
																<MoreVertical className="size-4" />
																<span className="sr-only">
																	Open claim actions
																</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => toggleExpand(row.groupKey)}
															>
																{expanded
																	? "Hide claim lines"
																	: "Show claim lines"}
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => openClaimLineDetail(row.claimId)}
															>
																Open claim line detail
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => setSelectedId(row.id)}
															>
																CMS EDGE claim view
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
											{expanded ? (
												<CmsEdgeClaimLinesExpandPanel
													colSpan={TABLE_COL_SPAN}
													title="Claim Lines"
													columns={MEDICAL_LINE_COLUMNS}
													lines={row.lines.map((line) => ({
														id: line.id,
														cells: {
															line: line.lineNumber,
															serviceDate: line.serviceDate,
															procedure: (
																<span className="font-mono">
																	{line.procedureCode}
																</span>
															),
															revenue: (
																<span className="font-mono">
																	{line.revenueCode}
																</span>
															),
															allowed: formatCurrency(line.allowed),
															planPaid: formatCurrency(line.planPaid),
															status: line.status,
														},
													}))}
													onViewLineDetail={() =>
														openClaimLineDetail(row.claimId)
													}
													viewAllHrefLabel="Open claim detail page"
													onViewAllDetail={() =>
														openClaimLineDetail(row.claimId)
													}
												/>
											) : null}
										</Fragment>
									);
								})
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

			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-foreground">
					Medical Validation Summary
				</h3>
				<p className="text-[11px] text-muted-foreground">
					Computed from current page — not fixture counts
				</p>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{validationSummary.map((item) => {
						const Icon = VALIDATION_ICONS[item.icon];
						return (
							<div key={item.id} className={cn(CMS_EDGE_KPI_CARD_CLASS, "p-3")}>
								<div className="flex items-start gap-2.5 pl-1.5">
									<div
										className={cn(
											"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
											item.tone
										)}
									>
										<Icon className="size-[18px]" aria-hidden />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] font-medium leading-snug text-muted-foreground">
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
										<p className="mt-0.5 text-[11px] text-muted-foreground">
											{item.hint}
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
