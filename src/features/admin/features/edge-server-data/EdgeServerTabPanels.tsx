"use client";

import { useMemo, useState } from "react";

import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoFileSelectedIllustration } from "@/features/admin/features/claim-encounter/file-management/NoFileSelectedIllustration";
import {
	HHS_MASTER_DATA_ROWS,
	PUBLISHED_DATE_OPTIONS,
	QUARTERLY_BASELINE_DATES,
	QUARTERLY_BENEFIT_YEARS,
	QUARTERLY_EXTRACTION_DATES,
	QUARTERLY_HIOS_IDS,
	filterHhsMasterDataRows,
	mockEdgeServerRows,
	mockQuarterlyBaselineRows,
	mockThresholdReportRows,
	publishedDateLabel,
	type EdgeServerRow,
	type EdgeServerTabId,
	type QuarterlyBaselineFilters,
} from "@/features/admin/features/edge-server-data/mock-data";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { cn } from "@/lib/utils";

function RequiredLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="text-xs font-semibold text-foreground">
			{children}
			<span className="text-red-600">*</span>
		</label>
	);
}

function EdgeServerResultsTable({
	rows,
	title,
	subtitle,
	onDownload,
}: {
	rows: EdgeServerRow[];
	title: string;
	subtitle?: string;
	onDownload?: () => void;
}) {
	return (
		<Card className="min-w-0 bg-card">
			<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-3 pb-1 pt-3">
				<div className="min-w-0 space-y-0.5">
					<CardTitle className="text-sm font-medium">{title}</CardTitle>
					{subtitle ? (
						<p className="text-xs text-muted-foreground">{subtitle}</p>
					) : null}
				</div>
				{onDownload ? (
					<Button
						variant="link"
						size="sm"
						className="h-8 px-2 text-primary"
						onClick={onDownload}
					>
						<Download className="mr-1.5 size-3.5" />
						Download
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="w-full overflow-x-auto border-t border-border/50">
					<Table className="w-full min-w-[1100px] text-xs">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-8 px-2 pl-3 font-normal">
									Issuer (HIOS ID)
								</TableHead>
								<TableHead className="h-8 px-2 font-normal">Market Type</TableHead>
								<TableHead className="h-8 px-2 font-normal">Data Type</TableHead>
								<TableHead className="h-8 px-2 text-right font-normal">
									Baseline
								</TableHead>
								<TableHead className="h-8 px-2 font-normal">
									Baseline Date
								</TableHead>
								<TableHead className="h-8 px-2 text-right font-normal">
									EDGE Actual - ECS Count
								</TableHead>
								<TableHead className="h-8 px-2 font-normal">
									ECS Report Date
								</TableHead>
								<TableHead className="h-8 px-2 pr-3 text-right font-normal">
									Percent of Baseline
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-muted/30">
									<TableCell className="px-2 py-1.5 pl-3 tabular-nums">
										{row.issuerHiosId}
									</TableCell>
									<TableCell className="px-2 py-1.5">{row.marketType}</TableCell>
									<TableCell className="px-2 py-1.5">{row.dataType}</TableCell>
									<TableCell className="px-2 py-1.5 text-right tabular-nums">
										{formatCount(row.baseline)}
									</TableCell>
									<TableCell className="px-2 py-1.5 tabular-nums">
										{row.baselineDate}
									</TableCell>
									<TableCell className="px-2 py-1.5 text-right tabular-nums">
										{formatCount(row.edgeActualEcsCount)}
									</TableCell>
									<TableCell className="px-2 py-1.5 tabular-nums">
										{row.ecsReportDate}
									</TableCell>
									<TableCell className="px-2 py-1.5 pr-3 text-right tabular-nums">
										{row.percentOfBaseline.toFixed(2)}%
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

function resolvePublishedDateRows(tabId: EdgeServerTabId, publishedDate: string) {
	if (tabId === "threshold-report") {
		return mockThresholdReportRows(publishedDate);
	}
	return mockEdgeServerRows(tabId, publishedDate);
}

export function ThresholdReportPanel() {
	const [publishedDate, setPublishedDate] = useState("2025-03-14");

	const rows = useMemo(
		() => (publishedDate ? mockThresholdReportRows(publishedDate) : []),
		[publishedDate]
	);

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-border/70 bg-muted/45 p-4">
				<div className="max-w-xs space-y-1">
					<RequiredLabel>Published Date</RequiredLabel>
					<Select value={publishedDate} onValueChange={setPublishedDate}>
						<SelectTrigger className="h-9 bg-card">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{PUBLISHED_DATE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{publishedDate && rows.length > 0 ? (
				<EdgeServerResultsTable
					rows={rows}
					title="Threshold Report"
					subtitle={`Published Date: ${publishedDateLabel(publishedDate)}`}
					onDownload={() => toast.success("Threshold report download queued")}
				/>
			) : (
				<div className="rounded-xl border border-border/60 bg-card">
					<NoFileSelectedIllustration
						variant="idle"
						title="No published date selected"
						description="Select a published date to load threshold report data."
					/>
				</div>
			)}
		</div>
	);
}

export function PublishedDateEdgePanel({ tabId }: { tabId: EdgeServerTabId }) {
	const [publishedDate, setPublishedDate] = useState("");

	const rows = useMemo(
		() =>
			publishedDate ? resolvePublishedDateRows(tabId, publishedDate) : [],
		[tabId, publishedDate]
	);

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-border/70 bg-muted/45 p-4">
				<div className="max-w-xs space-y-1">
					<RequiredLabel>Published Date</RequiredLabel>
					<Select value={publishedDate} onValueChange={setPublishedDate}>
						<SelectTrigger className="h-9 bg-card">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{PUBLISHED_DATE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{publishedDate && rows.length > 0 ? (
				<EdgeServerResultsTable
					rows={rows}
					title="Edge Server Report"
					subtitle={`Published Date: ${publishedDateLabel(publishedDate)}`}
					onDownload={() => toast.success("Edge server report download queued")}
				/>
			) : (
				<div className="rounded-xl border border-border/60 bg-card">
					<NoFileSelectedIllustration
						variant="idle"
						title="No published date selected"
						description="Select a published date to load edge server data for this report."
					/>
				</div>
			)}
		</div>
	);
}

const EMPTY_QUARTERLY_FILTERS: QuarterlyBaselineFilters = {
	benefitYear: "all",
	hiosId: "all",
	baselineDate: "all",
	hhsExtractionDate: "all",
};

export function QuarterlyBaselineReportPanel() {
	const [subView, setSubView] = useState<"quarterly-baseline" | "enrollee-dashboard">(
		"quarterly-baseline"
	);
	const [draft, setDraft] = useState<QuarterlyBaselineFilters>(EMPTY_QUARTERLY_FILTERS);
	const [applied, setApplied] = useState<QuarterlyBaselineFilters | null>(null);
	const [searched, setSearched] = useState(false);

	const rows = useMemo(
		() =>
			applied &&
			applied.benefitYear !== "all" &&
			applied.hiosId !== "all" &&
			applied.baselineDate !== "all" &&
			applied.hhsExtractionDate !== "all"
				? mockQuarterlyBaselineRows(applied)
				: [],
		[applied]
	);

	return (
		<div className="space-y-0 overflow-hidden rounded-xl border border-border/70">
			<Tabs
				value={subView}
				onValueChange={(value) =>
					setSubView(value as "quarterly-baseline" | "enrollee-dashboard")
				}
			>
				<div className="border-b border-border/60 bg-muted/30 px-3 pt-2">
					<TabsList className="inline-flex h-auto gap-1 rounded-none bg-transparent p-0">
						<TabsTrigger
							value="quarterly-baseline"
							className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
						>
							Quarterly Baseline
						</TabsTrigger>
						<TabsTrigger
							value="enrollee-dashboard"
							className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
						>
							Enrollee Dashboard
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="border-b border-amber-200/80 bg-amber-50/80 px-4 py-2 text-sm font-semibold text-foreground">
					Quarterly Baseline Report
				</div>

				<TabsContent value="quarterly-baseline" className="mt-0 space-y-4 p-4">
					<div className="rounded-xl border border-border/70 bg-muted/45 p-4">
						<div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
							<div className="space-y-1">
								<RequiredLabel>Benefit Year</RequiredLabel>
								<Select
									value={draft.benefitYear}
									onValueChange={(value) =>
										setDraft({ ...draft, benefitYear: value })
									}
								>
									<SelectTrigger className="h-9 bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select</SelectItem>
										{QUARTERLY_BENEFIT_YEARS.map((year) => (
											<SelectItem key={year} value={year}>
												{year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<RequiredLabel>HIOS ID</RequiredLabel>
								<Select
									value={draft.hiosId}
									onValueChange={(value) =>
										setDraft({ ...draft, hiosId: value })
									}
								>
									<SelectTrigger className="h-9 bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select</SelectItem>
										{QUARTERLY_HIOS_IDS.map((id) => (
											<SelectItem key={id} value={id}>
												{id}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<RequiredLabel>Baseline Date</RequiredLabel>
								<Select
									value={draft.baselineDate}
									onValueChange={(value) =>
										setDraft({ ...draft, baselineDate: value })
									}
								>
									<SelectTrigger className="h-9 bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select</SelectItem>
										{QUARTERLY_BASELINE_DATES.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<RequiredLabel>HHS Extraction Date</RequiredLabel>
								<Select
									value={draft.hhsExtractionDate}
									onValueChange={(value) =>
										setDraft({ ...draft, hhsExtractionDate: value })
									}
								>
									<SelectTrigger className="h-9 bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select</SelectItem>
										{QUARTERLY_EXTRACTION_DATES.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								size="sm"
								className="h-9 min-w-24"
								onClick={() => {
									setApplied({ ...draft });
									setSearched(true);
								}}
							>
								Search
							</Button>
						</div>
					</div>

					{searched && rows.length > 0 ? (
						<EdgeServerResultsTable
							rows={rows}
							title="Quarterly Baseline Results"
						/>
					) : (
						<div className="rounded-xl border border-border/60 bg-card">
							<NoFileSelectedIllustration
								variant={searched ? "empty" : "idle"}
								title={
									searched ? undefined : "No quarterly baseline search applied"
								}
								description={
									searched
										? undefined
										: "Select benefit year, HIOS ID, baseline date, and HHS extraction date, then click Search."
								}
							/>
						</div>
					)}
				</TabsContent>

				<TabsContent value="enrollee-dashboard" className="mt-0 p-4">
					<div className="rounded-xl border border-border/60 bg-card">
						<NoFileSelectedIllustration
							variant="idle"
							title="Enrollee Dashboard"
							description="Enrollee dashboard views will appear here once baseline filters are configured."
						/>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function HhsMasterDataUpdatesPanel() {
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());

	const rows = useMemo(
		() => filterHhsMasterDataRows(HHS_MASTER_DATA_ROWS, search),
		[search]
	);

	const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-muted/45 p-3">
				<div className="relative min-w-[280px] flex-1 sm:max-w-md">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search HHS Master Data Table Name.."
						className="h-9 bg-card pl-8 italic placeholder:italic"
					/>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto h-9 shrink-0"
					onClick={() => toast.success("Downloading all HHS master data tables")}
				>
					<Download className="mr-1.5 size-3.5" />
					Download all
				</Button>
			</div>

			<Card className="min-w-0 bg-card">
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto">
						<Table className="min-w-[920px] text-xs">
							<TableHeader>
								<TableRow className="bg-muted/70 hover:bg-muted/70">
									<TableHead className="h-8 w-12 pl-3">
										<Checkbox
											checked={allSelected}
											onCheckedChange={(checked) => {
												if (checked) {
													setSelected(new Set(rows.map((row) => row.id)));
												} else {
													setSelected(new Set());
												}
											}}
											aria-label="Select all HHS master data tables"
										/>
									</TableHead>
									<TableHead className="h-8 font-semibold">
										HHS Master Data Table Name
									</TableHead>
									<TableHead className="h-8 font-semibold">
										Reference Type
									</TableHead>
									<TableHead className="h-8 font-semibold">
										Last Release Date
									</TableHead>
									<TableHead className="h-8 pr-3 font-semibold">Download</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row, index) => (
									<TableRow
										key={row.id}
										className={cn(
											index % 2 === 1 && "bg-muted/20",
											"hover:bg-muted/30"
										)}
									>
										<TableCell className="pl-3">
											<Checkbox
												checked={selected.has(row.id)}
												onCheckedChange={(checked) => {
													setSelected((prev) => {
														const next = new Set(prev);
														if (checked) next.add(row.id);
														else next.delete(row.id);
														return next;
													});
												}}
												aria-label={`Select ${row.tableName}`}
											/>
										</TableCell>
										<TableCell className="font-mono text-[11px]">
											{row.tableName}
										</TableCell>
										<TableCell>{row.referenceType}</TableCell>
										<TableCell className="tabular-nums">
											{row.lastReleaseDate}
										</TableCell>
										<TableCell className="pr-3">
											<Button
												variant="ghost"
												size="icon"
												className="size-8 text-muted-foreground hover:text-primary"
												onClick={() =>
													toast.success(`Download queued for ${row.tableName}`)
												}
											>
												<Download className="size-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<p className="text-right text-xs text-muted-foreground">
				Click to view latest updates in Reference Data on{" "}
				<a
					href="https://www.regtap.org"
					target="_blank"
					rel="noreferrer"
					className="text-primary underline-offset-2 hover:underline"
				>
					REGTAP website
				</a>
				.
			</p>
		</div>
	);
}
