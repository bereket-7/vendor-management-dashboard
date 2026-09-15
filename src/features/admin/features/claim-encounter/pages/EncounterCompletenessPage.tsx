"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Download,
	FileWarning,
	RefreshCw,
	Search,
	Settings2,
	ShieldAlert,
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
import {
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	ClaimTablePagination,
	usePagedRows,
} from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import { cn } from "@/lib/utils";

const PANEL = CMS_EDGE_PANEL_CLASS;

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";
const STAT_SHADOW_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const selectField = cn(
	"h-8 w-auto min-w-[7.5rem] rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

type CompletenessStatus =
	| "Complete"
	| "Potential Gap"
	| "Missing Submission"
	| "Investigating";

type CompletenessRow = {
	vendor: string;
	fileType: string;
	frequency: string;
	expected: number;
	received: number;
	status: CompletenessStatus;
	lastSubmission: string;
};

const ROWS: CompletenessRow[] = [
	{
		vendor: "UST Healthcare",
		fileType: "837 Professional",
		frequency: "Daily",
		expected: 12450,
		received: 12120,
		status: "Complete",
		lastSubmission: "07/28/2026 09:14 AM",
	},
	{
		vendor: "Avesis",
		fileType: "837 Institutional",
		frequency: "Daily",
		expected: 8700,
		received: 4250,
		status: "Missing Submission",
		lastSubmission: "07/21/2026 10:02 AM",
	},
	{
		vendor: "Change Healthcare",
		fileType: "837 Professional",
		frequency: "Daily",
		expected: 7600,
		received: 7010,
		status: "Potential Gap",
		lastSubmission: "07/28/2026 08:51 AM",
	},
	{
		vendor: "Delta Dental",
		fileType: "837 Dental",
		frequency: "Daily",
		expected: 3200,
		received: 1100,
		status: "Missing Submission",
		lastSubmission: "07/27/2026 10:02 AM",
	},
	{
		vendor: "Gainwell Medicaid",
		fileType: "837 Professional",
		frequency: "Weekly",
		expected: 15800,
		received: 15560,
		status: "Complete",
		lastSubmission: "07/28/2026 10:02 AM",
	},
	{
		vendor: "Cerry Exchange",
		fileType: "837 Professional",
		frequency: "Weekly",
		expected: 6300,
		received: 5180,
		status: "Potential Gap",
		lastSubmission: "07/28/2026 09:40 AM",
	},
	{
		vendor: "Optum Insight",
		fileType: "837 Institutional",
		frequency: "Daily",
		expected: 9400,
		received: 8120,
		status: "Investigating",
		lastSubmission: "07/26/2026 04:18 PM",
	},
	{
		vendor: "Humana Network",
		fileType: "837 Professional",
		frequency: "Daily",
		expected: 5100,
		received: 5080,
		status: "Complete",
		lastSubmission: "07/28/2026 11:05 AM",
	},
];

const FILE_TYPES = Array.from(new Set(ROWS.map((r) => r.fileType)));
const VENDORS = ROWS.map((r) => r.vendor);

function coveragePct(row: CompletenessRow) {
	if (row.expected <= 0) return 0;
	return Math.round((row.received / row.expected) * 1000) / 10;
}

function variance(row: CompletenessRow) {
	return row.received - row.expected;
}

function statusWhy(status: CompletenessStatus) {
	switch (status) {
		case "Complete":
			return "Encounter volume is within the expected range.";
		case "Potential Gap":
			return "Received volume is below the historical baseline — confirm late files or volume shift.";
		case "Missing Submission":
			return "Expected submission window passed with a large shortfall — escalate with the vendor.";
		case "Investigating":
			return "Ops is reviewing anomalies against prior weeks and file manifests.";
	}
}

function statusAction(status: CompletenessStatus) {
	switch (status) {
		case "Complete":
			return {
				tone: "text-emerald-700 dark:text-emerald-400",
				text: "No action required.",
			};
		case "Potential Gap":
			return {
				tone: "text-amber-800 dark:text-amber-300",
				text: "Review late arrivals and week-over-week volume.",
			};
		case "Missing Submission":
			return {
				tone: "text-rose-700 dark:text-rose-400",
				text: "Open vendor follow-up for missing files.",
			};
		case "Investigating":
			return {
				tone: "text-violet-700 dark:text-violet-300",
				text: "Continue investigation; hold alerts until root cause closes.",
			};
	}
}

function StatusPill({ status }: { status: CompletenessStatus }) {
	const tone = {
		Complete:
			"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
		"Potential Gap":
			"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
		"Missing Submission":
			"border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
		Investigating:
			"border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
	}[status];

	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
				tone
			)}
		>
			{status}
		</span>
	);
}

function MetricStripItem({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: boolean;
}) {
	return (
		<div className="min-w-0">
			<p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
				{label}
			</p>
			<p
				className={cn(
					"mt-0.5 truncate text-sm font-semibold tabular-nums tracking-tight",
					accent ? "text-primary" : "text-foreground"
				)}
			>
				{value}
			</p>
		</div>
	);
}

type StatusBucket = "all" | "complete" | "gap" | "missing" | "investigating";

export function EncounterCompletenessPage() {
	const [vendor, setVendor] = useState("all");
	const [fileType, setFileType] = useState("all");
	const [status, setStatus] = useState("all");
	const [statusBucket, setStatusBucket] = useState<StatusBucket>("all");
	const [search, setSearch] = useState("");
	const [selectedVendor, setSelectedVendor] = useState<string | null>(
		ROWS[0]?.vendor ?? null
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return ROWS.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (fileType !== "all" && row.fileType !== fileType) return false;
			if (status !== "all" && row.status !== status) return false;
			if (statusBucket === "complete" && row.status !== "Complete")
				return false;
			if (statusBucket === "gap" && row.status !== "Potential Gap")
				return false;
			if (statusBucket === "missing" && row.status !== "Missing Submission")
				return false;
			if (statusBucket === "investigating" && row.status !== "Investigating")
				return false;
			if (
				q &&
				!`${row.vendor} ${row.fileType} ${row.status}`.toLowerCase().includes(q)
			) {
				return false;
			}
			return true;
		});
	}, [fileType, search, status, statusBucket, vendor]);

	const { pageRows, pageCount, safePage } = usePagedRows(
		filtered,
		pageSize,
		page,
		setPage
	);

	const selected =
		filtered.find((r) => r.vendor === selectedVendor) ?? filtered[0] ?? null;

	const stats = useMemo(() => {
		const complete = filtered.filter((r) => r.status === "Complete").length;
		const gap = filtered.filter((r) => r.status === "Potential Gap").length;
		const missing = filtered.filter(
			(r) => r.status === "Missing Submission"
		).length;
		const investigating = filtered.filter(
			(r) => r.status === "Investigating"
		).length;
		const expected = filtered.reduce((s, r) => s + r.expected, 0);
		const received = filtered.reduce((s, r) => s + r.received, 0);
		const coverage =
			expected > 0 ? Math.round((received / expected) * 1000) / 10 : 0;
		const attention = gap + missing + investigating;
		const health =
			missing > 0 ? "At Risk" : attention > 0 ? "Watch" : "On Track";
		return {
			complete,
			gap,
			missing,
			investigating,
			expected,
			received,
			coverage,
			attention,
			health,
			vendors: filtered.length,
		};
	}, [filtered]);

	const attentionRows = filtered.filter((r) => r.status !== "Complete");

	function toggleBucket(next: StatusBucket) {
		setStatusBucket((cur) => (cur === next ? "all" : next));
		setStatus("all");
		setPage(1);
	}

	function handleRefresh() {
		setRefreshing(true);
		window.setTimeout(() => {
			setRefreshing(false);
			toast.success("Completeness refreshed");
		}, 600);
	}

	function handleExport() {
		toast.success("Completeness export started");
	}

	const kpis = [
		{
			id: "complete",
			label: "Complete",
			value: stats.complete,
			hint: `${stats.vendors ? Math.round((stats.complete / stats.vendors) * 100) : 0}% of filtered`,
			icon: CheckCircle2,
			accent: "from-emerald-500/80 to-emerald-400/40",
			valueTone: "text-emerald-700 dark:text-emerald-300",
			well: "bg-emerald-600",
			ring: "ring-emerald-500/20",
			active: statusBucket === "complete",
			onClick: () => toggleBucket("complete"),
		},
		{
			id: "gap",
			label: "Potential gap",
			value: stats.gap,
			hint: "Below baseline",
			icon: AlertTriangle,
			accent: "from-amber-500/80 to-amber-400/40",
			valueTone: "text-amber-700 dark:text-amber-300",
			well: "bg-amber-600",
			ring: "ring-amber-500/20",
			active: statusBucket === "gap",
			onClick: () => toggleBucket("gap"),
		},
		{
			id: "missing",
			label: "Missing",
			value: stats.missing,
			hint: "Follow-up required",
			icon: FileWarning,
			accent: "from-rose-500/80 to-rose-400/40",
			valueTone: "text-rose-700 dark:text-rose-300",
			well: "bg-rose-600",
			ring: "ring-rose-500/20",
			active: statusBucket === "missing",
			onClick: () => toggleBucket("missing"),
		},
		{
			id: "coverage",
			label: "Coverage",
			value: `${stats.coverage}%`,
			hint: `${stats.received.toLocaleString()} / ${stats.expected.toLocaleString()}`,
			icon: ShieldAlert,
			accent: "from-sky-500/80 to-sky-400/40",
			valueTone: "text-sky-700 dark:text-sky-300",
			well: "bg-sky-600",
			ring: "ring-sky-500/20",
			active: false,
			onClick: () => undefined,
		},
	] as const;

	return (
		<div className="space-y-4">
			{/* Compact header */}
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Completeness
					</h1>
					<p className="text-sm text-muted-foreground">
						Expected vs received encounters by vendor
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={() => toast.message("Alert configuration opened")}
					>
						<Settings2 className="size-3.5" />
						Alerts
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleExport}
					>
						<Download className="size-3.5" />
						Export
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{/* Primary overview banner */}
			<section className="rounded-sm border border-primary/20 bg-primary px-4 py-4 text-primary-foreground shadow-[0_1px_3px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)] sm:px-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0 space-y-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
								Completeness status
							</p>
							<span className="inline-flex items-center gap-1.5 rounded-sm border border-primary-foreground/25 bg-primary-foreground/10 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
								<span
									className={cn(
										"size-1.5 rounded-full",
										stats.health === "On Track"
											? "bg-emerald-300"
											: stats.health === "Watch"
												? "bg-amber-300"
												: "bg-rose-300"
									)}
								/>
								{stats.health}
							</span>
						</div>
						<p className="text-base font-semibold tracking-tight sm:text-lg">
							{stats.vendors} vendors · {stats.coverage}% coverage
						</p>
						<p className="text-xs text-primary-foreground/75">
							{stats.complete} complete · {stats.gap} potential gap ·{" "}
							{stats.missing} missing · {stats.investigating} investigating
						</p>
						<div className="flex flex-wrap gap-1.5 pt-1">
							{(
								[
									["Complete", "complete", stats.complete],
									["Gap", "gap", stats.gap],
									["Missing", "missing", stats.missing],
									["Investigating", "investigating", stats.investigating],
								] as const
							).map(([label, bucket, count]) => {
								const active = statusBucket === bucket;
								return (
									<button
										key={bucket}
										type="button"
										onClick={() => toggleBucket(bucket)}
										className={cn(
											"inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition",
											active
												? "border-primary-foreground bg-primary-foreground text-primary"
												: "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
										)}
									>
										{label}
										<span className="tabular-nums opacity-80">{count}</span>
									</button>
								);
							})}
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-5 sm:gap-6">
						<div className="min-w-[7.5rem]">
							<p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
								Coverage
							</p>
							<p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
								{stats.coverage}%
							</p>
							<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary-foreground/20">
								<div
									className="h-full rounded-full bg-primary-foreground"
									style={{ width: `${Math.min(stats.coverage, 100)}%` }}
								/>
							</div>
						</div>
						{stats.attention > 0 ? (
							<Button
								size="sm"
								className="h-9 gap-1.5 rounded-sm border-0 bg-primary-foreground text-primary shadow-none hover:bg-primary-foreground/90"
								onClick={() => {
									setStatusBucket("all");
									setStatus("all");
									const first = attentionRows[0];
									if (first) setSelectedVendor(first.vendor);
									setPage(1);
								}}
							>
								Work attention
								<ArrowRight className="size-3.5" />
							</Button>
						) : null}
					</div>
				</div>
			</section>

			{/* Vibrant KPIs */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					const interactive = kpi.id !== "coverage";
					const className = cn(
						"group relative overflow-hidden rounded-sm border bg-card p-4 text-left transition-all duration-200 ease-out",
						STAT_SHADOW,
						interactive && STAT_SHADOW_HOVER,
						interactive && "hover:-translate-y-px hover:border-border",
						kpi.active
							? cn("border-transparent ring-1", kpi.ring)
							: "border-border/70"
					);
					const body = (
						<>
							<span
								aria-hidden
								className={cn(
									"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
									kpi.accent
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
											kpi.valueTone
										)}
									>
										{typeof kpi.value === "number"
											? kpi.value.toLocaleString()
											: kpi.value}
									</p>
									<p className="mt-1.5 text-xs text-muted-foreground">
										{kpi.hint}
									</p>
								</div>
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
										kpi.well
									)}
								>
									<Icon className="size-[18px] text-white" aria-hidden />
								</span>
							</div>
						</>
					);
					return interactive ? (
						<button
							key={kpi.id}
							type="button"
							onClick={kpi.onClick}
							className={className}
						>
							{body}
						</button>
					) : (
						<div key={kpi.id} className={className}>
							{body}
						</div>
					);
				})}
			</div>

			{/* Filters */}
			<section className={cn(PANEL, "px-3 py-2.5")}>
				<div className="flex flex-col gap-2.5">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search vendor, file type, status…"
							className="h-8 rounded-sm border-border bg-background pl-8 text-xs shadow-none focus-visible:ring-primary/15"
						/>
						{search ? (
							<button
								type="button"
								aria-label="Clear search"
								className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								onClick={() => {
									setSearch("");
									setPage(1);
								}}
							>
								<X className="size-3.5" />
							</button>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={vendor}
							onValueChange={(v) => {
								setVendor(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-34")}>
								<SelectValue placeholder="Vendor" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All vendors</SelectItem>
								{VENDORS.map((v) => (
									<SelectItem key={v} value={v}>
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={fileType}
							onValueChange={(v) => {
								setFileType(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-40")}>
								<SelectValue placeholder="File type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All file types</SelectItem>
								{FILE_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={status}
							onValueChange={(v) => {
								setStatus(v);
								setStatusBucket("all");
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-40")}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								{(
									[
										"Complete",
										"Potential Gap",
										"Missing Submission",
										"Investigating",
									] as const
								).map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{(vendor !== "all" ||
							fileType !== "all" ||
							status !== "all" ||
							statusBucket !== "all" ||
							search) && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2 text-xs text-muted-foreground"
								onClick={() => {
									setVendor("all");
									setFileType("all");
									setStatus("all");
									setStatusBucket("all");
									setSearch("");
									setPage(1);
								}}
							>
								Clear
							</Button>
						)}
					</div>
				</div>
			</section>

			{/* Table + detail */}
			<div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)]">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
						<p className="text-xs font-semibold text-foreground">
							Vendor completeness
							<span className="ml-1.5 font-normal text-muted-foreground">
								{filtered.length} row{filtered.length === 1 ? "" : "s"}
							</span>
						</p>
					</div>

					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
							<p className="text-sm font-medium text-foreground">
								No vendors match
							</p>
							<p className="text-xs text-muted-foreground">
								Widen filters or clear search.
							</p>
						</div>
					) : (
						<>
							<div className={CMS_EDGE_TABLE_CONTAINER}>
								<CmsEdgeTableScroll>
									<Table>
										<TableHeader>
											<TableRow className="hover:bg-transparent">
												<TableHead className={th}>Vendor</TableHead>
												<TableHead className={th}>File type</TableHead>
												<TableHead className={cn(th, "text-right")}>
													Expected
												</TableHead>
												<TableHead className={cn(th, "text-right")}>
													Received
												</TableHead>
												<TableHead className={cn(th, "text-right")}>
													Cov %
												</TableHead>
												<TableHead className={cn(th, "text-right")}>
													Var
												</TableHead>
												<TableHead className={th}>Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{pageRows.map((row) => {
												const pct = coveragePct(row);
												const varn = variance(row);
												const active = selected?.vendor === row.vendor;
												return (
													<TableRow
														key={row.vendor}
														className={cn(
															"cursor-pointer",
															active && "bg-primary/5"
														)}
														onClick={() => setSelectedVendor(row.vendor)}
													>
														<TableCell className={cn(td, "font-medium")}>
															<div className="min-w-0">
																<p className="truncate">{row.vendor}</p>
																<p className="text-[10px] text-muted-foreground">
																	{row.frequency} · {row.lastSubmission}
																</p>
															</div>
														</TableCell>
														<TableCell
															className={cn(
																td,
																"text-xs text-muted-foreground"
															)}
														>
															{row.fileType}
														</TableCell>
														<TableCell
															className={cn(td, "text-right tabular-nums")}
														>
															{row.expected.toLocaleString()}
														</TableCell>
														<TableCell
															className={cn(td, "text-right tabular-nums")}
														>
															{row.received.toLocaleString()}
														</TableCell>
														<TableCell className={cn(td, "text-right")}>
															<span
																className={cn(
																	"font-semibold tabular-nums",
																	pct >= 95
																		? "text-emerald-700 dark:text-emerald-400"
																		: pct >= 70
																			? "text-amber-700 dark:text-amber-400"
																			: "text-rose-700 dark:text-rose-400"
																)}
															>
																{pct}%
															</span>
														</TableCell>
														<TableCell
															className={cn(
																td,
																"text-right tabular-nums",
																varn < 0 && "text-rose-700 dark:text-rose-400"
															)}
														>
															{varn > 0 ? "+" : ""}
															{varn.toLocaleString()}
														</TableCell>
														<TableCell className={td}>
															<StatusPill status={row.status} />
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</CmsEdgeTableScroll>
							</div>
							<ClaimTablePagination
								total={filtered.length}
								page={safePage}
								pageSize={pageSize}
								pageCount={pageCount}
								onPageChange={setPage}
								onPageSizeChange={(size) => {
									setPageSize(size);
									setPage(1);
								}}
								noun="vendors"
							/>
						</>
					)}
				</section>

				{/* Quiet detail */}
				<aside className={cn(PANEL, "relative overflow-hidden")}>
					<div className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full bg-primary/10 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-20 -left-10 size-36 rounded-full bg-sky-500/10 blur-3xl" />

					{selected ? (
						<div className="relative flex h-full flex-col">
							<div className="border-b border-border/50 px-4 py-3">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
											Vendor detail
										</p>
										<h2 className="mt-0.5 truncate text-base font-semibold tracking-tight">
											{selected.vendor}
										</h2>
										<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
											{selected.fileType} · {selected.frequency}
										</p>
									</div>
									<StatusPill status={selected.status} />
								</div>

								<div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border/40 pt-3 sm:grid-cols-4">
									<MetricStripItem
										label="Expected"
										value={selected.expected.toLocaleString()}
									/>
									<MetricStripItem
										label="Received"
										value={selected.received.toLocaleString()}
									/>
									<MetricStripItem
										label="Coverage"
										value={`${coveragePct(selected)}%`}
										accent
									/>
									<MetricStripItem
										label="Variance"
										value={`${variance(selected) > 0 ? "+" : ""}${variance(selected).toLocaleString()}`}
									/>
								</div>
							</div>

							<div className="flex-1 space-y-3 p-4">
								<div className="rounded-sm border border-border/50 bg-muted/15 px-3 py-2.5">
									<p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
										Why this status?
									</p>
									<p className="mt-1 text-xs leading-relaxed text-foreground/90">
										{statusWhy(selected.status)}
									</p>
								</div>

								<div className="rounded-sm border border-border/50 bg-muted/15 px-3 py-2.5">
									<p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
										Last submission
									</p>
									<p className="mt-0.5 font-mono text-xs text-foreground">
										{selected.lastSubmission}
									</p>
								</div>

								<div className="rounded-sm border border-border/50 bg-muted/15 px-3 py-2.5">
									<p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
										Recommended action
									</p>
									<p
										className={cn(
											"mt-1 text-xs font-medium",
											statusAction(selected.status).tone
										)}
									>
										{statusAction(selected.status).text}
									</p>
								</div>

								<dl className="space-y-2 rounded-sm border border-border/50 bg-muted/10 px-3 py-2.5 text-xs">
									{(
										[
											["Submission frequency", selected.frequency],
											["Encounter type", selected.fileType],
											["Data source", "Historical average (last 8 weeks)"],
											["Members impacted", "—"],
										] as const
									).map(([label, value]) => (
										<div key={label} className="flex justify-between gap-3">
											<dt className="text-muted-foreground">{label}</dt>
											<dd className="text-right font-medium text-foreground">
												{value}
											</dd>
										</div>
									))}
								</dl>

								<Button
									variant="outline"
									size="sm"
									className="h-8 w-full rounded-sm text-xs"
									onClick={() =>
										toast.message(`Opened details for ${selected.vendor}`)
									}
								>
									View vendor details
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
							<p className="text-sm font-medium text-foreground">
								Select a vendor
							</p>
							<p className="text-xs text-muted-foreground">
								Pick a row to inspect coverage and gaps.
							</p>
						</div>
					)}
				</aside>
			</div>

			{/* Attention queue + guidance */}
			<div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
						<p className="text-xs font-semibold text-foreground">
							Attention queue
							<span className="ml-1.5 font-normal text-muted-foreground">
								{attentionRows.length} vendor
								{attentionRows.length === 1 ? "" : "s"}
							</span>
						</p>
					</div>

					{attentionRows.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
							<p className="text-sm font-medium text-foreground">
								Nothing outstanding
							</p>
							<p className="text-xs text-muted-foreground">
								Every vendor in this filter is complete.
							</p>
						</div>
					) : (
						<div className="divide-y divide-border/40">
							{attentionRows.map((row) => {
								const pct = coveragePct(row);
								const short = Math.max(0, row.expected - row.received);
								return (
									<button
										key={`attn-${row.vendor}`}
										type="button"
										onClick={() => setSelectedVendor(row.vendor)}
										className={cn(
											"flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
											selected?.vendor === row.vendor && "bg-primary/5"
										)}
									>
										<div
											className={cn(
												"flex size-8 shrink-0 items-center justify-center rounded-sm",
												row.status === "Missing Submission"
													? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
													: row.status === "Investigating"
														? "bg-violet-500/12 text-violet-700 dark:text-violet-300"
														: "bg-amber-500/12 text-amber-700 dark:text-amber-300"
											)}
										>
											{row.status === "Missing Submission" ? (
												<FileWarning className="size-3.5" />
											) : row.status === "Investigating" ? (
												<Search className="size-3.5" />
											) : (
												<AlertTriangle className="size-3.5" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-1.5">
												<span className="truncate text-xs font-semibold text-foreground">
													{row.vendor}
												</span>
												<StatusPill status={row.status} />
											</div>
											<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
												{row.fileType} · last {row.lastSubmission}
											</p>
										</div>
										<div className="hidden shrink-0 text-right sm:block">
											<p className="text-xs font-semibold tabular-nums text-foreground">
												−{short.toLocaleString()}
											</p>
											<p className="text-[10px] tabular-nums text-muted-foreground">
												{pct}% coverage
											</p>
										</div>
									</button>
								);
							})}
						</div>
					)}
				</section>

				<section className={cn(PANEL, "p-4")}>
					<p className="text-xs font-semibold text-foreground">
						What affects completeness?
					</p>
					<ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
						<li className="flex gap-2">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
							Missing or late vendor file submissions
						</li>
						<li className="flex gap-2">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
							Significant drop in expected encounter volume
						</li>
						<li className="flex gap-2">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
							Missing encounter types or service categories
						</li>
						<li className="flex gap-2">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
							Data quality issues excluding records from counts
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
