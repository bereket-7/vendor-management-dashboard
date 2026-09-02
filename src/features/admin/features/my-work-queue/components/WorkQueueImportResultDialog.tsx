"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { WorkQueueImportResultDto } from "@/lib/vendor-core/types";

export type WorkQueueImportErrorRow = {
	row: string;
	code: string;
	error: string;
};

export function parseWorkQueueImportErrors(
	errors: WorkQueueImportResultDto["errors"] | undefined
): WorkQueueImportErrorRow[] {
	return (errors ?? []).map((entry, index) => {
		if (typeof entry === "string") {
			return { row: String(index + 1), code: "—", error: entry };
		}
		const row =
			entry.row != null
				? String(entry.row)
				: entry.line != null
					? String(entry.line)
					: "—";
		const code =
			entry.code != null
				? String(entry.code)
				: entry.field != null
					? String(entry.field)
					: "—";
		const error =
			entry.error != null
				? String(entry.error)
				: entry.message != null
					? String(entry.message)
					: JSON.stringify(entry);
		return { row, code, error };
	});
}

type WorkQueueImportResultDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	result: WorkQueueImportResultDto | null;
	filename?: string;
};

export function WorkQueueImportResultDialog({
	open,
	onOpenChange,
	result,
	filename,
}: WorkQueueImportResultDialogProps) {
	if (!result) return null;

	const errorRows = parseWorkQueueImportErrors(result.errors);
	const hasErrors = errorRows.length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
				<DialogHeader className="border-b border-border px-4 py-3">
					<DialogTitle className="text-base font-semibold">
						Import {filename ? `"${filename}"` : "complete"}
					</DialogTitle>
					<p className="text-xs text-muted-foreground">
						Created {result.created_count.toLocaleString()} · Updated{" "}
						{result.updated_count.toLocaleString()} · Errors{" "}
						{result.error_count.toLocaleString()}
					</p>
				</DialogHeader>

				<div className="max-h-[min(60vh,24rem)] overflow-y-auto px-4 py-3">
					{hasErrors ? (
						<div className="space-y-2">
							<p className="text-xs font-medium text-destructive">
								Validation / processing failures
							</p>
							<div className="overflow-x-auto rounded-md border border-border/60">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/30 hover:bg-muted/30">
											<TableHead className="text-[10px] font-bold uppercase">
												Row
											</TableHead>
											<TableHead className="text-[10px] font-bold uppercase">
												Code
											</TableHead>
											<TableHead className="text-[10px] font-bold uppercase">
												Error
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{errorRows.map((item, i) => (
											<TableRow key={`${item.row}-${item.code}-${i}`}>
												<TableCell className="whitespace-nowrap text-xs tabular-nums">
													{item.row}
												</TableCell>
												<TableCell className="text-xs font-medium">
													{item.code}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{item.error}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							All rows imported successfully.
						</p>
					)}

					{(result.created.length > 0 || result.updated.length > 0) && (
						<div className="mt-4 space-y-2 border-t border-border/50 pt-3">
							{result.created.length > 0 ? (
								<p className="text-xs text-muted-foreground">
									<span className="font-medium text-foreground">Created:</span>{" "}
									{result.created.join(", ")}
								</p>
							) : null}
							{result.updated.length > 0 ? (
								<p className="text-xs text-muted-foreground">
									<span className="font-medium text-foreground">Updated:</span>{" "}
									{result.updated.join(", ")}
								</p>
							) : null}
						</div>
					)}
				</div>

				<DialogFooter className="border-t border-border px-4 py-3 sm:justify-end">
					<Button type="button" size="sm" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
