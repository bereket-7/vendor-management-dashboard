"use client";

import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CmsEdgeTablePaginationProps = {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	pageSizeOptions?: number[];
	className?: string;
};

export function CmsEdgeTablePagination({
	page,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions = [10, 25, 50],
	className,
}: CmsEdgeTablePaginationProps) {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(Math.max(1, page), pageCount);
	const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const to = Math.min(safePage * pageSize, total);

	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-sm text-muted-foreground",
				className
			)}
		>
			<p className="text-xs sm:text-sm">
				Showing{" "}
				<span className="font-medium tabular-nums text-foreground">{from}</span>
				–<span className="font-medium tabular-nums text-foreground">{to}</span>{" "}
				of{" "}
				<span className="font-medium tabular-nums text-foreground">
					{total.toLocaleString("en-US")}
				</span>
			</p>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={safePage <= 1}
					onClick={() => onPageChange(1)}
					aria-label="First page"
				>
					<ChevronsLeft className="size-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={safePage <= 1}
					onClick={() => onPageChange(safePage - 1)}
					aria-label="Previous page"
				>
					<ChevronLeft className="size-4" />
				</Button>
				<span className="px-2 text-xs tabular-nums">
					Page {safePage} of {pageCount}
				</span>
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={safePage >= pageCount}
					onClick={() => onPageChange(safePage + 1)}
					aria-label="Next page"
				>
					<ChevronRight className="size-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={safePage >= pageCount}
					onClick={() => onPageChange(pageCount)}
					aria-label="Last page"
				>
					<ChevronsRight className="size-4" />
				</Button>
			</div>
			{onPageSizeChange ? (
				<div className="flex items-center gap-2">
					<span className="text-xs">Rows per page</span>
					<Select
						value={String(pageSize)}
						onValueChange={(value) => onPageSizeChange(Number(value))}
					>
						<SelectTrigger className="h-8 w-[72px] border-border/70 bg-card text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</div>
	);
}
