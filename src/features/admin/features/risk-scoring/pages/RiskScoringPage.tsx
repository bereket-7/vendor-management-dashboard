"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	Gauge,
	Search,
	ShieldAlert,
	ShieldCheck,
	TrendingDown,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { FILE_RUNS } from "@/features/admin/features/file-management/mock-data";
import {
	VENDOR_ALERTS,
	VENDOR_DIRECTORY,
	VENDOR_INTEGRATION,
	VENDOR_TREND_BY_ID,
	type VendorListHealth,
	getVendorIntegration,
	runBucket,
	runsForVendor,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";
import type { ProgramFileType } from "@/types/UI/system.types";

type RiskLevel = "high" | "medium" | "low";

type RiskRow = {
	id: string;
	name: string;
	vendorCode: string;
	vendorType: string;
	health: VendorListHealth;
	slaPercent: number;
	alertsCount: number;
	errors: number;
	failedRuns: number;
	warningRuns: number;
	riskScore: number;
	riskLevel: RiskLevel;
	trend: number[];
	mark: string;
	avatarBg: string;
};

function riskLevelFor(score: number): RiskLevel {
	if (score >= 70) return "high";
	if (score >= 40) return "medium";
	return "low";
}

function computeRiskScore(input: {
	health: VendorListHealth;
	slaPercent: number;
	alertsCount: number;
	failedRuns: number;
	warningRuns: number;
	totalRuns: number;
}): number {
	const healthRisk =
		input.health === "critical" ? 70 : input.health === "warning" ? 35 : 0;
	const alertRisk = Math.min(40, input.alertsCount * 12);
	const failWarningRatio = input.totalRuns
		? (input.failedRuns + input.warningRuns) / input.totalRuns
		: 0;
	const runRisk = failWarningRatio * 100;
	const slaRisk = Math.max(0, 100 - input.slaPercent);
	return Math.round(
		Math.min(
			100,
			Math.max(
				0,
				healthRisk * 0.35 + alertRisk * 0.25 + runRisk * 0.25 + slaRisk * 0.15
			)
		)
	);
}

function mockTrend(seed: number, riskScore: number): number[] {
	const base = Math.max(10, riskScore - 12);
	return Array.from({ length: 7 }, (_, i) => {
		const wobble = ((seed * 17 + i * 13) % 11) - 5;
		return Math.min(100, Math.max(0, Math.round(base + wobble + i * 1.2)));
	});
}

function trendFromRuns(
	vendorId: string,
	riskScore: number,
	seed: number
): number[] {
	const series = VENDOR_TREND_BY_ID[vendorId];
	if (!series) return mockTrend(seed, riskScore);
	return series.map((day) =>
		Math.min(100, Math.round(day.failed * 28 + day.warnings * 12 + 8))
	);
}

function RiskBadge({ level }: { level: RiskLevel }) {
	if (level === "high") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-1.5 py-0 text-[10px] font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
				High
			</span>
		);
	}
	if (level === "medium") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
				Medium
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-md border border-transparent bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
			Low
		</span>
	);
}

function HealthDot({ health }: { health: VendorListHealth }) {
	const label =
		health === "healthy"
			? "Healthy"
			: health === "warning"
				? "Warning"
				: "Critical";
	const color =
		health === "healthy"
			? "bg-emerald-500"
			: health === "warning"
				? "bg-amber-500"
				: "bg-red-500";
	return (
		<span className="inline-flex items-center gap-1.5 text-xs">
			<span className={cn("size-1.5 rounded-full", color)} />
			{label}
		</span>
	);
}

function SparkBars({ values }: { values: number[] }) {
	const max = Math.max(...values, 1);
	return (
		<div className="flex h-6 items-end gap-0.5" aria-hidden>
			{values.map((v, i) => (
				<span
					key={i}
					className="w-1 rounded-sm bg-primary/55"
					style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
				/>
			))}
		</div>
	);
}

function scoreBarTone(level: RiskLevel) {
	if (level === "high") return "bg-red-500";
	if (level === "medium") return "bg-amber-500";
	return "bg-emerald-500";
}

function buildRiskRows(program: ProgramFileType): RiskRow[] {
	return VENDOR_DIRECTORY.map((vendor, index) => {
		const integration =
			VENDOR_INTEGRATION[vendor.id] ?? getVendorIntegration(vendor.id);
		const alertsCount = VENDOR_ALERTS.filter(
			(alert) =>
				alert.vendorId === vendor.id &&
				(alert.severity === "error" || alert.severity === "warning")
		).length;
		const mappedRuns = runsForVendor(vendor.id, program);
		const nameMatchedRuns = FILE_RUNS.filter(
			(run) =>
				run.program === program &&
				(run.vendor.toLowerCase() === vendor.name.toLowerCase() ||
					run.vendor.toLowerCase().startsWith(vendor.name.toLowerCase()))
		);
		const runs = mappedRuns.length > 0 ? mappedRuns : nameMatchedRuns;
		const failedRuns = runs.filter(
			(r) => runBucket(r.status) === "failed"
		).length;
		const warningRuns = runs.filter(
			(r) => runBucket(r.status) === "warning"
		).length;
		const errors = runs.reduce((sum, run) => sum + run.errorCount, 0);
		const riskScore = computeRiskScore({
			health: vendor.health,
			slaPercent: integration.slaPercent,
			alertsCount: Math.max(alertsCount, integration.alertsCount),
			failedRuns,
			warningRuns,
			totalRuns: runs.length,
		});
		const riskLevel = riskLevelFor(riskScore);
		return {
			id: vendor.id,
			name: vendor.name,
			vendorCode: vendor.vendorCode,
			vendorType: vendor.vendorType,
			health: vendor.health,
			slaPercent: integration.slaPercent,
			alertsCount: Math.max(alertsCount, integration.alertsCount),
			errors,
			failedRuns,
			warningRuns,
			riskScore,
			riskLevel,
			trend: trendFromRuns(vendor.id, riskScore, index + 1),
			mark: vendor.mark,
			avatarBg: vendor.avatarBg,
		};
	}).sort((a, b) => b.riskScore - a.riskScore);
}

export function RiskScoringPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [riskFilter, setRiskFilter] = useState("all");

	const rows = useMemo(() => buildRiskRows(programFilter), [programFilter]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (riskFilter !== "all" && row.riskLevel !== riskFilter) return false;
			if (!q) return true;
			return [row.name, row.vendorCode, row.vendorType]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [rows, search, riskFilter]);

	const summary = useMemo(() => {
		const high = filtered.filter((r) => r.riskLevel === "high").length;
		const medium = filtered.filter((r) => r.riskLevel === "medium").length;
		const low = filtered.filter((r) => r.riskLevel === "low").length;
		const avgScore = filtered.length
			? Math.round(
					filtered.reduce((sum, r) => sum + r.riskScore, 0) / filtered.length
				)
			: 0;
		return {
			high,
			medium,
			low,
			avgScore,
			pie: [
				{ name: "High", value: high, color: "#dc2626" },
				{ name: "Medium", value: medium, color: "#d97706" },
				{ name: "Low", value: low, color: "#059669" },
			],
		};
	}, [filtered]);

	const kpis = [
		{
			label: "High Risk",
			value: summary.high,
			hint: "Score ≥ 70",
			icon: ShieldAlert,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			label: "Medium Risk",
			value: summary.medium,
			hint: "Score 40–69",
			icon: AlertTriangle,
			tone: "text-amber-700 bg-amber-500/10",
		},
		{
			label: "Low Risk",
			value: summary.low,
			hint: "Score < 40",
			icon: ShieldCheck,
			tone: "text-emerald-700 bg-emerald-500/10",
		},
		{
			label: "Avg Score",
			value: summary.avgScore,
			hint: "Composite 0–100",
			icon: Gauge,
			tone: "text-primary bg-primary/10",
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Vendor Risk Scoring
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Composite risk from health, SLA attainment, open alerts, and failed
						or warning file runs.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild size="sm" variant="outline" className="h-9">
						<Link href="/admin/vendors">Vendors</Link>
					</Button>
					<Button asChild size="sm" variant="outline" className="h-9">
						<Link href="/admin/vendor-comparison">Compare</Link>
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-[240px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search vendor name, code, or type"
						className="h-9 pl-8"
					/>
				</div>
				<Select value={riskFilter} onValueChange={setRiskFilter}>
					<SelectTrigger className="h-9 w-[160px]">
						<SelectValue placeholder="Risk level" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All levels</SelectItem>
						<SelectItem value="high">High (≥70)</SelectItem>
						<SelectItem value="medium">Medium (40–69)</SelectItem>
						<SelectItem value="low">Low (&lt;40)</SelectItem>
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					size="sm"
					className="h-9"
					onClick={() => {
						setSearch("");
						setRiskFilter("all");
					}}
				>
					Clear
				</Button>
			</div>

			<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
				{kpis.map((k) => {
					const Icon = k.icon;
					return (
						<div
							key={k.label}
							className="rounded-xl border border-border bg-card shadow-sm p-2.5"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{k.label}
									</p>
									<p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{k.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
										k.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}

				<div className="rounded-xl border border-border bg-card shadow-sm p-2.5">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Risk Distribution
					</p>
					<div className="mt-1 flex items-center gap-2">
						<ul className="min-w-0 flex-1 space-y-1 text-[11px]">
							{summary.pie.map((item) => (
								<li
									key={item.name}
									className="flex items-center justify-between gap-2"
								>
									<span className="flex items-center gap-1.5">
										<span
											className="size-1.5 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
										{item.name}
									</span>
									<span className="tabular-nums text-muted-foreground">
										{item.value}
									</span>
								</li>
							))}
						</ul>
						<div className="h-14 w-14 shrink-0">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={summary.pie.filter((d) => d.value > 0)}
										dataKey="value"
										nameKey="name"
										innerRadius={16}
										outerRadius={26}
										paddingAngle={2}
									>
										{summary.pie
											.filter((d) => d.value > 0)
											.map((entry) => (
												<Cell key={entry.name} fill={entry.color} />
											))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</div>

			<Card className="gap-0 overflow-hidden py-0">
				<CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
					<div>
						<CardTitle className="text-sm font-medium">Risk heatmap</CardTitle>
						<p className="text-xs text-muted-foreground">
							Higher score indicates greater operational risk.
						</p>
					</div>
					<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
						<TrendingDown className="size-3.5" />
						Sorted by risk score
					</span>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/40 hover:bg-muted/40">
									<TableHead className="pl-4">Vendor</TableHead>
									<TableHead className="min-w-[180px]">Risk Score</TableHead>
									<TableHead>Health</TableHead>
									<TableHead>SLA%</TableHead>
									<TableHead>Errors</TableHead>
									<TableHead>Alerts</TableHead>
									<TableHead>Failed / Warn</TableHead>
									<TableHead>Trend</TableHead>
									<TableHead className="pr-4 text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((row) => (
									<TableRow
										key={row.id}
										className={cn(
											row.riskLevel === "high" && "bg-red-500/[0.03]",
											row.riskLevel === "medium" && "bg-amber-500/[0.03]"
										)}
									>
										<TableCell className="pl-4">
											<div className="flex items-center gap-2">
												<span
													className={cn(
														"flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white",
														row.avatarBg
													)}
												>
													{row.mark}
												</span>
												<div className="min-w-0">
													<p className="truncate text-sm font-medium">
														{row.name}
													</p>
													<p className="text-[11px] text-muted-foreground">
														{row.vendorCode} · {row.vendorType}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1.5">
												<div className="flex items-center gap-2">
													<span className="text-sm font-semibold tabular-nums">
														{row.riskScore}
													</span>
													<RiskBadge level={row.riskLevel} />
												</div>
												<Progress
													value={row.riskScore}
													className="h-1.5 bg-muted"
													indicatorClassName={scoreBarTone(row.riskLevel)}
												/>
											</div>
										</TableCell>
										<TableCell>
											<HealthDot health={row.health} />
										</TableCell>
										<TableCell className="tabular-nums text-sm">
											{row.slaPercent.toFixed(1)}%
										</TableCell>
										<TableCell className="tabular-nums text-sm">
											{row.errors}
										</TableCell>
										<TableCell className="tabular-nums text-sm">
											{row.alertsCount}
										</TableCell>
										<TableCell className="tabular-nums text-sm">
											{row.failedRuns}
											{row.warningRuns > 0 ? (
												<span className="text-muted-foreground">
													{" "}
													/ {row.warningRuns} warn
												</span>
											) : null}
										</TableCell>
										<TableCell>
											<SparkBars values={row.trend} />
										</TableCell>
										<TableCell className="pr-4 text-right">
											<Button asChild variant="ghost" size="sm" className="h-8">
												<Link href={`/admin/vendors/${row.id}`}>View</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
								{filtered.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={9}
											className="h-24 text-center text-muted-foreground"
										>
											No vendors match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
