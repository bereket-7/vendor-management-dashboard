"use client";

import { useMemo, useState } from "react";

import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { NoFileSelectedIllustration } from "@/features/admin/features/claim-encounter/file-management/NoFileSelectedIllustration";
import {
	HHS_FILE_TYPES,
	HHS_STATUS_OPTIONS,
	ISSUER_FILE_TYPES,
	ISSUER_NAME_OPTIONS,
	ISSUER_STATUS_OPTIONS,
	filterIssuerHhsFiles,
	type TrackFileFilters,
	type TrackedFileRow,
} from "@/features/admin/features/claim-encounter/file-management/mock-data";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { cn } from "@/lib/utils";

const EMPTY_FILTERS: TrackFileFilters = {
	issuerName: "all",
	fileType: "all",
	status: "all",
	submittedFrom: "",
	submittedTo: "",
	fileName: "",
};

function StatusText({ status }: { status: string }) {
	if (/completed|accepted|acknowledged/i.test(status)) {
		return <span className="font-semibold text-emerald-600">{status}</span>;
	}
	if (/reject|return/i.test(status)) {
		return <span className="font-semibold text-red-600">{status}</span>;
	}
	return <span className="font-semibold text-amber-700">{status}</span>;
}

function IssuerHhsFilterPanel({
	filters,
	onChange,
	onSearch,
	fileTypeOptions,
	statusOptions,
}: {
	filters: TrackFileFilters;
	onChange: (next: TrackFileFilters) => void;
	onSearch: () => void;
	fileTypeOptions: string[];
	statusOptions: string[];
}) {
	return (
		<div className="rounded-xl border border-border/70 bg-muted/45 p-4">
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-3">
					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							Issuer Name
						</label>
						<Select
							value={filters.issuerName}
							onValueChange={(value) =>
								onChange({ ...filters, issuerName: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="All" />
							</SelectTrigger>
							<SelectContent>
								{ISSUER_NAME_OPTIONS.map((name) => (
									<SelectItem key={name} value={name === "All" ? "all" : name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							File Type
						</label>
						<Select
							value={filters.fileType}
							onValueChange={(value) =>
								onChange({ ...filters, fileType: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{fileTypeOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">Status</label>
						<Select
							value={filters.status}
							onValueChange={(value) => onChange({ ...filters, status: value })}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{statusOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-3">
					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							Inbound File Name
						</label>
						<Input
							value={filters.fileName}
							onChange={(e) =>
								onChange({ ...filters, fileName: e.target.value })
							}
							className="h-9 bg-card"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							Submitted Date
						</label>
						<div className="flex items-center gap-2">
							<Input
								type="date"
								value={filters.submittedFrom}
								onChange={(e) =>
									onChange({ ...filters, submittedFrom: e.target.value })
								}
								className="h-9 bg-card"
							/>
							<span className="text-sm text-muted-foreground">–</span>
							<Input
								type="date"
								value={filters.submittedTo}
								onChange={(e) =>
									onChange({ ...filters, submittedTo: e.target.value })
								}
								className="h-9 bg-card"
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 flex justify-end">
				<Button size="sm" className="min-w-24" onClick={onSearch}>
					<Search className="mr-1.5 size-3.5" />
					Search
				</Button>
			</div>
		</div>
	);
}

function IssuerHhsResultsTable({ rows }: { rows: TrackedFileRow[] }) {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = useMemo(
		() => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
		[rows, safePage, pageSize]
	);

	return (
		<Card className="min-w-0 bg-card">
			<CardHeader className="px-3 pb-1 pt-3">
				<CardTitle className="text-sm font-medium">Results</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="w-full overflow-x-auto border-t border-border/50">
					<Table className="w-full min-w-[980px] text-xs">
						<TableHeader>
							<TableRow className="bg-muted/60 hover:bg-muted/60">
								<TableHead className="h-8 px-2 pl-3 font-semibold text-foreground">
									Inbound File Name
								</TableHead>
								<TableHead className="h-8 px-2 font-semibold text-foreground">
									Issuer Name
								</TableHead>
								<TableHead className="h-8 px-2 font-semibold text-foreground">
									Status
								</TableHead>
								<TableHead className="h-8 px-2 font-semibold text-foreground">
									Submitted Date
								</TableHead>
								<TableHead className="h-8 px-2 pr-3 text-right font-semibold text-foreground">
									Record Count
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((row, index) => (
								<TableRow
									key={row.id}
									className={cn(
										"hover:bg-muted/30",
										index % 2 === 1 && "bg-muted/20"
									)}
								>
									<TableCell className="px-2 py-2 pl-3 font-mono text-[10px]">
										{row.inboundFileName}
									</TableCell>
									<TableCell className="px-2 py-2">
										<div className="space-y-0.5">
											{(row.issuers ?? (row.issuer ? [row.issuer] : [])).map(
												(name) => (
													<p key={name} className="leading-tight">
														{name}
													</p>
												)
											)}
										</div>
									</TableCell>
									<TableCell className="px-2 py-2">
										<StatusText status={row.status} />
									</TableCell>
									<TableCell className="px-2 py-2 tabular-nums">
										{row.submittedDateDisplay}
									</TableCell>
									<TableCell className="px-2 py-2 pr-3 text-right tabular-nums">
										{formatCount(row.recordCount)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
					<span>
						Page {safePage} of {pageCount}
					</span>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value));
								setPage(1);
							}}
						>
							<SelectTrigger className="h-8 w-[88px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="25">25</SelectItem>
								<SelectItem value="50">50</SelectItem>
							</SelectContent>
						</Select>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={safePage <= 1}
								onClick={() => setPage(1)}
							>
								<ChevronsLeft className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={safePage <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								<ChevronLeft className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={safePage >= pageCount}
								onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
							>
								<ChevronRight className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={safePage >= pageCount}
								onClick={() => setPage(pageCount)}
							>
								<ChevronsRight className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function TrackIssuerHhsPanel({
	mode,
	rows,
}: {
	mode: "issuer" | "hhs";
	rows: TrackedFileRow[];
}) {
	const [draft, setDraft] = useState<TrackFileFilters>(EMPTY_FILTERS);
	const [applied, setApplied] = useState<TrackFileFilters | null>(null);
	const [searchAttempted, setSearchAttempted] = useState(false);

	const fileTypeOptions =
		mode === "issuer" ? ISSUER_FILE_TYPES : HHS_FILE_TYPES;
	const statusOptions =
		mode === "issuer" ? ISSUER_STATUS_OPTIONS : HHS_STATUS_OPTIONS;

	const filteredRows = useMemo(
		() => (applied ? filterIssuerHhsFiles(rows, applied) : []),
		[applied, rows]
	);

	const searched = searchAttempted && applied !== null;
	const showTable = searched && filteredRows.length > 0;

	function handleSearch() {
		setApplied({ ...draft });
		setSearchAttempted(true);
	}

	let emptyVariant: "idle" | "empty" = "idle";
	if (searched && filteredRows.length === 0) {
		emptyVariant = "empty";
	}

	return (
		<div className="space-y-4">
			<IssuerHhsFilterPanel
				filters={draft}
				onChange={setDraft}
				onSearch={handleSearch}
				fileTypeOptions={fileTypeOptions}
				statusOptions={statusOptions}
			/>

			{showTable ? (
				<IssuerHhsResultsTable rows={filteredRows} />
			) : (
				<div className="rounded-xl border border-border/60 bg-card">
					<NoFileSelectedIllustration variant={emptyVariant} />
				</div>
			)}
		</div>
	);
}
