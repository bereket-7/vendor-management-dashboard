"use client";

import { type ReactNode, useMemo, useState } from "react";

import { GitCompareArrows, Search, X } from "lucide-react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	VENDOR_ALERTS,
	VENDOR_DIRECTORY,
	VENDOR_INTEGRATION,
	type VendorDirectoryRow,
	type VendorListHealth,
	getVendorIntegration,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const MAX_COMPARE = 4;

const CHART_COLORS = ["#13446c", "#c2410c", "#1d4ed8", "#15803d"] as const;

/** Vendor row used by the reusable comparison view. */
export type ComparableVendor = {
	id: string;
	name: string;
	mark: string;
	avatarBg: string;
	health: VendorListHealth;
	linkedAccounts: number;
	activeJobs: number;
	slaPercent: number;
	alertsCount: number;
	lastFileReceived: string;
	vendorCode?: string;
	vendorType?: string;
};

type CompareMetrics = ComparableVendor & { color: string };

export type VendorComparisonPageProps = {
	title?: string;
	description?: string;
	/** Defaults to vendor-management directory with integration metrics. */
	vendors?: ComparableVendor[];
	/** Detail link for a vendor; return null to disable linking. */
	vendorHref?: (id: string) => string | null;
	headerActions?: ReactNode;
	/** Initial selected vendor ids (must exist in `vendors`). */
	defaultSelectedIds?: string[];
};

function healthLabel(health: VendorListHealth) {
	if (health === "healthy") return "Healthy";
	if (health === "warning") return "Warning";
	return "Critical";
}

function healthTone(health: VendorListHealth) {
	if (health === "healthy") return "text-emerald-700";
	if (health === "warning") return "text-amber-700";
	return "text-red-700";
}

function healthScore(health: VendorListHealth) {
	if (health === "healthy") return 100;
	if (health === "warning") return 55;
	return 20;
}

export function comparableFromDirectory(
	vendor: VendorDirectoryRow
): ComparableVendor {
	const integration =
		VENDOR_INTEGRATION[vendor.id] ?? getVendorIntegration(vendor.id);
	const alertsCount = Math.max(
		integration.alertsCount,
		VENDOR_ALERTS.filter(
			(alert) =>
				alert.vendorId === vendor.id &&
				(alert.severity === "error" || alert.severity === "warning")
		).length
	);
	return {
		id: vendor.id,
		name: vendor.name,
		mark: vendor.mark,
		avatarBg: vendor.avatarBg,
		health: vendor.health,
		linkedAccounts: vendor.linkedAccounts,
		activeJobs: vendor.activeJobs,
		slaPercent: integration.slaPercent,
		alertsCount,
		lastFileReceived: vendor.lastFileReceived,
		vendorCode: vendor.vendorCode,
		vendorType: vendor.vendorType,
	};
}

export function defaultVendorManagementComparables(): ComparableVendor[] {
	return VENDOR_DIRECTORY.map(comparableFromDirectory);
}

function normalizeRadar(selected: CompareMetrics[]) {
	const maxAccounts = Math.max(...selected.map((v) => v.linkedAccounts), 1);
	const maxJobs = Math.max(...selected.map((v) => v.activeJobs), 1);
	const maxAlerts = Math.max(...selected.map((v) => v.alertsCount), 1);

	const axes = [
		{
			metric: "OTIF / SLA",
			values: selected.map((v) => Math.round(v.slaPercent)),
		},
		{
			metric: "Health",
			values: selected.map((v) => healthScore(v.health)),
		},
		{
			metric: "Job volume",
			values: selected.map((v) => Math.round((v.activeJobs / maxJobs) * 100)),
		},
		{
			metric: "Accounts",
			values: selected.map((v) =>
				Math.round((v.linkedAccounts / maxAccounts) * 100)
			),
		},
		{
			metric: "Alert calm",
			values: selected.map((v) =>
				Math.round(100 - (v.alertsCount / maxAlerts) * 100)
			),
		},
	];

	return axes.map((axis) => {
		const point: Record<string, string | number> = { metric: axis.metric };
		selected.forEach((vendor, index) => {
			point[vendor.id] = axis.values[index] ?? 0;
		});
		return point;
	});
}

export function VendorComparisonPage({
	title = "Vendor Comparison",
	description = `Select up to ${MAX_COMPARE} vendors for side-by-side operational metrics and a normalized radar view.`,
	vendors: vendorsProp,
	vendorHref = (id) => `/admin/vendors/${id}`,
	headerActions,
	defaultSelectedIds,
}: VendorComparisonPageProps = {}) {
	const vendors = useMemo(
		() => vendorsProp ?? defaultVendorManagementComparables(),
		[vendorsProp]
	);

	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState<string[]>(() => {
		if (defaultSelectedIds?.length) {
			return defaultSelectedIds
				.filter((id) => vendors.some((v) => v.id === id))
				.slice(0, MAX_COMPARE);
		}
		return vendors.slice(0, 3).map((v) => v.id);
	});

	const filteredDirectory = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return vendors;
		return vendors.filter((vendor) =>
			[vendor.name, vendor.vendorCode, vendor.vendorType]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(q)
		);
	}, [search, vendors]);

	const selected = useMemo((): CompareMetrics[] => {
		return selectedIds.flatMap((id, index) => {
			const vendor = vendors.find((row) => row.id === id);
			if (!vendor) return [];
			const color =
				CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0];
			return [{ ...vendor, color }];
		});
	}, [selectedIds, vendors]);

	const radarData = useMemo(() => normalizeRadar(selected), [selected]);

	function toggleVendor(id: string) {
		setSelectedIds((prev) => {
			if (prev.includes(id)) return prev.filter((item) => item !== id);
			if (prev.length >= MAX_COMPARE) return prev;
			return [...prev, id];
		});
	}

	function clearSelection() {
		setSelectedIds([]);
	}

	const metricRows: {
		label: string;
		render: (vendor: CompareMetrics) => ReactNode;
	}[] = [
		{
			label: "Health",
			render: (vendor) => (
				<span className={cn("font-medium", healthTone(vendor.health))}>
					{healthLabel(vendor.health)}
				</span>
			),
		},
		{
			label: "SLA %",
			render: (vendor) => `${vendor.slaPercent.toFixed(1)}%`,
		},
		{
			label: "Active jobs",
			render: (vendor) => vendor.activeJobs,
		},
		{
			label: "Linked accounts",
			render: (vendor) => vendor.linkedAccounts,
		},
		{
			label: "Alerts",
			render: (vendor) => vendor.alertsCount,
		},
		{
			label: "Last file received",
			render: (vendor) => (
				<span className="text-xs text-muted-foreground">
					{vendor.lastFileReceived}
				</span>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						{title}
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				</div>
				{headerActions ? (
					<div className="flex flex-wrap gap-2">{headerActions}</div>
				) : null}
			</div>

			<div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
				<Card className="gap-0 py-0">
					<CardHeader className="border-b px-4 py-3">
						<CardTitle className="text-sm font-medium">
							Select vendors
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							{selectedIds.length}/{MAX_COMPARE} selected
						</p>
					</CardHeader>
					<CardContent className="space-y-3 p-3">
						<div className="relative">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search vendors"
								className="h-9 pl-8"
							/>
						</div>
						{selectedIds.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{selected.map((vendor) => (
									<button
										key={vendor.id}
										type="button"
										onClick={() => toggleVendor(vendor.id)}
										className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium hover:bg-muted"
									>
										<span
											className={cn(
												"flex size-4 items-center justify-center rounded text-[9px] text-white",
												vendor.avatarBg
											)}
										>
											{vendor.mark}
										</span>
										{vendor.name}
										<X className="size-3 text-muted-foreground" />
									</button>
								))}
								<button
									type="button"
									onClick={clearSelection}
									className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
								>
									Clear all
								</button>
							</div>
						)}
						<ScrollArea
							className="h-[420px]"
							scrollbarClassName="w-1.5"
							thumbClassName="bg-border"
						>
							<div className="space-y-1 pr-3">
								{filteredDirectory.map((vendor) => {
									const checked = selectedIds.includes(vendor.id);
									const disabled =
										!checked && selectedIds.length >= MAX_COMPARE;
									return (
										<label
											key={vendor.id}
											className={cn(
												"flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm hover:bg-muted/50",
												checked && "border-border bg-muted/40",
												disabled && "cursor-not-allowed opacity-50"
											)}
										>
											<Checkbox
												checked={checked}
												disabled={disabled}
												onCheckedChange={() => {
													if (!disabled || checked) toggleVendor(vendor.id);
												}}
											/>
											<span
												className={cn(
													"flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white",
													vendor.avatarBg
												)}
											>
												{vendor.mark}
											</span>
											<span className="min-w-0 flex-1 truncate">
												{vendor.name}
											</span>
										</label>
									);
								})}
								{filteredDirectory.length === 0 ? (
									<p className="py-8 text-center text-xs text-muted-foreground">
										No vendors match your search.
									</p>
								) : null}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<div className="space-y-4">
					<Card className="gap-0 overflow-hidden py-0">
						<CardHeader className="border-b px-4 py-3">
							<div className="flex items-center gap-2">
								<GitCompareArrows className="size-4 text-primary" />
								<div>
									<CardTitle className="text-sm font-medium">
										Side-by-side metrics
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Health, accounts, jobs, SLA, and alerts from directory and
										integration profiles.
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{selected.length === 0 ? (
								<div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
									Select at least one vendor to compare.
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/40 hover:bg-muted/40">
												<TableHead className="pl-4">Metric</TableHead>
												{selected.map((vendor) => {
													const href = vendorHref(vendor.id);
													return (
														<TableHead
															key={vendor.id}
															className="min-w-[140px]"
														>
															<div className="flex items-center gap-2">
																<span
																	className={cn(
																		"flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white",
																		vendor.avatarBg
																	)}
																>
																	{vendor.mark}
																</span>
																{href ? (
																	<Link
																		href={href}
																		className="truncate font-medium hover:underline"
																	>
																		{vendor.name}
																	</Link>
																) : (
																	<span className="truncate font-medium">
																		{vendor.name}
																	</span>
																)}
															</div>
														</TableHead>
													);
												})}
											</TableRow>
										</TableHeader>
										<TableBody>
											{metricRows.map((row) => (
												<TableRow key={row.label}>
													<TableCell className="pl-4 text-xs font-medium text-muted-foreground">
														{row.label}
													</TableCell>
													{selected.map((vendor) => (
														<TableCell
															key={`${row.label}-${vendor.id}`}
															className="tabular-nums text-sm"
														>
															{row.render(vendor)}
														</TableCell>
													))}
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="gap-0 py-0">
						<CardHeader className="border-b px-4 py-3">
							<CardTitle className="text-sm font-medium">
								Normalized comparison
							</CardTitle>
							<p className="text-xs text-muted-foreground">
								OTIF/SLA, health score, job volume, account count, and inverse
								alert pressure (0–100).
							</p>
						</CardHeader>
						<CardContent className="px-2 py-4">
							{selected.length < 2 ? (
								<div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
									Select at least two vendors to render the area chart.
								</div>
							) : (
								<div className="h-[320px] w-full">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart
											data={radarData}
											margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
										>
											<defs>
												{selected.map((vendor) => (
													<linearGradient
														key={`grad-${vendor.id}`}
														id={`compare-${vendor.id}`}
														x1="0"
														y1="0"
														x2="0"
														y2="1"
													>
														<stop
															offset="5%"
															stopColor={vendor.color}
															stopOpacity={0.35}
														/>
														<stop
															offset="95%"
															stopColor={vendor.color}
															stopOpacity={0.04}
														/>
													</linearGradient>
												))}
											</defs>
											<CartesianGrid
												strokeDasharray="3 3"
												className="stroke-border/50"
											/>
											<XAxis
												dataKey="metric"
												tickLine={false}
												axisLine={false}
												tick={{ fontSize: 11 }}
											/>
											<YAxis
												domain={[0, 100]}
												tickLine={false}
												axisLine={false}
												tick={{ fontSize: 11 }}
											/>
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: 12 }} />
											{selected.map((vendor) => (
												<Area
													key={vendor.id}
													type="monotone"
													name={vendor.name}
													dataKey={vendor.id}
													stroke={vendor.color}
													fill={`url(#compare-${vendor.id})`}
													strokeWidth={2}
													dot={{ r: 3, strokeWidth: 1 }}
													activeDot={{ r: 4 }}
												/>
											))}
										</AreaChart>
									</ResponsiveContainer>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
