"use client";

import { useMemo, useState } from "react";

import { Search } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import { NoFileSelectedIllustration } from "@/features/admin/features/claim-encounter/file-management/NoFileSelectedIllustration";
import { TrackIssuerHhsPanel } from "@/features/admin/features/claim-encounter/file-management/TrackIssuerHhsPanel";
import {
	SOURCE_FILE_TYPES,
	filterTrackedFiles,
	hasSourceSearch,
	mockHhsFiles,
	mockIssuerFiles,
	mockSourceFiles,
	type TrackedFileRow,
} from "@/features/admin/features/claim-encounter/file-management/mock-data";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { cn } from "@/lib/utils";

function SourceFilterBar({
	fileType,
	onFileTypeChange,
	submittedFrom,
	submittedTo,
	onSubmittedFromChange,
	onSubmittedToChange,
	fileName,
	onFileNameChange,
}: {
	fileType: string;
	onFileTypeChange: (value: string) => void;
	submittedFrom: string;
	submittedTo: string;
	onSubmittedFromChange: (value: string) => void;
	onSubmittedToChange: (value: string) => void;
	fileName: string;
	onFileNameChange: (value: string) => void;
}) {
	return (
		<div className="flex flex-wrap items-end gap-4 rounded-xl border border-sky-200/70 bg-sky-50/50 px-4 py-3">
			<div className="min-w-[260px] flex-1 space-y-1">
				<label className="text-xs font-semibold text-primary">
					Inbound File Name
				</label>
				<div className="relative">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-primary/70" />
					<Input
						value={fileName}
						onChange={(e) => onFileNameChange(e.target.value)}
						placeholder="Search file name…"
						className="h-9 border-sky-200 bg-card pl-8"
					/>
				</div>
			</div>

			<div className="space-y-1">
				<label className="text-xs font-semibold text-primary">File Type</label>
				<Select value={fileType} onValueChange={onFileTypeChange}>
					<SelectTrigger className="h-9 w-[190px] border-sky-200 bg-card">
						<SelectValue placeholder="Select" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All types</SelectItem>
						{SOURCE_FILE_TYPES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<label className="text-xs font-semibold text-primary">
					Submitted Date
				</label>
				<div className="flex items-center gap-2">
					<Input
						type="date"
						value={submittedFrom}
						onChange={(e) => onSubmittedFromChange(e.target.value)}
						className="h-9 w-[150px] border-sky-200 bg-card"
					/>
					<span className="text-sm font-medium text-primary/70">–</span>
					<Input
						type="date"
						value={submittedTo}
						onChange={(e) => onSubmittedToChange(e.target.value)}
						className="h-9 w-[150px] border-sky-200 bg-card"
					/>
				</div>
			</div>
		</div>
	);
}

function SourceFileTable({ rows }: { rows: TrackedFileRow[] }) {
	return (
		<Card className="min-w-0 bg-card">
			<CardHeader className="flex flex-row items-center justify-between px-3 pb-1 pt-3">
				<CardTitle className="text-sm font-medium">File List</CardTitle>
				<span className="text-xs text-muted-foreground">
					{formatCount(rows.length)} file{rows.length === 1 ? "" : "s"}
				</span>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="w-full overflow-x-auto border-t border-border/50">
					<Table className="w-full min-w-[920px] text-xs">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-8 px-2 pl-3 font-normal">
									Inbound File Name
								</TableHead>
								<TableHead className="h-8 px-2 font-normal">File Type</TableHead>
								<TableHead className="h-8 px-2 font-normal">Issuer</TableHead>
								<TableHead className="h-8 px-2 font-normal">
									Submitted Date
								</TableHead>
								<TableHead className="h-8 px-2 text-right font-normal">
									Records
								</TableHead>
								<TableHead className="h-8 px-2 pr-3 font-normal">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-muted/30">
									<TableCell className="px-2 py-1.5 pl-3 font-mono text-[10px] text-muted-foreground">
										{row.inboundFileName}
									</TableCell>
									<TableCell className="px-2 py-1.5">{row.fileType}</TableCell>
									<TableCell className="px-2 py-1.5 font-medium">
										{row.issuer}
									</TableCell>
									<TableCell className="px-2 py-1.5 tabular-nums">
										{row.submittedDateDisplay}
									</TableCell>
									<TableCell className="px-2 py-1.5 text-right tabular-nums">
										{formatCount(row.recordCount)}
									</TableCell>
									<TableCell className="px-2 py-1.5 pr-3">
										<StatusBadge status={row.status} />
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

function TrackSourcePanel({ rows }: { rows: TrackedFileRow[] }) {
	const [fileType, setFileType] = useState("all");
	const [submittedFrom, setSubmittedFrom] = useState("");
	const [submittedTo, setSubmittedTo] = useState("");
	const [fileName, setFileName] = useState("");

	const filters = useMemo(
		() => ({ fileType, submittedFrom, submittedTo, fileName }),
		[fileType, submittedFrom, submittedTo, fileName]
	);

	const filteredRows = useMemo(
		() => filterTrackedFiles(rows, filters),
		[rows, filters]
	);

	const searched = hasSourceSearch(filters);
	const showTable = searched && filteredRows.length > 0;

	return (
		<div className="space-y-4">
			<SourceFilterBar
				fileType={fileType}
				onFileTypeChange={setFileType}
				submittedFrom={submittedFrom}
				submittedTo={submittedTo}
				onSubmittedFromChange={setSubmittedFrom}
				onSubmittedToChange={setSubmittedTo}
				fileName={fileName}
				onFileNameChange={setFileName}
			/>

			{showTable ? (
				<SourceFileTable rows={filteredRows} />
			) : (
				<div className="rounded-xl border border-border/60 bg-card">
					<NoFileSelectedIllustration variant={searched ? "empty" : "idle"} />
				</div>
			)}
		</div>
	);
}

const TAB_TRIGGER_CLASS = cn(
	"rounded-md px-4 py-2 text-xs font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-primary",
	"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
);

export function FileManagementPage() {
	const sourceRows = useMemo(() => mockSourceFiles(), []);
	const issuerRows = useMemo(() => mockIssuerFiles(), []);
	const hhsRows = useMemo(() => mockHhsFiles(), []);

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="File Management"
				description="Track source, issuer, and HHS file submissions with inbound status and validation outcomes."
			/>

			<Tabs defaultValue="source" className="gap-4">
				<div className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
					<div className="border-b border-primary/15 px-4 pt-3">
						<TabsList className="inline-flex h-auto w-fit gap-1 rounded-lg bg-muted/40 p-1">
							<TabsTrigger value="source" className={TAB_TRIGGER_CLASS}>
								Track Source Files
							</TabsTrigger>
							<TabsTrigger value="issuer" className={TAB_TRIGGER_CLASS}>
								Track Issuer Files
							</TabsTrigger>
							<TabsTrigger value="hhs" className={TAB_TRIGGER_CLASS}>
								Track HHS Files
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="p-4">
						<TabsContent value="source" className="mt-0">
							<TrackSourcePanel rows={sourceRows} />
						</TabsContent>

						<TabsContent value="issuer" className="mt-0">
							<TrackIssuerHhsPanel mode="issuer" rows={issuerRows} />
						</TabsContent>

						<TabsContent value="hhs" className="mt-0">
							<TrackIssuerHhsPanel mode="hhs" rows={hhsRows} />
						</TabsContent>
					</div>
				</div>
			</Tabs>
		</div>
	);
}
