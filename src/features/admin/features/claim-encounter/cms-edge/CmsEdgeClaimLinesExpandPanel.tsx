"use client";

import type { ReactNode } from "react";

import { ChevronRight, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { cn } from "@/lib/utils";

export type CmsEdgeClaimLineColumn = {
	key: string;
	label: string;
	align?: "left" | "right";
	className?: string;
};

export type CmsEdgeClaimLineRow = {
	id: string;
	cells: Record<string, ReactNode>;
};

type CmsEdgeClaimLinesExpandPanelProps = {
	colSpan: number;
	title?: string;
	columns: CmsEdgeClaimLineColumn[];
	lines: CmsEdgeClaimLineRow[];
	emptyLabel?: string;
	onViewLineDetail: (lineId: string) => void;
	viewAllHrefLabel?: string;
	onViewAllDetail?: () => void;
};

/** Nested claim-lines panel rendered in an expanded parent table row. */
export function CmsEdgeClaimLinesExpandPanel({
	colSpan,
	title = "Claim Lines",
	columns,
	lines,
	emptyLabel = "No claim lines for this claim.",
	onViewLineDetail,
	viewAllHrefLabel = "Open claim detail",
	onViewAllDetail,
}: CmsEdgeClaimLinesExpandPanelProps) {
	return (
		<TableRow className="bg-primary/10 hover:bg-primary/10">
			<TableCell colSpan={colSpan} className="p-0">
				<div className="border-t border-primary/20 bg-primary/10 px-3 py-3">
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary/80">
							{title}
							<span className="ml-2 font-semibold normal-case tracking-normal text-foreground">
								{lines.length}
							</span>
						</p>
						{onViewAllDetail ? (
							<Button
								type="button"
								variant="link"
								className="h-auto gap-1 px-0 text-xs font-semibold"
								onClick={onViewAllDetail}
							>
								{viewAllHrefLabel}
								<ExternalLink className="size-3" />
							</Button>
						) : null}
					</div>

					{lines.length === 0 ? (
						<p className="px-1 py-4 text-center text-xs text-muted-foreground">
							{emptyLabel}
						</p>
					) : (
						<div className="overflow-hidden rounded-sm border border-primary/15 bg-primary/5">
							<CmsEdgeTableScroll>
								<Table
									containerClassName={CMS_EDGE_TABLE_CONTAINER}
									className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[720px]")}
								>
									<TableHeader>
										<TableRow className="border-b border-primary/15 bg-primary/10 hover:bg-primary/10">
											{columns.map((col) => (
												<TableHead
													key={col.key}
													className={cn(
														CMS_EDGE_TABLE_HEAD_CLASS,
														"bg-transparent",
														col.align === "right" && "text-right",
														col.className
													)}
												>
													{col.label}
												</TableHead>
											))}
											<TableHead
												className={cn(
													CMS_EDGE_TABLE_HEAD_CLASS,
													"bg-transparent pr-3 text-right"
												)}
											>
												Action
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{lines.map((line) => (
											<TableRow
												key={line.id}
												className="border-b border-primary/10 bg-transparent hover:bg-primary/15"
											>
												{columns.map((col) => (
													<TableCell
														key={col.key}
														className={cn(
															"px-3 py-2 text-[11px]",
															col.align === "right" && "text-right tabular-nums"
														)}
													>
														{line.cells[col.key] ?? "—"}
													</TableCell>
												))}
												<TableCell className="px-3 py-2 pr-3 text-right">
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary"
														onClick={() => onViewLineDetail(line.id)}
													>
														View detail
														<ChevronRight className="size-3" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CmsEdgeTableScroll>
						</div>
					)}
				</div>
			</TableCell>
		</TableRow>
	);
}
