"use client";

import { Fragment, useDeferredValue, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowUpDown,
	Ban,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleDollarSign,
	FileText,
	type LucideIcon,
	MoreVertical,
	Search,
	SlidersHorizontal,
	Upload,
	User,
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
import { CmsEdgePharmacyClaimDetail } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgePharmacyClaimDetail";
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
	useCmsEdgePharmacyClaimsList,
	useSeedPharmacyClaims,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import {
	derivePharmacyClaimKpis,
	derivePharmacyFilterTabBadges,
	derivePharmacyValidationSummary,
	groupPharmacyClaimsByClaimNo,
} from "@/features/admin/features/claim-encounter/cms-edge/live-pharmacy-claims";
import {
	CMS_EDGE_PHARMACY_CLAIM_FILTER_TABS,
	CMS_EDGE_REPORTING_PERIODS,
	PHARMACY_CLAIM_CMS_STATUS_STYLES,
	PHARMACY_CLAIM_TXN_STYLES,
	PHARMACY_FILTER_BADGE_STYLES,
	type PharmacyClaimFilterTab,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	file: FileText,
	check: CheckCircle2,
	alert: AlertTriangle,
	ban: Ban,
	user: User,
} satisfies Record<"file" | "check" | "alert" | "ban" | "user", LucideIcon>;

const VALIDATION_ICONS = {
	ban: Ban,
	calendar: CalendarDays,
	user: User,
	dollar: CircleDollarSign,
} satisfies Record<"ban" | "calendar" | "user" | "dollar", LucideIcon>;

const PHARMACY_LINE_COLUMNS = [
	{ key: "claimId", label: "Claim / Line ID" },
	{ key: "ndc", label: "NDC" },
	{ key: "fillDate", label: "Fill Date" },
	{ key: "daysSupply", label: "Days", align: "right" as const },
	{ key: "planPaid", label: "Plan Paid", align: "right" as const },
	{ key: "transaction", label: "Transaction" },
	{ key: "cmsStatus", label: "CMS Status" },
];

const TABLE_COL_SPAN = 15;

function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});
}

export function CmsEdgePharmacyClaimsTab() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("q2-2027");
	const [filterTab, setFilterTab] = useState<PharmacyClaimFilterTab>("all");
	const deferredSearch = useDeferredValue(search.trim());

	const { pharmacyClaims, isLoading, isError, error, refetch } =
		useCmsEdgePharmacyClaimsList({
			search: deferredSearch || undefined,
			limit: 100,
		});
	const seedPharmacyClaims = useSeedPharmacyClaims();

	const rows = useMemo(() => {
		let list = pharmacyClaims;

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

		const q = deferredSearch.toLowerCase();
		if (q) {
			list = list.filter(
				(row) =>
					row.claimId.toLowerCase().includes(q) ||
					row.enrolleeId.toLowerCase().includes(q) ||
					row.ndc.toLowerCase().includes(q) ||
					row.rxReference.toLowerCase().includes(q) ||
					row.dispensingNpi.includes(q)
			);
		}

		return groupPharmacyClaimsByClaimNo(list);
	}, [filterTab, pharmacyClaims, deferredSearch]);

	const filterBadges = useMemo(
		() => derivePharmacyFilterTabBadges(pharmacyClaims),
		[pharmacyClaims]
	);

	const validationSummary = useMemo(
		() => derivePharmacyValidationSummary(pharmacyClaims),
		[pharmacyClaims]
	);

	const kpis = useMemo(
		() => derivePharmacyClaimKpis(rows.flatMap((g) => g.lines)),
		[rows]
	);

	function toggleExpand(groupKey: string) {
		setExpandedId((prev) => (prev === groupKey ? null : groupKey));
	}

	if (selectedId) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<CmsEdgePharmacyClaimDetail
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
						Pharmacy Claims
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Review prescription claims, dispensing providers, financial values,
						and CMS EDGE validation.
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
					<div className="relative w-[240px]">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search Claim / Member / NDC"
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
						onClick={() => toast.success("Pharmacy claims export started.")}
					>
						<Upload className="mr-1.5 size-3.5" />
						Export
						<ChevronDown className="ml-1 size-3.5" />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-border/70 bg-card shadow-sm"
								disabled={seedPharmacyClaims.isPending}
							>
								More
								<ChevronDown className="ml-1 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								disabled={seedPharmacyClaims.isPending}
								onClick={async () => {
									try {
										const result = await seedPharmacyClaims.mutateAsync({
											force: true,
											count: 8,
										});
										if (result.skipped) {
											toast.message(
												`Seed skipped — ${result.existing_rows ?? 0} demo rows already exist.`
											);
										} else {
											toast.success(
												`Seeded ${result.created} pharmacy claim rows.`
											);
										}
										await refetch();
									} catch (err) {
										toast.error(
											err instanceof Error ? err.message : "Seed failed."
										);
									}
								}}
							>
								Seed pharmacy claims
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
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
				<div className="flex flex-wrap items-center gap-1 border-b border-border/50 px-3">
					{CMS_EDGE_PHARMACY_CLAIM_FILTER_TABS.map((tab) => {
						const active = filterTab === tab.id;
						const badge =
							tab.id === "errors"
								? filterBadges.errors
								: tab.id === "warnings"
									? filterBadges.warnings
									: tab.id === "voids"
										? filterBadges.voids
										: null;
						const badgeTone =
							tab.id === "errors"
								? "error"
								: tab.id === "warnings"
									? "warning"
									: tab.id === "voids"
										? "void"
										: null;
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
								{badge != null && badgeTone && badge > 0 ? (
									<span
										className={cn(
											"inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
											PHARMACY_FILTER_BADGE_STYLES[badgeTone]
										)}
									>
										{badge}
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
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1280px]")}
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
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>NDC</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									<span className="inline-flex items-center gap-1">
										Fill Date
										<ArrowUpDown className="size-3 text-muted-foreground" />
									</span>
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Rx Reference Number
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Fill No.
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Days Supply
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Dispensing Provider NPI
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Network
								</TableHead>
								<TableHead
									className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
								>
									Allowed Cost
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
										Loading pharmacy claims…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell
										colSpan={TABLE_COL_SPAN}
										className="px-3 py-8 text-center text-red-600"
									>
										Failed to load pharmacy claims
										{error instanceof Error ? `: ${error.message}` : "."}
									</TableCell>
								</TableRow>
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={TABLE_COL_SPAN}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										{pharmacyClaims.length === 0
											? "No pharmacy claims yet. Use More → Seed pharmacy claims after the core seed API is deployed."
											: "No pharmacy claims match this filter."}
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
												<TableCell className="px-3 py-2.5 font-mono text-[11px]">
													{row.ndc}
												</TableCell>
												<TableCell className="px-3 py-2.5 tabular-nums">
													{row.fillDate}
												</TableCell>
												<TableCell className="px-3 py-2.5 font-mono text-[11px]">
													{row.rxReference}
												</TableCell>
												<TableCell className="px-3 py-2.5 text-right tabular-nums">
													{row.fillNo}
												</TableCell>
												<TableCell className="px-3 py-2.5 text-right tabular-nums">
													{row.daysSupply || "—"}
												</TableCell>
												<TableCell className="px-3 py-2.5 font-mono text-[11px]">
													{row.dispensingNpi}
												</TableCell>
												<TableCell className="px-3 py-2.5">
													{row.network}
												</TableCell>
												<TableCell className="px-3 py-2.5 text-right tabular-nums">
													{formatCurrency(row.allowedCost)}
												</TableCell>
												<TableCell className="px-3 py-2.5 text-right tabular-nums">
													{formatCurrency(row.planPaid)}
												</TableCell>
												<TableCell className="px-3 py-2.5">
													<span
														className={cn(
															CMS_EDGE_STATUS_PILL_CLASS,
															PHARMACY_CLAIM_TXN_STYLES[row.transaction]
														)}
													>
														{row.transaction}
													</span>
												</TableCell>
												<TableCell className="px-3 py-2.5">
													<span
														className={cn(
															CMS_EDGE_STATUS_PILL_CLASS,
															PHARMACY_CLAIM_CMS_STATUS_STYLES[row.cmsStatus]
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
																onClick={() => setSelectedId(row.id)}
															>
																View claim line detail
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	toast.message(`Revalidating ${row.claimId}`)
																}
															>
																Revalidate
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
											{expanded ? (
												<CmsEdgeClaimLinesExpandPanel
													colSpan={TABLE_COL_SPAN}
													title="Claim Lines"
													columns={PHARMACY_LINE_COLUMNS}
													lines={row.lines.map((line) => ({
														id: line.id,
														cells: {
															claimId: (
																<span className="font-mono font-medium text-primary">
																	{line.claimId}
																</span>
															),
															ndc: (
																<span className="font-mono">{line.ndc}</span>
															),
															fillDate: line.fillDate,
															daysSupply: line.daysSupply || "—",
															planPaid: formatCurrency(line.planPaid),
															transaction: (
																<span
																	className={cn(
																		CMS_EDGE_STATUS_PILL_CLASS,
																		PHARMACY_CLAIM_TXN_STYLES[line.transaction]
																	)}
																>
																	{line.transaction}
																</span>
															),
															cmsStatus: (
																<span
																	className={cn(
																		CMS_EDGE_STATUS_PILL_CLASS,
																		PHARMACY_CLAIM_CMS_STATUS_STYLES[
																			line.cmsStatus
																		]
																	)}
																>
																	{line.cmsStatus}
																</span>
															),
														},
													}))}
													onViewLineDetail={(lineId) => setSelectedId(lineId)}
													viewAllHrefLabel="Open claim line detail"
													onViewAllDetail={() => setSelectedId(row.id)}
												/>
											) : null}
										</Fragment>
									);
								})
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</section>

			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-foreground">
					Pharmacy Validation Summary
				</h3>
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
										<p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
											{item.count.toLocaleString("en-US")}
										</p>
										<p className="mt-0.5 text-[11px] text-muted-foreground">
											From current results
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
