"use client";

import { useMemo, useState } from "react";

import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	BASELINE_BENEFIT_YEARS,
	BASELINE_HIOS_OPTIONS,
	BASELINE_METRICS,
	BASELINE_QUARTERS,
	BASELINE_SEGMENTS,
	SAVED_BASELINE_RECORDS,
	emptyBaselineGrid,
	isNumericBaselineInput,
	type BaselineGridValues,
	type BaselineMarketType,
	type BaselineSegmentId,
} from "@/features/admin/features/master-data-entry/mock-data";
import { cn } from "@/lib/utils";

const TAB_TRIGGER_CLASS = cn(
	"rounded-md px-3 py-1.5 text-[11px] font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-primary",
	"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
);

function AddNewBaselinePanel() {
	const [hiosId, setHiosId] = useState("31663");
	const [benefitYear, setBenefitYear] = useState("BY2024");
	const [quarter, setQuarter] = useState("Q1");
	const [marketType, setMarketType] = useState<BaselineMarketType>("non-merged");
	const [enabledSegments, setEnabledSegments] = useState<
		Record<BaselineSegmentId, boolean>
	>({
		"individual-catastrophic": true,
		"individual-non-catastrophic": true,
		"small-group": true,
	});
	const [values, setValues] = useState<BaselineGridValues>(emptyBaselineGrid);

	const hiosLabel =
		BASELINE_HIOS_OPTIONS.find((option) => option.value === hiosId)?.label ??
		hiosId;

	function updateCell(
		metricId: (typeof BASELINE_METRICS)[number]["id"],
		segmentId: BaselineSegmentId,
		next: string
	) {
		if (!isNumericBaselineInput(next)) return;
		setValues((prev) => ({
			...prev,
			[metricId]: {
				...prev[metricId],
				[segmentId]: next,
			},
		}));
	}

	return (
		<div className="space-y-4">
			<div className="border-b border-border/60 bg-muted/30 px-4 py-2 text-sm font-semibold">
				Master Data Entry - Add New Baseline
			</div>

			<div className="rounded-xl border border-border/70 bg-muted/45 p-4">
				<div className="grid gap-4 lg:grid-cols-4">
					<div className="space-y-1">
						<Label className="text-xs font-semibold">HIOS ID</Label>
						<Select value={hiosId} onValueChange={setHiosId}>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BASELINE_HIOS_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-semibold">Benefit Year</Label>
						<Select value={benefitYear} onValueChange={setBenefitYear}>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BASELINE_BENEFIT_YEARS.map((year) => (
									<SelectItem key={year} value={year}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-semibold">Quarter</Label>
						<Select value={quarter} onValueChange={setQuarter}>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BASELINE_QUARTERS.map((value) => (
									<SelectItem key={value} value={value}>
										{value}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label className="text-xs font-semibold">Market Type</Label>
						<RadioGroup
							value={marketType}
							onValueChange={(value) =>
								setMarketType(value as BaselineMarketType)
							}
							className="flex flex-col gap-2"
						>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="non-merged" id="market-non-merged" />
								<Label htmlFor="market-non-merged" className="text-xs font-normal">
									Non - Merged Market
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="merged" id="market-merged" />
								<Label htmlFor="market-merged" className="text-xs font-normal">
									Merged Market
								</Label>
							</div>
						</RadioGroup>
					</div>
				</div>
			</div>

			<p className="text-xs font-medium text-red-600">
				*Only numbers and decimals are accepted
			</p>

			<Card className="min-w-0 bg-card">
				<CardHeader className="px-3 pb-1 pt-3">
					<CardTitle className="text-sm font-medium">Baseline Metrics</CardTitle>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="w-full overflow-x-auto border-t border-border/50">
						<Table className="w-full min-w-[980px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-8 min-w-[280px] px-2 pl-3 font-normal">
										Metric
									</TableHead>
									{BASELINE_SEGMENTS.map((segment) => (
										<TableHead
											key={segment.id}
											className="h-8 min-w-[180px] px-2 font-normal"
										>
											<div className="flex items-start gap-2">
												<Checkbox
													checked={enabledSegments[segment.id]}
													onCheckedChange={(checked) =>
														setEnabledSegments((prev) => ({
															...prev,
															[segment.id]: Boolean(checked),
														}))
													}
													aria-label={`Enable ${segment.label}`}
												/>
												<span className="leading-tight">{segment.label}</span>
											</div>
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{BASELINE_METRICS.map((metric) => (
									<TableRow key={metric.id} className="hover:bg-muted/30">
										<TableCell className="px-2 py-2 pl-3 align-top font-medium">
											{metric.label}
										</TableCell>
										{BASELINE_SEGMENTS.map((segment) => (
											<TableCell key={segment.id} className="px-2 py-2 align-top">
												<Input
													value={values[metric.id][segment.id]}
													onChange={(event) =>
														updateCell(
															metric.id,
															segment.id,
															event.target.value
														)
													}
													disabled={!enabledSegments[segment.id]}
													className="h-8 bg-card text-xs"
													inputMode="decimal"
												/>
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button
					size="sm"
					className="h-9"
					onClick={() =>
						toast.success(
							`Baseline saved for ${hiosLabel} (${benefitYear} ${quarter})`
						)
					}
				>
					<Save className="mr-1.5 size-3.5" />
					Save Baseline
				</Button>
			</div>
		</div>
	);
}

function ViewBaselinePanel() {
	const rows = useMemo(() => SAVED_BASELINE_RECORDS, []);

	return (
		<div className="space-y-4">
			<div className="border-b border-border/60 bg-muted/30 px-4 py-2 text-sm font-semibold">
				Master Data Entry - View Baseline
			</div>

			<Card className="min-w-0 bg-card">
				<CardHeader className="px-3 pb-1 pt-3">
					<CardTitle className="text-sm font-medium">Saved Baselines</CardTitle>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="w-full overflow-x-auto border-t border-border/50">
						<Table className="w-full min-w-[920px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-8 px-2 pl-3 font-normal">
										HIOS ID
									</TableHead>
									<TableHead className="h-8 px-2 font-normal">
										Benefit Year
									</TableHead>
									<TableHead className="h-8 px-2 font-normal">Quarter</TableHead>
									<TableHead className="h-8 px-2 font-normal">
										Market Type
									</TableHead>
									<TableHead className="h-8 px-2 font-normal">
										Enrollment Count
									</TableHead>
									<TableHead className="h-8 px-2 pr-3 font-normal">
										Last Updated
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={row.id} className="hover:bg-muted/30">
										<TableCell className="px-2 py-1.5 pl-3">
											{row.hiosLabel}
										</TableCell>
										<TableCell className="px-2 py-1.5">{row.benefitYear}</TableCell>
										<TableCell className="px-2 py-1.5">{row.quarter}</TableCell>
										<TableCell className="px-2 py-1.5">
											{row.marketType === "non-merged"
												? "Non - Merged Market"
												: "Merged Market"}
										</TableCell>
										<TableCell className="px-2 py-1.5 tabular-nums">
											{row.values["enrollment-count"]["individual-non-catastrophic"]}
										</TableCell>
										<TableCell className="px-2 py-1.5 pr-3 tabular-nums">
											{row.updatedAt}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function MasterDataEntryPage() {
	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Master Data Entry"
				description="Maintain issuer baseline numbers by benefit year, quarter, and market segment."
			/>

			<div className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
				<div className="border-b border-primary/15 bg-muted/35 px-4 py-2 text-sm font-semibold">
					Baseline Numbers
				</div>

				<Tabs defaultValue="add-new-baseline" className="gap-0">
					<div className="border-b border-border/60 px-4 pt-3">
						<TabsList className="inline-flex h-auto gap-1 rounded-lg bg-muted/40 p-1">
							<TabsTrigger
								value="add-new-baseline"
								className={TAB_TRIGGER_CLASS}
							>
								Add New Baseline
							</TabsTrigger>
							<TabsTrigger value="view-baseline" className={TAB_TRIGGER_CLASS}>
								View Baseline
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="p-4">
						<TabsContent value="add-new-baseline" className="mt-0">
							<AddNewBaselinePanel />
						</TabsContent>
						<TabsContent value="view-baseline" className="mt-0">
							<ViewBaselinePanel />
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	);
}
