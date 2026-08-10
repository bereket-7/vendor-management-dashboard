"use client";

import { useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ComplianceProgramPageConfig } from "@/features/admin/features/claim-encounter/compliance-program/config";
import type { ComplianceProgramRow } from "@/features/admin/features/claim-encounter/compliance-program/mock-data";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
	const tone =
		/accept|complete|active|on track|reconcil|paid|submitted|met|clean|ready|validated/i.test(
			status
		)
			? "border-emerald-200/80 bg-emerald-50 text-emerald-900"
			: /pending|review|draft|open|upcoming|due soon|in progress|suspected|gap|at risk|warning/i.test(
						status
					)
				? "border-amber-200/80 bg-amber-50 text-amber-950"
				: /reject|exception|overdue|denied|finding|late|cap alert|remediating/i.test(
							status
						)
					? "border-red-200/80 bg-red-50 text-red-900"
					: "border-slate-200/80 bg-slate-50 text-slate-800";

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
				tone
			)}
		>
			{status}
		</span>
	);
}

export function ComplianceQueueTable({
	config,
	rows,
	title,
}: {
	config: ComplianceProgramPageConfig;
	rows: ComplianceProgramRow[];
	title?: string;
}) {
	const [page, setPage] = useState(1);
	const pageSize = 8;

	useEffect(() => {
		setPage(1);
	}, [rows]);

	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = useMemo(
		() => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
		[rows, safePage, pageSize]
	);

	return (
		<Card className="gap-1 bg-card/70 py-2">
			<CardHeader className="px-3 pb-1 pt-0">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<CardTitle className="text-sm font-semibold">
						{title ?? `${config.rowNoun} queue`}
					</CardTitle>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>
							{rows.length === 0
								? "0"
								: `${(safePage - 1) * pageSize + 1}–${Math.min(
										safePage * pageSize,
										rows.length
									)}`}{" "}
							of {formatCount(rows.length)}
						</span>
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							disabled={safePage <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							<ChevronLeft className="size-3.5" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							disabled={safePage >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
						>
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
				<p className="text-sm text-muted-foreground">
					{formatCount(rows.length)} {config.rowNoun}s found
				</p>
			</CardHeader>
			<CardContent className="px-0 pb-2">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="border-b-primary/20 bg-primary/[0.04] hover:bg-primary/[0.04]">
								<TableHead className="pl-3 font-semibold text-primary">
									Reference
								</TableHead>
								<TableHead className="font-semibold text-primary">Title</TableHead>
								<TableHead className="font-semibold text-primary">
									Vendor
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Period
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Status
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Metric
								</TableHead>
								<TableHead className="font-semibold text-primary">Due</TableHead>
								<TableHead className="font-semibold text-primary">
									Owner
								</TableHead>
								<TableHead className="pr-3 text-right font-semibold text-primary">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="pl-3 font-mono text-xs">
										{row.referenceId}
									</TableCell>
									<TableCell className="max-w-[220px] truncate font-medium">
										{row.title}
									</TableCell>
									<TableCell>{row.vendor}</TableCell>
									<TableCell>{row.period}</TableCell>
									<TableCell>
										<StatusPill status={row.status} />
									</TableCell>
									<TableCell>
										<span className="text-muted-foreground text-xs">
											{row.metricLabel}:{" "}
										</span>
										<span className="font-medium">{row.metricValue}</span>
									</TableCell>
									<TableCell>{row.dueDate}</TableCell>
									<TableCell>{row.owner}</TableCell>
									<TableCell className="pr-3 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="size-8">
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														toast.message("Details", {
															description: row.title,
														})
													}
												>
													View details
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														void navigator.clipboard.writeText(row.referenceId)
													}
												>
													Copy reference ID
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{pageRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={9}
										className="h-24 text-center text-muted-foreground"
									>
										No {config.rowNoun}s match the current filters.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
