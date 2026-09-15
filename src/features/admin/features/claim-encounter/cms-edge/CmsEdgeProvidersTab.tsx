"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
	AlertCircle,
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	Download,
	FileText,
	Info,
	Link2,
	type LucideIcon,
	Search,
	ShieldCheck,
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
import { CmsEdgeProviderDetail } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeProviderDetail";
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
	useCmsEdgeProviderFacets,
	useCmsEdgeProvidersList,
	useExportEdgeProvidersCsv,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import {
	deriveProviderEdgeKpis,
	deriveProviderFilterOptions,
} from "@/features/admin/features/claim-encounter/cms-edge/live-providers";
import {
	CMS_EDGE_PROVIDER_VALIDATION_RULES,
	CMS_EDGE_REPORTING_PERIODS,
	PROVIDER_EDGE_STATUS_STYLES,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { downloadBlob, stampFilename } from "@/lib/export/csv";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	users: Users,
	check: CheckCircle2,
	alert: AlertTriangle,
	circleAlert: AlertCircle,
	file: FileText,
} satisfies Record<
	ReturnType<typeof deriveProviderEdgeKpis>[number]["icon"],
	LucideIcon
>;

const RULE_ICONS = {
	badge: ShieldCheck,
	search: Search,
	calendar: CalendarDays,
	link: Link2,
} satisfies Record<
	(typeof CMS_EDGE_PROVIDER_VALIDATION_RULES)[number]["icon"],
	LucideIcon
>;

const DEFAULT_FILTERS = {
	status: "All",
	role: "All",
	networkStatus: "All",
	idQualifier: "All",
	errors: "All",
};

export function CmsEdgeProvidersTab() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("q2-2027");
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const deferredSearch = useDeferredValue(search.trim());
	const offset = (page - 1) * pageSize;
	const { providers, kpis, total, isLoading, isError, error } =
		useCmsEdgeProvidersList({
			search: deferredSearch || undefined,
			limit: pageSize,
			offset,
		});
	const { data: facets } = useCmsEdgeProviderFacets();
	const exportProviders = useExportEdgeProvidersCsv();

	useEffect(() => {
		setPage(1);
	}, [deferredSearch, filters]);

	const filterOptions = useMemo(() => {
		const base = deriveProviderFilterOptions(providers);
		return base;
	}, [providers]);
	const specialtyHint = (facets?.specialty ?? []).slice(0, 5).join(", ");

	const activeFilterCount = useMemo(
		() => Object.values(filters).filter((v) => v !== "All").length,
		[filters]
	);

	const rows = useMemo(() => {
		let list = providers;

		if (filters.status !== "All") {
			list = list.filter((row) => row.status === filters.status);
		}
		if (filters.role !== "All") {
			list = list.filter((row) => row.role === filters.role);
		}
		if (filters.networkStatus !== "All") {
			list = list.filter((row) => row.networkStatus === filters.networkStatus);
		}
		if (filters.idQualifier !== "All") {
			list = list.filter((row) => row.idQualifier === filters.idQualifier);
		}
		if (filters.errors === "Has errors") {
			list = list.filter((row) => row.errors > 0);
		} else if (filters.errors === "No errors") {
			list = list.filter((row) => row.errors === 0);
		}

		return list;
	}, [providers, filters]);

	if (selectedId) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<CmsEdgeProviderDetail
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
						Providers
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Validate billing, rendering, and dispensing provider identifiers
						used on CMS EDGE claims.
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
						variant="outline"
						size="sm"
						className="h-9 border-border/70 bg-card shadow-sm"
						disabled={exportProviders.isPending}
						onClick={() => {
							void exportProviders
								.mutateAsync()
								.then(({ blob, filename }) => {
									downloadBlob(
										filename ?? stampFilename("cms-edge-providers"),
										blob
									);
									toast.success("Provider export downloaded.");
								})
								.catch(() => toast.error("Provider export failed."));
						}}
					>
						<Download className="mr-1.5 size-3.5" />
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
							placeholder={
								specialtyHint
									? `Search name, NPI, or specialty (e.g. ${specialtyHint})`
									: "Search name, NPI, taxonomy, or role"
							}
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
								["status", "Validation status", filterOptions.status],
								["role", "Provider role", filterOptions.role],
								["networkStatus", "Network", filterOptions.networkStatus],
								["idQualifier", "ID qualifier", filterOptions.idQualifier],
								["errors", "Errors", [...filterOptions.errors]],
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
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1100px]")}
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Provider Name
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									NPI / Identifier
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									ID Qualifier
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Provider Role
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Taxonomy
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Network Status
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Medical Claims
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Pharmacy Claims
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Validation Status
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
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={11}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										Loading providers…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell
										colSpan={11}
										className="px-3 py-8 text-center text-red-600"
									>
										Failed to load providers
										{error instanceof Error ? `: ${error.message}` : "."}
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => (
									<TableRow
										key={row.id}
										className="border-b border-border/40 hover:bg-muted/20"
									>
										<TableCell className="px-3 py-2.5 font-medium">
											{row.name}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.npi ?? "—"}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.idQualifier}
										</TableCell>
										<TableCell className="px-3 py-2.5">{row.role}</TableCell>
										<TableCell className="px-3 py-2.5 text-muted-foreground">
											{row.taxonomy}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span className="inline-flex items-center gap-1.5 text-xs">
												<span
													className={cn(
														"size-1.5 rounded-full",
														row.networkStatus === "In-Network"
															? "bg-emerald-500"
															: "bg-amber-500"
													)}
												/>
												{row.networkStatus}
											</span>
										</TableCell>
										<TableCell className="px-3 py-2.5 text-right tabular-nums">
											{row.medicalClaims.toLocaleString()}
										</TableCell>
										<TableCell className="px-3 py-2.5 text-right tabular-nums">
											{row.pharmacyClaims.toLocaleString()}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													PROVIDER_EDGE_STATUS_STYLES[row.status]
												)}
											>
												{row.status}
											</span>
										</TableCell>
										<TableCell className="px-3 py-2.5 text-right tabular-nums">
											{row.errors}
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
								))
							)}
							{!isLoading && !isError && rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={11}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										No providers match this search or filters.
									</TableCell>
								</TableRow>
							) : null}
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

			<section className={cn("overflow-hidden", CMS_EDGE_PANEL_CLASS)}>
				<div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
					<FileText className="size-4" aria-hidden />
					<h3 className="text-sm font-semibold">Provider Validation Rules</h3>
				</div>
				<ul className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-border/50">
					{CMS_EDGE_PROVIDER_VALIDATION_RULES.map((rule) => {
						const Icon = RULE_ICONS[rule.icon];
						return (
							<li key={rule.id} className="flex gap-3 px-4 py-4">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
									<Icon className="size-4" aria-hidden />
								</span>
								<div className="min-w-0">
									<p className="text-xs font-semibold text-foreground">
										{rule.title}
									</p>
									<p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
										{rule.description}
									</p>
								</div>
							</li>
						);
					})}
				</ul>
			</section>

			<div className="flex items-start gap-2 rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-xs text-sky-950">
				<Info className="mt-0.5 size-3.5 shrink-0 text-sky-700" />
				<p>
					Provider identifiers are submitted within medical and pharmacy claims;
					this is not a standalone CMS file.
				</p>
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}
