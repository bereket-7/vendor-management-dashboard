"use client";

import { useDeferredValue, useMemo, useState } from "react";

import {
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	Code2,
	Database,
	Download,
	FileText,
	Link2,
	type LucideIcon,
	MoreVertical,
	Search,
	SlidersHorizontal,
	Unlink,
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
import { CmsEdgeSupplementalDiagnosisDetail } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeSupplementalDiagnosisDetail";
import {
	useCmsEdgeSupplementalDiagnosesList,
	useSeedCmsEdgeDemo,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import {
	deriveSupplementalDxKpis,
	deriveSupplementalDxValidationSummary,
} from "@/features/admin/features/claim-encounter/cms-edge/live-supplemental-diagnoses";
import {
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_SUPPLEMENTAL_DX_FILTER_TABS,
	SUPPLEMENTAL_DX_CLAIM_LINK_STYLES,
	SUPPLEMENTAL_DX_CMS_STATUS_STYLES,
	SUPPLEMENTAL_DX_TXN_STYLES,
	type SupplementalDxFilterTab,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
	file: FileText,
	check: CheckCircle2,
	alert: AlertTriangle,
	unlink: Unlink,
	link: Link2,
} satisfies Record<
	ReturnType<typeof deriveSupplementalDxKpis>[number]["icon"],
	LucideIcon
>;

const SUMMARY_ICONS = {
	unlink: Unlink,
	code: Code2,
	calendar: CalendarDays,
	user: User,
	link: Link2,
} satisfies Record<
	ReturnType<typeof deriveSupplementalDxValidationSummary>[number]["icon"],
	LucideIcon
>;

export function CmsEdgeSupplementalDiagnosesTab() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("q2-2027");
	const [filterTab, setFilterTab] = useState<SupplementalDxFilterTab>("all");

	const deferredSearch = useDeferredValue(search.trim());
	const { diagnoses, kpis, isLoading, isError, error, refetch } =
		useCmsEdgeSupplementalDiagnosesList();
	const seedDemo = useSeedCmsEdgeDemo();

	const validationSummary = useMemo(
		() => deriveSupplementalDxValidationSummary(diagnoses),
		[diagnoses]
	);

	const rows = useMemo(() => {
		let list = diagnoses;

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
		if (!q) return list;
		return list.filter(
			(row) =>
				row.recordId.toLowerCase().includes(q) ||
				row.enrolleeId.toLowerCase().includes(q) ||
				(row.originalClaimId ?? "").toLowerCase().includes(q) ||
				row.diagnosisCode.toLowerCase().includes(q) ||
				row.detailRecordId.toLowerCase().includes(q)
		);
	}, [filterTab, diagnoses, deferredSearch]);

	if (selectedId) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<CmsEdgeSupplementalDiagnosisDetail
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
						Supplemental Diagnoses
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Review diagnosis records submitted separately from medical claims
						and validate linkage to original claims.
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
							placeholder="Search Member / Claim / Diagnosis"
							className="h-9 pl-8 text-xs"
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-border/70 bg-card shadow-sm"
						disabled={seedDemo.isPending}
						onClick={() => {
							seedDemo.mutate(
								{ force: true },
								{
									onSuccess: (result) => {
										const dx = result.created?.supplemental_diagnoses ?? 0;
										toast.success(
											`Demo EDGE data seeded${dx ? ` (${dx} supplemental DX)` : ""}.`
										);
										void refetch();
									},
									onError: (err) =>
										toast.error(
											err instanceof Error
												? err.message
												: "Seed failed. Deploy POST /cms-edge/settings/seed/ then retry."
										),
								}
							);
						}}
					>
						<Database className="mr-1.5 size-3.5" />
						{seedDemo.isPending ? "Seeding…" : "Seed demo data"}
					</Button>
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
						onClick={() =>
							toast.success("Supplemental diagnoses export started.")
						}
					>
						<Download className="mr-1.5 size-3.5" />
						Export
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
				<div className="flex flex-wrap items-center gap-1 border-b border-border/50 px-3">
					{CMS_EDGE_SUPPLEMENTAL_DX_FILTER_TABS.map((tab) => {
						const active = filterTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setFilterTab(tab.id)}
								className={cn(
									"relative inline-flex h-10 items-center px-3 text-xs font-semibold transition-colors",
									active
										? "text-primary"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{tab.label}
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
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Record ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Unique Enrollee ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Original Medical Claim ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Detail Record ID
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Diagnosis Type
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Diagnosis Code
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Service From
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Service To
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Transaction
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Claim Link
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
										colSpan={12}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										Loading supplemental diagnoses…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell
										colSpan={12}
										className="px-3 py-8 text-center text-red-600"
									>
										Failed to load supplemental diagnoses
										{error instanceof Error ? `: ${error.message}` : "."}
									</TableCell>
								</TableRow>
							) : (
								rows.map((row, index) => (
									<TableRow
										key={row.id}
										className={cn(
											"border-b border-border/40 hover:bg-muted/20",
											index % 2 === 1 && "bg-muted/10"
										)}
									>
										<TableCell className="px-3 py-2.5 font-mono text-[11px] font-medium text-primary">
											{row.recordId}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.enrolleeId}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.originalClaimId ?? "—"}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px]">
											{row.detailRecordId}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.diagnosisType}
										</TableCell>
										<TableCell className="px-3 py-2.5 font-mono text-[11px] font-semibold">
											{row.diagnosisCode}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.serviceFrom}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.serviceTo}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													SUPPLEMENTAL_DX_TXN_STYLES[row.transaction]
												)}
											>
												{row.transaction}
											</span>
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													SUPPLEMENTAL_DX_CLAIM_LINK_STYLES[row.claimLink]
												)}
											>
												{row.claimLink}
											</span>
										</TableCell>
										<TableCell className="px-3 py-2.5">
											<span
												className={cn(
													CMS_EDGE_STATUS_PILL_CLASS,
													SUPPLEMENTAL_DX_CMS_STATUS_STYLES[row.cmsStatus]
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
														<span className="sr-only">Open record actions</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => setSelectedId(row.id)}
													>
														View details
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															toast.message(`Revalidating ${row.recordId}`)
														}
													>
														Revalidate
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
							{!isLoading && !isError && rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={12}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										No supplemental diagnoses match this filter.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</section>

			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-foreground">
					Supplemental Diagnosis Validation Summary
				</h3>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{validationSummary.map((item) => {
						const Icon = SUMMARY_ICONS[item.icon];
						return (
							<div
								key={item.id}
								className="rounded-lg border border-border/70 bg-card p-3 shadow-sm"
							>
								<div className="flex items-start gap-2.5">
									<div
										className={cn(
											"flex size-8 shrink-0 items-center justify-center rounded-full",
											item.tone
										)}
									>
										<Icon className="size-4" aria-hidden />
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
