"use client";

import { useMemo, useState } from "react";

import {
	Download,
	FileSpreadsheet,
	FileText,
	FolderOpen,
	MoreVertical,
	Search,
	Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CMS_EDGE_STATUS_PILL_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureAsOfBar,
	MeasureDataTable,
	MeasureFilterField,
	MeasureKpiCard,
	MeasureSectionPanel,
	MeasureTablePagination,
	PanelLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasureDocumentsDetail } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";
import { cn } from "@/lib/utils";

const DOC_STATUS_STYLES: Record<string, string> = {
	Current:
		"border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
	Reference: "border-primary/30 bg-primary/10 text-primary",
	Submitted: "border-primary/40 bg-primary/15 text-primary",
	Archived: "border-border bg-muted text-muted-foreground",
};

function FileTypeIcon({ type }: { type: string }) {
	if (type === "XLSX" || type === "CSV") {
		return <FileSpreadsheet className="size-4 shrink-0 text-emerald-600" />;
	}
	return <FileText className="size-4 shrink-0 text-red-500" />;
}

export function MeasureDetailDocumentsTab({
	data,
}: {
	data: MeasureDocumentsDetail;
}) {
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("All");
	const [type, setType] = useState("All");
	const [status, setStatus] = useState("All");

	const filteredDocuments = useMemo(() => {
		const q = search.trim().toLowerCase();
		return data.documents.filter((doc) => {
			if (category !== "All" && doc.category !== category) return false;
			if (type !== "All" && doc.type !== type) return false;
			if (status !== "All" && doc.status !== status) return false;
			if (q && !doc.name.toLowerCase().includes(q)) return false;
			return true;
		});
	}, [data.documents, search, category, type, status]);

	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<MeasureKpiCard
					label="Total Documents"
					value={data.summary.totalDocuments}
					icon={FolderOpen}
					tone="primary"
				/>
				<MeasureKpiCard
					label="Specifications"
					value={data.summary.specifications}
				/>
				<MeasureKpiCard
					label="Technical Notes"
					value={data.summary.technicalNotes}
				/>
				<MeasureKpiCard
					label="Submission Files"
					value={data.summary.submissionFiles}
				/>
				<MeasureKpiCard
					label="Last Updated"
					value={data.summary.lastUpdated}
					hint="Most recent document change"
				/>
			</div>

			<MeasureAsOfBar asOf={data.summary.lastUpdated} />

			<div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
				<MeasureSectionPanel
					title="Filters"
					subtitle="Search and narrow the library"
					bodyClassName="space-y-2 p-0"
					action={
						<Button
							variant="link"
							size="sm"
							className="h-8 px-0 text-sm text-primary"
						>
							Clear All
						</Button>
					}
				>
					<MeasureFilterField label="Search">
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search documents"
								className="h-9 pl-9 text-sm"
							/>
						</div>
					</MeasureFilterField>
					<MeasureFilterField label="Category">
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{data.filterOptions.categories.map((o) => (
									<SelectItem key={o} value={o} className="text-sm">
										{o}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</MeasureFilterField>
					<MeasureFilterField label="Type">
						<Select value={type} onValueChange={setType}>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{data.filterOptions.types.map((o) => (
									<SelectItem key={o} value={o} className="text-sm">
										{o}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</MeasureFilterField>
					<MeasureFilterField label="Status">
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{data.filterOptions.statuses.map((o) => (
									<SelectItem key={o} value={o} className="text-sm">
										{o}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</MeasureFilterField>
					<Button className="mt-2 h-9 w-full text-sm">Apply Filters</Button>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title={`Document Library (${filteredDocuments.length})`}
					subtitle="Specifications, reports, and supporting files"
					action={
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 text-sm"
							>
								<Upload className="size-4" />
								Upload
							</Button>
							<PanelLink>Export List</PanelLink>
						</div>
					}
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "name", header: "Document Name" },
							{ key: "type", header: "Type", className: MEASURE_TABLE_MUTED },
							{ key: "category", header: "Category" },
							{
								key: "version",
								header: "Version",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "size", header: "Size", align: "right" },
							{
								key: "updated",
								header: "Updated",
								className: MEASURE_TABLE_MUTED,
							},
							{
								key: "by",
								header: "Updated By",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "status", header: "Status" },
							{ key: "actions", header: "Actions", align: "right" },
						]}
						rows={filteredDocuments.map((doc) => ({
							name: (
								<span className="inline-flex items-center gap-2">
									<FileTypeIcon type={doc.type} />
									<Button
										variant="link"
										className="h-auto p-0 text-sm text-primary"
									>
										{doc.name}
									</Button>
								</span>
							),
							type: doc.type,
							category: doc.category,
							version: doc.version,
							size: doc.size,
							updated: doc.updated,
							by: doc.updatedBy,
							status: (
								<span
									className={cn(
										CMS_EDGE_STATUS_PILL_CLASS,
										DOC_STATUS_STYLES[doc.status] ??
											"border-border bg-muted text-muted-foreground"
									)}
								>
									{doc.status}
								</span>
							),
							actions: (
								<div className="flex items-center justify-end gap-1">
									<Button variant="ghost" size="icon" className="size-8">
										<Download className="size-4" />
									</Button>
									<Button variant="ghost" size="icon" className="size-8">
										<MoreVertical className="size-4" />
									</Button>
								</div>
							),
						}))}
						getRowKey={(_, index) =>
							filteredDocuments[index]?.id ?? String(index)
						}
					/>
					<MeasureTablePagination
						shown={filteredDocuments.length}
						total={data.summary.totalDocuments}
					/>
				</MeasureSectionPanel>
			</div>
		</div>
	);
}
