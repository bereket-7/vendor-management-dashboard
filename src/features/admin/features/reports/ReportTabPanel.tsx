"use client";

import { useMemo, useState, type ReactNode } from "react";

import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { NoFileSelectedIllustration } from "@/features/admin/features/claim-encounter/file-management/NoFileSelectedIllustration";
import {
	DEFAULT_ENROLLMENT_FILTERS,
	REPORT_CLAIM_TYPES,
	REPORT_ENROLLEE_STATUS_OPTIONS,
	REPORT_ERROR_FILE_TYPES,
	REPORT_ERROR_PROCESS_OPTIONS,
	REPORT_FILE_STATUS_OPTIONS,
	REPORT_ISSUER_ID_OPTIONS,
	REPORT_ISSUER_OPTIONS,
	REPORT_PROCESS_OPTIONS,
	filterClaimSearchRows,
	filterEnrollmentReportRows,
	filterEnrolleeSearchRows,
	filterErrorSummaryRows,
	getReportTabLayout,
	mockClaimSearchRows,
	mockEnrollmentReportRows,
	mockEnrolleeSearchRows,
	mockErrorSummaryRows,
	type ClaimSearchFilters,
	type ClaimSearchRow,
	type EnrollmentReportFilters,
	type EnrollmentReportRow,
	type EnrolleeSearchFilters,
	type EnrolleeSearchRow,
	type ErrorSummaryFilters,
	type ErrorSummaryRow,
	type ReportTabId,
} from "@/features/admin/features/reports/mock-data";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { cn } from "@/lib/utils";

function RequiredLabel({ children }: { children: ReactNode }) {
	return (
		<label className="text-xs font-semibold text-foreground">
			{children}
			<span className="text-red-600">*</span>
		</label>
	);
}

function FilterShell({
	children,
	onSearch,
}: {
	children: ReactNode;
	onSearch: () => void;
}) {
	return (
		<div className="rounded-xl border border-border/70 bg-muted/45 p-4">
			{children}
			<div className="mt-4 flex justify-end">
				<Button size="sm" className="min-w-24" onClick={onSearch}>
					Search
				</Button>
			</div>
		</div>
	);
}

function StatusText({ status }: { status: string }) {
	if (/completed|accepted|resolved/i.test(status)) {
		return <span className="font-semibold text-emerald-600">{status}</span>;
	}
	if (/fail|reject|denied|open/i.test(status)) {
		return <span className="font-semibold text-red-600">{status}</span>;
	}
	return <span className="font-semibold text-amber-700">{status}</span>;
}

function EnrollmentFilterPanel({
	filters,
	onChange,
	onSearch,
}: {
	filters: EnrollmentReportFilters;
	onChange: (next: EnrollmentReportFilters) => void;
	onSearch: () => void;
}) {
	return (
		<FilterShell onSearch={onSearch}>
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-3">
					<div className="space-y-1">
						<RequiredLabel>Issuer Name</RequiredLabel>
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
								{REPORT_ISSUER_OPTIONS.map((name) => (
									<SelectItem key={name} value={name === "All" ? "all" : name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<RequiredLabel>Process</RequiredLabel>
						<Select
							value={filters.process}
							onValueChange={(value) => onChange({ ...filters, process: value })}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{REPORT_PROCESS_OPTIONS.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							Enrollee Status
						</label>
						<Select
							value={filters.enrolleeStatus}
							onValueChange={(value) =>
								onChange({ ...filters, enrolleeStatus: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_ENROLLEE_STATUS_OPTIONS.map((option) => (
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
							value={filters.inboundFileName}
							onChange={(e) =>
								onChange({ ...filters, inboundFileName: e.target.value })
							}
							className="h-9 bg-card"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							File Status
						</label>
						<Select
							value={filters.fileStatus}
							onValueChange={(value) =>
								onChange({ ...filters, fileStatus: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_FILE_STATUS_OPTIONS.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
		</FilterShell>
	);
}

function EnrolleeSearchFilterPanel({
	filters,
	onChange,
	onSearch,
}: {
	filters: EnrolleeSearchFilters;
	onChange: (next: EnrolleeSearchFilters) => void;
	onSearch: () => void;
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-border/70">
			<div className="border-b border-border/60 bg-muted/60 px-4 py-2 text-sm font-semibold">
				Enrollee Analysis
			</div>
			<div className="bg-muted/45 p-4">
				<div className="flex flex-wrap items-end gap-4">
					<div className="min-w-[220px] flex-1 space-y-1">
						<RequiredLabel>Enrollee ID</RequiredLabel>
						<Input
							value={filters.enrolleeId}
							onChange={(e) =>
								onChange({ ...filters, enrolleeId: e.target.value })
							}
							className="h-9 bg-card"
						/>
					</div>
					<div className="min-w-[220px] space-y-1">
						<RequiredLabel>Issuer Name</RequiredLabel>
						<Select
							value={filters.issuerName}
							onValueChange={(value) =>
								onChange({ ...filters, issuerName: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_ISSUER_OPTIONS.filter((n) => n !== "All").map((name) => (
									<SelectItem key={name} value={name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button size="sm" className="min-w-24" onClick={onSearch}>
						Search
					</Button>
				</div>
			</div>
		</div>
	);
}

function ClaimSearchFilterPanel({
	filters,
	onChange,
	onSearch,
}: {
	filters: ClaimSearchFilters;
	onChange: (next: ClaimSearchFilters) => void;
	onSearch: () => void;
}) {
	return (
		<FilterShell onSearch={onSearch}>
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-3">
					<div className="space-y-1">
						<RequiredLabel>Claim Type</RequiredLabel>
						<Select
							value={filters.claimType}
							onValueChange={(value) =>
								onChange({ ...filters, claimType: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_CLAIM_TYPES.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<RequiredLabel>IssuerID</RequiredLabel>
						<Select
							value={filters.issuerId}
							onValueChange={(value) =>
								onChange({ ...filters, issuerId: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_ISSUER_ID_OPTIONS.map((id) => (
									<SelectItem key={id} value={id}>
										{id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="space-y-3">
					<div className="space-y-2">
						<RequiredLabel>Field Type</RequiredLabel>
						<RadioGroup
							value={filters.fieldType}
							onValueChange={(value) =>
								onChange({
									...filters,
									fieldType: value as ClaimSearchFilters["fieldType"],
								})
							}
							className="flex flex-wrap gap-4"
						>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="claim-id" id="field-claim-id" />
								<Label htmlFor="field-claim-id" className="text-sm font-normal">
									ClaimID
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="enrollee-id" id="field-enrollee-id" />
								<Label htmlFor="field-enrollee-id" className="text-sm font-normal">
									EnrolleeID
								</Label>
							</div>
						</RadioGroup>
					</div>
					<div className="space-y-1">
						<RequiredLabel>Field Value</RequiredLabel>
						<Input
							value={filters.fieldValue}
							onChange={(e) =>
								onChange({ ...filters, fieldValue: e.target.value })
							}
							className="h-9 bg-card"
						/>
					</div>
				</div>
			</div>
		</FilterShell>
	);
}

function ErrorSummaryFilterPanel({
	filters,
	onChange,
	onSearch,
}: {
	filters: ErrorSummaryFilters;
	onChange: (next: ErrorSummaryFilters) => void;
	onSearch: () => void;
}) {
	return (
		<FilterShell onSearch={onSearch}>
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-3">
					<div className="space-y-1">
						<RequiredLabel>Issuer ID</RequiredLabel>
						<Select
							value={filters.issuerId}
							onValueChange={(value) =>
								onChange({ ...filters, issuerId: value })
							}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_ISSUER_ID_OPTIONS.map((id) => (
									<SelectItem key={id} value={id}>
										{id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<RequiredLabel>Process</RequiredLabel>
						<Select
							value={filters.process}
							onValueChange={(value) => onChange({ ...filters, process: value })}
						>
							<SelectTrigger className="h-9 bg-card">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Select</SelectItem>
								{REPORT_ERROR_PROCESS_OPTIONS.map((option) => (
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
						<RequiredLabel>File Type</RequiredLabel>
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
								{REPORT_ERROR_FILE_TYPES.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</FilterShell>
	);
}

function ResultsToolbar({
	page,
	pageCount,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: {
	page: number;
	pageCount: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}) {
	const safePage = Math.min(page, pageCount);
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-3 py-2 text-xs text-muted-foreground">
			<span>
				Page {safePage} of {pageCount}
			</span>
			<div className="flex flex-wrap items-center gap-2">
				<Button variant="ghost" size="sm" className="h-8 px-2">
					Find
				</Button>
				<span className="text-muted-foreground">|</span>
				<Button variant="ghost" size="sm" className="h-8 px-2">
					Next
				</Button>
				<Button variant="ghost" size="icon" className="size-8">
					<RefreshCw className="size-3.5" />
				</Button>
				<Button variant="ghost" size="icon" className="size-8">
					<Download className="size-3.5" />
				</Button>
				<Select
					value={String(pageSize)}
					onValueChange={(value) => onPageSizeChange(Number(value))}
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
						onClick={() => onPageChange(1)}
					>
						<ChevronsLeft className="size-3.5" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						disabled={safePage <= 1}
						onClick={() => onPageChange(Math.max(1, safePage - 1))}
					>
						<ChevronLeft className="size-3.5" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						disabled={safePage >= pageCount}
						onClick={() => onPageChange(Math.min(pageCount, safePage + 1))}
					>
						<ChevronRight className="size-3.5" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						disabled={safePage >= pageCount}
						onClick={() => onPageChange(pageCount)}
					>
						<ChevronsRight className="size-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function EnrollmentResultsTable({ rows }: { rows: EnrollmentReportRow[] }) {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

	return (
		<Card className="min-w-0 bg-card">
			<ResultsToolbar
				page={safePage}
				pageCount={pageCount}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={(size) => {
					setPageSize(size);
					setPage(1);
				}}
			/>
			<CardContent className="px-0 pb-0">
				<div className="w-full overflow-x-auto">
					<Table className="w-full min-w-[1180px] text-xs">
						<TableHeader>
							<TableRow className="bg-muted/70 hover:bg-muted/70">
								<TableHead className="h-8 px-2 pl-3 font-semibold">File Name</TableHead>
								<TableHead className="h-8 px-2 font-semibold">Payer</TableHead>
								<TableHead className="h-8 px-2 font-semibold">Received Date</TableHead>
								<TableHead className="h-8 px-2 font-semibold">Executed Date</TableHead>
								<TableHead className="h-8 px-2 font-semibold">Status</TableHead>
								<TableHead className="h-8 px-2 font-semibold">
									Accepted Report File name
								</TableHead>
								<TableHead className="h-8 px-2 font-semibold">Accepted Count</TableHead>
								<TableHead className="h-8 px-2 pr-3 font-semibold">
									Rejected Report File Count
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((row, index) => (
								<TableRow
									key={row.id}
									className={cn(index % 2 === 1 && "bg-muted/20", "hover:bg-muted/30")}
								>
									<TableCell className="px-2 py-2 pl-3 font-mono text-[10px]">
										{row.fileName}
									</TableCell>
									<TableCell className="px-2 py-2">{row.payer}</TableCell>
									<TableCell className="px-2 py-2 tabular-nums">
										{row.receivedDateDisplay}
									</TableCell>
									<TableCell className="px-2 py-2 tabular-nums">
										{row.executedDateDisplay}
									</TableCell>
									<TableCell className="px-2 py-2">
										<StatusText status={row.status} />
									</TableCell>
									<TableCell className="px-2 py-2 font-mono text-[10px]">
										{row.acceptedReportFileName}
									</TableCell>
									<TableCell className="px-2 py-2 tabular-nums">
										{formatCount(row.acceptedCount)}
									</TableCell>
									<TableCell className="px-2 py-2 pr-3 tabular-nums">
										{formatCount(row.rejectedCount)}
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

function EnrolleeResultsTable({ rows }: { rows: EnrolleeSearchRow[] }) {
	return (
		<Card className="min-w-0 bg-card">
			<CardHeader className="px-3 pb-1 pt-3">
				<CardTitle className="text-sm font-medium">Enrollee Analysis Results</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="overflow-x-auto border-t border-border/50">
					<Table className="min-w-[760px] text-xs">
						<TableHeader>
							<TableRow className="bg-muted/70 hover:bg-muted/70">
								<TableHead className="h-8 pl-3 font-semibold">Enrollee ID</TableHead>
								<TableHead className="h-8 font-semibold">Issuer Name</TableHead>
								<TableHead className="h-8 font-semibold">Status</TableHead>
								<TableHead className="h-8 font-semibold">Effective Date</TableHead>
								<TableHead className="h-8 pr-3 font-semibold">Term Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow
									key={row.id}
									className={cn(index % 2 === 1 && "bg-muted/20", "hover:bg-muted/30")}
								>
									<TableCell className="pl-3 font-mono">{row.enrolleeId}</TableCell>
									<TableCell>{row.issuerName}</TableCell>
									<TableCell>{row.status}</TableCell>
									<TableCell>{row.effectiveDate}</TableCell>
									<TableCell className="pr-3">{row.termDate}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

function ClaimResultsTable({ rows }: { rows: ClaimSearchRow[] }) {
	return (
		<Card className="min-w-0 bg-card">
			<CardHeader className="px-3 pb-1 pt-3">
				<CardTitle className="text-sm font-medium">Claim Search Results</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="overflow-x-auto border-t border-border/50">
					<Table className="min-w-[860px] text-xs">
						<TableHeader>
							<TableRow className="bg-muted/70 hover:bg-muted/70">
								<TableHead className="h-8 pl-3 font-semibold">Claim ID</TableHead>
								<TableHead className="h-8 font-semibold">Enrollee ID</TableHead>
								<TableHead className="h-8 font-semibold">Claim Type</TableHead>
								<TableHead className="h-8 font-semibold">IssuerID</TableHead>
								<TableHead className="h-8 font-semibold">Status</TableHead>
								<TableHead className="h-8 pr-3 font-semibold">Service Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow
									key={row.id}
									className={cn(index % 2 === 1 && "bg-muted/20", "hover:bg-muted/30")}
								>
									<TableCell className="pl-3 font-mono">{row.claimId}</TableCell>
									<TableCell className="font-mono">{row.enrolleeId}</TableCell>
									<TableCell>{row.claimType}</TableCell>
									<TableCell>{row.issuerId}</TableCell>
									<TableCell>
										<StatusText status={row.status} />
									</TableCell>
									<TableCell className="pr-3">{row.serviceDate}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

function ErrorSummaryResultsTable({ rows }: { rows: ErrorSummaryRow[] }) {
	return (
		<Card className="min-w-0 bg-card">
			<CardHeader className="px-3 pb-1 pt-3">
				<CardTitle className="text-sm font-medium">Error Summary Results</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="overflow-x-auto border-t border-border/50">
					<Table className="min-w-[920px] text-xs">
						<TableHeader>
							<TableRow className="bg-muted/70 hover:bg-muted/70">
								<TableHead className="h-8 pl-3 font-semibold">File Name</TableHead>
								<TableHead className="h-8 font-semibold">Issuer ID</TableHead>
								<TableHead className="h-8 font-semibold">File Type</TableHead>
								<TableHead className="h-8 font-semibold">Process</TableHead>
								<TableHead className="h-8 font-semibold">Error Count</TableHead>
								<TableHead className="h-8 pr-3 font-semibold">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow
									key={row.id}
									className={cn(index % 2 === 1 && "bg-muted/20", "hover:bg-muted/30")}
								>
									<TableCell className="pl-3 font-mono text-[10px]">
										{row.fileName}
									</TableCell>
									<TableCell>{row.issuerId}</TableCell>
									<TableCell>{row.fileType}</TableCell>
									<TableCell>{row.process}</TableCell>
									<TableCell>{formatCount(row.errorCount)}</TableCell>
									<TableCell className="pr-3">
										<StatusText status={row.status} />
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

function EmptyResults({
	searched,
}: {
	searched: boolean;
}) {
	return (
		<div className="rounded-xl border border-border/60 bg-card">
			<NoFileSelectedIllustration
				variant={searched ? "empty" : "idle"}
				title={searched ? undefined : "No report selected"}
				description={
					searched
						? undefined
						: "Set the required filters for this report, then click Search."
				}
			/>
		</div>
	);
}

function EnrollmentReportPanel({ tabId }: { tabId: ReportTabId }) {
	const rows = useMemo(() => mockEnrollmentReportRows(tabId), [tabId]);
	const [draft, setDraft] = useState<EnrollmentReportFilters>(DEFAULT_ENROLLMENT_FILTERS);
	const [applied, setApplied] = useState<EnrollmentReportFilters | null>(null);
	const [searched, setSearched] = useState(false);

	const filteredRows = useMemo(
		() => (applied ? filterEnrollmentReportRows(rows, applied) : []),
		[applied, rows]
	);

	return (
		<div className="space-y-4">
			<EnrollmentFilterPanel
				filters={draft}
				onChange={setDraft}
				onSearch={() => {
					setApplied({ ...draft });
					setSearched(true);
				}}
			/>
			{searched && filteredRows.length > 0 ? (
				<EnrollmentResultsTable rows={filteredRows} />
			) : (
				<EmptyResults searched={searched} />
			)}
		</div>
	);
}

function EnrolleeSearchReportPanel() {
	const rows = useMemo(() => mockEnrolleeSearchRows(), []);
	const [draft, setDraft] = useState<EnrolleeSearchFilters>({
		enrolleeId: "",
		issuerName: "all",
	});
	const [applied, setApplied] = useState<EnrolleeSearchFilters | null>(null);
	const [searched, setSearched] = useState(false);

	const filteredRows = useMemo(
		() => (applied ? filterEnrolleeSearchRows(rows, applied) : []),
		[applied, rows]
	);

	return (
		<div className="space-y-4">
			<EnrolleeSearchFilterPanel
				filters={draft}
				onChange={setDraft}
				onSearch={() => {
					setApplied({ ...draft });
					setSearched(true);
				}}
			/>
			{searched && filteredRows.length > 0 ? (
				<EnrolleeResultsTable rows={filteredRows} />
			) : (
				<EmptyResults searched={searched} />
			)}
		</div>
	);
}

function ClaimSearchReportPanel() {
	const rows = useMemo(() => mockClaimSearchRows(), []);
	const [draft, setDraft] = useState<ClaimSearchFilters>({
		claimType: "all",
		issuerId: "all",
		fieldType: "claim-id",
		fieldValue: "",
	});
	const [applied, setApplied] = useState<ClaimSearchFilters | null>(null);
	const [searched, setSearched] = useState(false);

	const filteredRows = useMemo(
		() => (applied ? filterClaimSearchRows(rows, applied) : []),
		[applied, rows]
	);

	return (
		<div className="space-y-4">
			<ClaimSearchFilterPanel
				filters={draft}
				onChange={setDraft}
				onSearch={() => {
					setApplied({ ...draft });
					setSearched(true);
				}}
			/>
			{searched && filteredRows.length > 0 ? (
				<ClaimResultsTable rows={filteredRows} />
			) : (
				<EmptyResults searched={searched} />
			)}
		</div>
	);
}

function ErrorSummaryReportPanel() {
	const rows = useMemo(() => mockErrorSummaryRows(), []);
	const [draft, setDraft] = useState<ErrorSummaryFilters>({
		issuerId: "all",
		process: "all",
		fileType: "all",
	});
	const [applied, setApplied] = useState<ErrorSummaryFilters | null>(null);
	const [searched, setSearched] = useState(false);

	const filteredRows = useMemo(
		() => (applied ? filterErrorSummaryRows(rows, applied) : []),
		[applied, rows]
	);

	return (
		<div className="space-y-4">
			<ErrorSummaryFilterPanel
				filters={draft}
				onChange={setDraft}
				onSearch={() => {
					setApplied({ ...draft });
					setSearched(true);
				}}
			/>
			{searched && filteredRows.length > 0 ? (
				<ErrorSummaryResultsTable rows={filteredRows} />
			) : (
				<EmptyResults searched={searched} />
			)}
		</div>
	);
}

export function ReportTabPanel({ tabId }: { tabId: ReportTabId }) {
	const layout = getReportTabLayout(tabId);

	switch (layout) {
		case "enrollee-search":
			return <EnrolleeSearchReportPanel />;
		case "claim-search":
			return <ClaimSearchReportPanel />;
		case "error-summary":
			return <ErrorSummaryReportPanel />;
		default:
			return <EnrollmentReportPanel tabId={tabId} />;
	}
}
