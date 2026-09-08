"use client";

import { useMemo, useState } from "react";

import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	CheckCircle2,
	Eye,
	FileText,
	LayoutGrid,
	List,
	MoreHorizontal,
	Search,
	TrendingDown,
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
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEASURE_LIBRARY_FILTERS,
	MEASURE_LIBRARY_ROWS,
	type MeasureListItem,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL = CMS_EDGE_PANEL_CLASS;
const QP_BASE = "/admin/claim-encounter/regulatory/quality-performance";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const compactFieldClass = cn(
	"h-8 rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

/** Primary light → dark for chart / meter fills */
const PRIMARY_CHART_SCALE = [
	"color-mix(in oklch, var(--primary) 40%, white)",
	"color-mix(in oklch, var(--primary) 60%, white)",
	"color-mix(in oklch, var(--primary) 82%, white)",
	"var(--primary)",
] as const;

function rateBarColor(rate: number) {
	if (rate >= 80) return PRIMARY_CHART_SCALE[3];
	if (rate >= 70) return PRIMARY_CHART_SCALE[2];
	if (rate >= 60) return "#f59e0b";
	return "#dc2626";
}

function StatusPill({ status }: { status: MeasureListItem["status"] }) {
	const styles =
		status === "Active"
			? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
			: "border-border bg-muted text-muted-foreground";
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, styles)}>{status}</span>
	);
}

function TrendBadge({ value }: { value: number }) {
	if (value === 0) {
		return (
			<span className="text-[11px] text-muted-foreground">Flat vs MY 2024</span>
		);
	}
	const up = value > 0;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
				up
					? "text-emerald-700 dark:text-emerald-300"
					: "text-red-600 dark:text-red-400"
			)}
		>
			{up ? (
				<ArrowUpRight className="size-3" />
			) : (
				<ArrowDownRight className="size-3" />
			)}
			{up ? "+" : "−"}
			{Math.abs(value).toFixed(1)}% vs MY 2024
		</span>
	);
}

export function MeasureLibraryPage() {
	const [search, setSearch] = useState("");
	const [year, setYear] = useState(
		MEASURE_LIBRARY_FILTERS.measurementYears[0]!
	);
	const [plan, setPlan] = useState("All Plans");
	const [lob, setLob] = useState("All");
	const [measureSet, setMeasureSet] = useState("HEDIS");
	const [statusFilter, setStatusFilter] = useState("All");
	const [domain, setDomain] = useState("All");
	const [view, setView] = useState<"cards" | "list">("cards");

	const domains = useMemo(() => {
		const set = new Set(MEASURE_LIBRARY_ROWS.map((r) => r.domain));
		return ["All", ...Array.from(set).sort()];
	}, []);

	const filteredRows = useMemo(() => {
		const q = search.trim().toLowerCase();
		return MEASURE_LIBRARY_ROWS.filter((row) => {
			if (measureSet !== "All" && row.measureSet !== measureSet) return false;
			if (statusFilter !== "All" && row.status !== statusFilter) return false;
			if (domain !== "All" && row.domain !== domain) return false;
			if (!q) return true;
			return (
				row.id.toLowerCase().includes(q) || row.name.toLowerCase().includes(q)
			);
		});
	}, [search, measureSet, statusFilter, domain]);

	const stats = useMemo(() => {
		const active = filteredRows.filter((r) => r.status === "Active").length;
		const avg =
			filteredRows.length === 0
				? 0
				: filteredRows.reduce((s, r) => s + r.complianceRate, 0) /
					filteredRows.length;
		const declining = filteredRows.filter((r) => r.vsPriorYear < 0);
		return {
			total: filteredRows.length,
			active,
			avg: Math.round(avg * 10) / 10,
			declining,
		};
	}, [filteredRows]);

	const hasFilters =
		Boolean(search.trim()) ||
		measureSet !== "HEDIS" ||
		statusFilter !== "All" ||
		plan !== "All Plans" ||
		lob !== "All" ||
		domain !== "All";

	function clearFilters() {
		setSearch("");
		setMeasureSet("HEDIS");
		setStatusFilter("All");
		setPlan("All Plans");
		setLob("All");
		setDomain("All");
		setYear(MEASURE_LIBRARY_FILTERS.measurementYears[0]!);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{/* Catalog header — search first */}
			<div className="space-y-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Measure Library
						</h1>
						<p className="text-sm text-muted-foreground">
							Browse specs · pick a measure · jump to performance
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							className={cn(
								toolbarBtn,
								"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
							)}
							asChild
						>
							<Link href={`${QP_BASE}/overview`}>Overview</Link>
						</Button>
						<Button size="sm" className={toolbarBtn} asChild>
							<Link href={`${QP_BASE}/measure-comparison`}>
								Compare
								<ArrowRight className="size-3.5" />
							</Link>
						</Button>
					</div>
				</div>

				<div className={cn(PANEL, "p-3 sm:p-4")}>
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Find by measure ID or name…"
							className="h-11 rounded-sm border-border/70 bg-background pl-10 text-sm shadow-none"
						/>
						{search ? (
							<button
								type="button"
								aria-label="Clear search"
								className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-muted"
								onClick={() => setSearch("")}
							>
								<X className="size-4" />
							</button>
						) : null}
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-2">
						{domains.map((d) => (
							<button
								key={d}
								type="button"
								onClick={() => setDomain(d)}
								className={cn(
									"rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
									domain === d
										? "border-primary bg-primary/10 text-primary"
										: "border-border/70 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
								)}
							>
								{d === "All" ? "All domains" : d}
							</button>
						))}
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
						<Select value={year} onValueChange={setYear}>
							<SelectTrigger className={cn(compactFieldClass, "w-40")}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MEASURE_LIBRARY_FILTERS.measurementYears.map((y) => (
									<SelectItem key={y} value={y}>
										{y.split("(")[0]?.trim()}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={measureSet} onValueChange={setMeasureSet}>
							<SelectTrigger className={cn(compactFieldClass, "w-28")}>
								<SelectValue placeholder="Set" />
							</SelectTrigger>
							<SelectContent>
								{MEASURE_LIBRARY_FILTERS.measureSets.map((set) => (
									<SelectItem key={set} value={set}>
										{set}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className={cn(compactFieldClass, "w-28")}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								{MEASURE_LIBRARY_FILTERS.measureStatuses.map((status) => (
									<SelectItem key={status} value={status}>
										{status}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={plan} onValueChange={setPlan}>
							<SelectTrigger className={cn(compactFieldClass, "w-36")}>
								<SelectValue placeholder="Plan" />
							</SelectTrigger>
							<SelectContent>
								{MEASURE_LIBRARY_FILTERS.plans.map((p) => (
									<SelectItem key={p} value={p}>
										{p}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={lob} onValueChange={setLob}>
							<SelectTrigger className={cn(compactFieldClass, "w-28")}>
								<SelectValue placeholder="LOB" />
							</SelectTrigger>
							<SelectContent>
								{MEASURE_LIBRARY_FILTERS.linesOfBusiness.map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{hasFilters ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2 text-xs text-muted-foreground"
								onClick={clearFilters}
							>
								Clear
							</Button>
						) : null}

						<div className="ml-auto flex items-center gap-3">
							<p className="hidden text-[11px] text-muted-foreground sm:block">
								<span className="font-semibold tabular-nums text-foreground">
									{stats.total}
								</span>{" "}
								· avg{" "}
								<span className="font-semibold tabular-nums text-foreground">
									{stats.avg.toFixed(1)}%
								</span>
								{stats.declining.length > 0 ? (
									<>
										{" · "}
										<span className="font-medium text-amber-700 dark:text-amber-300">
											{stats.declining.length} declining
										</span>
									</>
								) : null}
							</p>
							<div className="flex rounded-sm border border-border/70 p-0.5">
								<button
									type="button"
									aria-label="Card view"
									onClick={() => setView("cards")}
									className={cn(
										"rounded-sm p-1.5 transition-colors",
										view === "cards"
											? "bg-muted text-foreground"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									<LayoutGrid className="size-3.5" />
								</button>
								<button
									type="button"
									aria-label="List view"
									onClick={() => setView("list")}
									className={cn(
										"rounded-sm p-1.5 transition-colors",
										view === "list"
											? "bg-muted text-foreground"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									<List className="size-3.5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Inline declining callout — slim, not a section clone */}
			{stats.declining.length > 0 ? (
				<div className="flex flex-wrap items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-800 dark:bg-amber-950/40">
					<TrendingDown className="size-3.5 shrink-0 text-amber-700 dark:text-amber-300" />
					<span className="font-medium text-amber-950 dark:text-amber-100">
						{stats.declining.length} measure
						{stats.declining.length === 1 ? "" : "s"} down vs MY 2024
					</span>
					<span className="text-amber-800 dark:text-amber-200">
						{stats.declining
							.slice(0, 4)
							.map((r) => r.id)
							.join(" · ")}
						{stats.declining.length > 4
							? ` +${stats.declining.length - 4}`
							: ""}
					</span>
				</div>
			) : null}

			{filteredRows.length === 0 ? (
				<div
					className={cn(
						PANEL,
						"flex flex-col items-center justify-center gap-2 px-4 py-20 text-center"
					)}
				>
					<FileText className="size-5 text-muted-foreground" />
					<p className="text-sm font-medium text-foreground">
						No measures match
					</p>
					<p className="text-xs text-muted-foreground">
						Widen filters or clear search.
					</p>
				</div>
			) : view === "cards" ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{filteredRows.map((row) => (
						<article
							key={row.id}
							className={cn(
								PANEL,
								"group flex flex-col overflow-hidden transition-shadow hover:shadow-[0_1px_3px_rgba(15,23,42,0.1),0_8px_20px_rgba(15,23,42,0.06)]"
							)}
						>
							<div className="flex items-start justify-between gap-2 border-b border-border/40 px-4 py-3">
								<div className="min-w-0">
									<Link
										href={`${QP_BASE}/measure-library/${row.id}`}
										className="font-mono text-sm font-bold text-primary group-hover:underline"
									>
										{row.id}
									</Link>
									<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
										{row.name}
									</p>
								</div>
								<StatusPill status={row.status} />
							</div>
							<div className="flex flex-1 flex-col gap-3 px-4 py-3">
								<div className="flex items-end justify-between gap-2">
									<div>
										<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
											Compliance
										</p>
										<p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
											{row.complianceRate.toFixed(1)}
											<span className="text-sm text-muted-foreground">%</span>
										</p>
									</div>
									<TrendBadge value={row.vsPriorYear} />
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-primary/15">
									<div
										className="h-full rounded-full"
										style={{
											width: `${Math.min(row.complianceRate, 100)}%`,
											backgroundColor: rateBarColor(row.complianceRate),
										}}
									/>
								</div>
								<div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
									<span>{row.domain}</span>
									<span aria-hidden>·</span>
									<span>{row.eligiblePopulation}</span>
									<span aria-hidden>·</span>
									<span>{row.lastCalculated}</span>
								</div>
							</div>
							<div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
								<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
									{row.measureSet}
								</span>
								<div className="flex items-center gap-0.5">
									<Button
										variant="ghost"
										size="icon"
										className="size-7"
										asChild
									>
										<Link
											href={`${QP_BASE}/measure-library/${row.id}`}
											aria-label={`View ${row.id}`}
										>
											<Eye className="size-3.5" />
										</Link>
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-7">
												<MoreHorizontal className="size-3.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem asChild>
												<Link href={`${QP_BASE}/measure-library/${row.id}`}>
													Open measure
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													toast.message("Spec download", {
														description: row.id,
													})
												}
											>
												Download specs
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</article>
					))}
				</div>
			) : (
				<section className={cn(PANEL, "overflow-hidden")}>
					<ul className="divide-y divide-border/40">
						{filteredRows.map((row) => (
							<li key={row.id}>
								<Link
									href={`${QP_BASE}/measure-library/${row.id}`}
									className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4"
								>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-mono text-sm font-bold text-primary">
												{row.id}
											</span>
											<StatusPill status={row.status} />
										</div>
										<p className="mt-0.5 truncate text-xs text-muted-foreground">
											{row.name} · {row.domain}
										</p>
									</div>
									<div className="flex w-full items-center gap-3 sm:w-56">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
											<div
												className="h-full rounded-full"
												style={{
													width: `${Math.min(row.complianceRate, 100)}%`,
													backgroundColor: rateBarColor(row.complianceRate),
												}}
											/>
										</div>
										<span className="w-12 text-right text-sm font-semibold tabular-nums">
											{row.complianceRate.toFixed(1)}%
										</span>
									</div>
									<div className="sm:w-28">
										<TrendBadge value={row.vsPriorYear} />
									</div>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}

			{stats.declining.length === 0 && filteredRows.length > 0 ? (
				<p className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
					<CheckCircle2 className="size-3.5 text-primary" />
					No declining measures in this filter
				</p>
			) : null}
		</div>
	);
}
