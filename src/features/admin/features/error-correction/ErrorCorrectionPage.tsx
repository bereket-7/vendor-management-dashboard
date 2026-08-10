"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	ERROR_CORRECTION_ENROLLEE_TYPES,
	ERROR_CORRECTION_ENROLLMENT_YEARS,
	ERROR_CORRECTION_FILE_TYPES,
	ERROR_CORRECTION_ISSUER_NAMES,
	ERROR_CORRECTION_PROCESS_TYPES,
	MOCK_ERROR_REVIEW_ROWS,
	MOCK_ERROR_SUMMARY_ROWS,
	filterErrorSummaryRows,
	type ErrorSummaryFilters,
} from "@/features/admin/features/error-correction/mock-data";
import { cn } from "@/lib/utils";

const TAB_TRIGGER_CLASS = cn(
	"rounded-md px-3 py-1.5 text-[11px] font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-primary",
	"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
);

function RequiredLabel({ children }: { children: ReactNode }) {
	return (
		<span className="text-xs font-semibold">
			{children}
			<span className="text-red-600">*</span>
		</span>
	);
}

function LegacyFormRow({
	label,
	children,
}: {
	label: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="grid grid-cols-[160px_1fr] border-b border-border/60 last:border-b-0">
			<div className="flex items-center bg-muted/50 px-3 py-2 text-xs font-medium">
				{label}
			</div>
			<div className="flex items-center bg-card px-3 py-2">{children}</div>
		</div>
	);
}

const EMPTY_ERROR_SUMMARY_FILTERS: ErrorSummaryFilters = {
	fileType: "Enrollment",
	processType: "all",
	enrollmentYear: "all",
	issuerName: "ALL",
	enrolleeType: "all",
};

function ErrorSummaryPanel() {
	const [draft, setDraft] = useState<ErrorSummaryFilters>(EMPTY_ERROR_SUMMARY_FILTERS);
	const [applied, setApplied] = useState<ErrorSummaryFilters | null>(null);
	const [searched, setSearched] = useState(false);

	const filteredRows = useMemo(
		() =>
			applied
				? filterErrorSummaryRows(MOCK_ERROR_SUMMARY_ROWS, applied)
				: [],
		[applied]
	);

	const canSearch =
		draft.fileType !== "all" &&
		draft.processType !== "all" &&
		Boolean(draft.issuerName);

	return (
		<div className="overflow-hidden rounded-xl border border-border/70">
			<div className="border-b border-amber-200/80 bg-amber-50/80 px-4 py-2 text-sm font-semibold">
				Error Summary
			</div>

			<div className="border-b border-border/60 bg-muted/20 p-4">
				<div className="overflow-hidden rounded-lg border border-border/70">
					<div className="grid lg:grid-cols-2">
						<div>
							<LegacyFormRow
								label={<RequiredLabel>File Type</RequiredLabel>}
							>
								<Select
									value={draft.fileType}
									onValueChange={(value) =>
										setDraft({ ...draft, fileType: value })
									}
								>
									<SelectTrigger className="h-9 w-full max-w-md bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										{ERROR_CORRECTION_FILE_TYPES.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</LegacyFormRow>
							<LegacyFormRow
								label={<RequiredLabel>Process Type</RequiredLabel>}
							>
								<Select
									value={draft.processType}
									onValueChange={(value) =>
										setDraft({ ...draft, processType: value })
									}
								>
									<SelectTrigger className="h-9 w-full max-w-md bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select</SelectItem>
										{ERROR_CORRECTION_PROCESS_TYPES.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</LegacyFormRow>
							<LegacyFormRow label="Enrollment Year">
								<Select
									value={draft.enrollmentYear}
									onValueChange={(value) =>
										setDraft({ ...draft, enrollmentYear: value })
									}
								>
									<SelectTrigger className="h-9 w-full max-w-md bg-card">
										<SelectValue placeholder="Select Year" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select Year</SelectItem>
										{ERROR_CORRECTION_ENROLLMENT_YEARS.map((year) => (
											<SelectItem key={year} value={year}>
												{year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</LegacyFormRow>
						</div>
						<div className="border-t border-border/60 lg:border-t-0 lg:border-l">
							<LegacyFormRow
								label={<RequiredLabel>Issuer Name</RequiredLabel>}
							>
								<Select
									value={draft.issuerName}
									onValueChange={(value) =>
										setDraft({ ...draft, issuerName: value })
									}
								>
									<SelectTrigger className="h-9 w-full max-w-md bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										{ERROR_CORRECTION_ISSUER_NAMES.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</LegacyFormRow>
							<LegacyFormRow label="Enrollee Type">
								<Select
									value={draft.enrolleeType}
									onValueChange={(value) =>
										setDraft({ ...draft, enrolleeType: value })
									}
								>
									<SelectTrigger className="h-9 w-full max-w-md bg-card">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Select</SelectItem>
										{ERROR_CORRECTION_ENROLLEE_TYPES.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</LegacyFormRow>
						</div>
					</div>
				</div>

				<div className="mt-4 flex justify-end">
					<Button
						size="sm"
						className="min-w-24"
						disabled={!canSearch}
						onClick={() => {
							setApplied({ ...draft });
							setSearched(true);
						}}
					>
						Search
					</Button>
				</div>
			</div>

			<div className="p-4">
				{searched && filteredRows.length > 0 ? (
					<Card className="min-w-0 bg-card">
						<CardHeader className="px-3 pb-1 pt-3">
							<CardTitle className="text-sm font-medium">
								Error Summary Results
							</CardTitle>
						</CardHeader>
						<CardContent className="px-0 pb-0">
							<div className="w-full overflow-x-auto border-t border-border/50">
								<Table className="w-full min-w-[980px] text-xs">
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-8 px-2 pl-3 font-normal">
												Error Code
											</TableHead>
											<TableHead className="h-8 px-2 font-normal">
												Description
											</TableHead>
											<TableHead className="h-8 px-2 font-normal">
												File Name
											</TableHead>
											<TableHead className="h-8 px-2 font-normal">
												Enrollee ID
											</TableHead>
											<TableHead className="h-8 px-2 font-normal">
												Process Type
											</TableHead>
											<TableHead className="h-8 px-2 pr-3 font-normal">
												Status
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredRows.map((row) => (
											<TableRow key={row.id} className="hover:bg-muted/30">
												<TableCell className="px-2 py-1.5 pl-3 font-mono text-[11px]">
													{row.errorCode}
												</TableCell>
												<TableCell className="px-2 py-1.5">
													{row.errorDescription}
												</TableCell>
												<TableCell className="px-2 py-1.5 font-mono text-[11px]">
													{row.fileName}
												</TableCell>
												<TableCell className="px-2 py-1.5 tabular-nums">
													{row.enrolleeId}
												</TableCell>
												<TableCell className="px-2 py-1.5">
													{row.processType}
												</TableCell>
												<TableCell className="px-2 py-1.5 pr-3">
													<span
														className={cn(
															"font-semibold",
															row.status === "Open"
																? "text-red-600"
																: "text-emerald-600"
														)}
													>
														{row.status}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				) : (
					<div className="rounded-xl border border-border/60 bg-card">
						<NoFileSelectedIllustration
							variant={searched ? "empty" : "idle"}
							title={
								searched
									? undefined
									: "No error summary search applied"
							}
							description={
								searched
									? undefined
									: "Select file type, process type, and issuer name, then click Search."
							}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function ErrorReviewPanel() {
	return (
		<div className="overflow-hidden rounded-xl border border-border/70">
			<div className="border-b border-amber-200/80 bg-amber-50/80 px-4 py-2 text-sm font-semibold">
				Error Review
			</div>

			<div className="p-4">
				<Card className="min-w-0 bg-card">
					<CardHeader className="px-3 pb-1 pt-3">
						<CardTitle className="text-sm font-medium">
							Assigned Error Review Queue
						</CardTitle>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="w-full overflow-x-auto border-t border-border/50">
							<Table className="w-full min-w-[980px] text-xs">
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-8 px-2 pl-3 font-normal">
											Error Code
										</TableHead>
										<TableHead className="h-8 px-2 font-normal">
											Description
										</TableHead>
										<TableHead className="h-8 px-2 font-normal">
											Issuer Name
										</TableHead>
										<TableHead className="h-8 px-2 font-normal">
											File Type
										</TableHead>
										<TableHead className="h-8 px-2 font-normal">
											Assigned To
										</TableHead>
										<TableHead className="h-8 px-2 font-normal">
											Priority
										</TableHead>
										<TableHead className="h-8 px-2 pr-3 font-normal">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{MOCK_ERROR_REVIEW_ROWS.map((row) => (
										<TableRow key={row.id} className="hover:bg-muted/30">
											<TableCell className="px-2 py-1.5 pl-3 font-mono text-[11px]">
												{row.errorCode}
											</TableCell>
											<TableCell className="px-2 py-1.5">
												{row.description}
											</TableCell>
											<TableCell className="px-2 py-1.5">
												{row.issuerName}
											</TableCell>
											<TableCell className="px-2 py-1.5">
												{row.fileType}
											</TableCell>
											<TableCell className="px-2 py-1.5">
												{row.assignedTo}
											</TableCell>
											<TableCell className="px-2 py-1.5">
												{row.priority}
											</TableCell>
											<TableCell className="px-2 py-1.5 pr-3">
												<span
													className={cn(
														"font-semibold",
														row.status === "Resolved"
															? "text-emerald-600"
															: row.status === "In Review"
																? "text-amber-700"
																: "text-red-600"
													)}
												>
													{row.status}
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export function ErrorCorrectionPage() {
	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Error Correction"
				description="Search enrollment errors and review assigned correction work items."
			/>

			<Tabs defaultValue="error-summary" className="gap-4">
				<div className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
					<div className="border-b border-primary/15 px-4 pt-3">
						<TabsList className="inline-flex h-auto gap-1 rounded-lg bg-muted/40 p-1">
							<TabsTrigger value="error-summary" className={TAB_TRIGGER_CLASS}>
								Error Summary
							</TabsTrigger>
							<TabsTrigger value="error-review" className={TAB_TRIGGER_CLASS}>
								Error Review
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="p-4">
						<TabsContent value="error-summary" className="mt-0">
							<ErrorSummaryPanel />
						</TabsContent>
						<TabsContent value="error-review" className="mt-0">
							<ErrorReviewPanel />
						</TabsContent>
					</div>
				</div>
			</Tabs>
		</div>
	);
}
