"use client";

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ClaimLine,
	formatCurrency,
} from "@/features/admin/features/claim-encounter/mock-data";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";

export function MetaItem({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="flex items-start gap-2.5 py-1">
			{Icon ? (
				<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/10">
					<Icon className="size-3.5" />
				</div>
			) : null}
			<div className="min-w-0">
				<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
					{label}
				</p>
				<div className="mt-0.5 text-sm font-medium break-words text-foreground">
					{value ?? "—"}
				</div>
			</div>
		</div>
	);
}

export function StatusPill({ status }: { status: string }) {
	return <StatusBadge status={status} />;
}

export function ClaimsTable({
	rows,
	mode = "response",
}: {
	rows: ClaimLine[];
	mode?: "response" | "batch";
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
			<ScrollArea
				className="w-full"
				scrollbarClassName="w-1.5"
				thumbClassName="bg-border"
				viewportClassName="[&>div]:!block [&>div]:!min-w-max"
			>
				<div className="min-w-[1280px] pb-3">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="pl-4">Claim ID</TableHead>
								<TableHead>Member ID</TableHead>
								<TableHead>Provider</TableHead>
								<TableHead>Vendor</TableHead>
								<TableHead>Account</TableHead>
								<TableHead>Claim type</TableHead>
								<TableHead>Date of service</TableHead>
								<TableHead className="text-right">Amount billed</TableHead>
								{mode === "response" ? (
									<>
										<TableHead className="text-right">Amount paid</TableHead>
										<TableHead>Gainwell response</TableHead>
										<TableHead>Reject reason</TableHead>
										<TableHead>Response file</TableHead>
									</>
								) : (
									<>
										<TableHead>Submission status</TableHead>
										<TableHead>Batch ID</TableHead>
										<TableHead>Control / Trace ID</TableHead>
									</>
								)}
								{mode === "response" ? <TableHead>Trace ID</TableHead> : null}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-muted/30">
									<TableCell className="pl-4 font-mono text-xs font-medium">
										{row.claimId}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{row.memberId}
									</TableCell>
									<TableCell>{row.provider}</TableCell>
									<TableCell>{row.vendor}</TableCell>
									<TableCell className="font-mono text-xs">
										{row.account}
									</TableCell>
									<TableCell>{row.claimType}</TableCell>
									<TableCell className="tabular-nums">
										{row.dateOfService}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatCurrency(row.amountBilled)}
									</TableCell>
									{mode === "response" ? (
										<>
											<TableCell className="text-right tabular-nums text-emerald-700">
												{formatCurrency(row.amountPaid)}
											</TableCell>
											<TableCell>
												<StatusPill status={row.gainwellStatus} />
											</TableCell>
											<TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
												{row.rejectReason ?? "—"}
											</TableCell>
											<TableCell className="max-w-[160px] truncate font-mono text-[11px] text-muted-foreground">
												{row.responseFileName}
											</TableCell>
											<TableCell className="font-mono text-[11px] text-muted-foreground">
												{row.traceId}
											</TableCell>
										</>
									) : (
										<>
											<TableCell>
												<StatusPill status={row.submissionStatus} />
											</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">
												{row.batchId}
											</TableCell>
											<TableCell className="font-mono text-[11px] text-muted-foreground">
												{row.traceId}
											</TableCell>
										</>
									)}
								</TableRow>
							))}
							{rows.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={mode === "response" ? 13 : 11}
										className="h-24 text-center text-muted-foreground"
									>
										No claim lines found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</ScrollArea>
		</div>
	);
}
