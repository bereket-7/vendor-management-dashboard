"use client";

import { useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	GripVertical,
	MoreHorizontal,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CertificateModel } from "@/features/shared/vms/types";
import { formatDate } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { CertificateApiStatus } from "../api/complianceApi";

export const BOARD_COLUMNS = [
	{
		id: "pending",
		title: "Pending",
		hint: "Awaiting verification",
		apiStatus: "pending_verification" as CertificateApiStatus,
		dot: "bg-amber-400",
		header: "text-amber-800 dark:text-amber-200",
	},
	{
		id: "valid",
		title: "Valid",
		hint: "In good standing",
		apiStatus: "valid" as CertificateApiStatus,
		dot: "bg-emerald-400",
		header: "text-emerald-800 dark:text-emerald-200",
	},
	{
		id: "expiring",
		title: "Expiring",
		hint: "Renew soon",
		apiStatus: "expiring_soon" as CertificateApiStatus,
		dot: "bg-orange-400",
		header: "text-orange-800 dark:text-orange-200",
	},
	{
		id: "expired",
		title: "Expired",
		hint: "Expired or revoked",
		apiStatus: "expired" as CertificateApiStatus,
		dot: "bg-red-400",
		header: "text-red-800 dark:text-red-200",
	},
] as const;

export type BoardColumnId = (typeof BOARD_COLUMNS)[number]["id"];

const DND_MIME = "application/x-vms-certificate";

function columnOf(status: CertificateModel["status"]): BoardColumnId {
	if (status === "valid" || status === "expiring" || status === "expired") {
		return status;
	}
	return "pending";
}

type ComplianceBoardProps = {
	certificates: CertificateModel[];
	busy?: boolean;
	onStatusChange: (
		id: string,
		status: CertificateApiStatus
	) => Promise<CertificateModel | void>;
};

export function ComplianceBoard({
	certificates,
	busy = false,
	onStatusChange,
}: ComplianceBoardProps) {
	const [cards, setCards] = useState(certificates);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [overColumn, setOverColumn] = useState<BoardColumnId | null>(null);

	useEffect(() => {
		setCards(certificates);
	}, [certificates]);

	const grouped = useMemo(() => {
		const map: Record<BoardColumnId, CertificateModel[]> = {
			pending: [],
			valid: [],
			expiring: [],
			expired: [],
		};
		for (const card of cards) {
			map[columnOf(card.status)].push(card);
		}
		return map;
	}, [cards]);

	async function moveToColumn(certId: string, columnId: BoardColumnId) {
		const current = cards.find((c) => c.id === certId);
		if (!current) return;
		if (columnOf(current.status) === columnId) return;

		const column = BOARD_COLUMNS.find((c) => c.id === columnId);
		if (!column) return;

		const nextStatus = column.id as CertificateModel["status"];
		setCards((prev) =>
			prev.map((c) =>
				c.id === certId
					? { ...c, status: nextStatus, riskFlag: nextStatus !== "valid" }
					: c
			)
		);

		try {
			await onStatusChange(certId, column.apiStatus);
			toast.success(`Moved to ${column.title}`);
		} catch (err) {
			setCards(certificates);
			toast.error(
				err instanceof Error ? err.message : "Could not update status"
			);
		}
	}

	return (
		<div className="-mx-1 overflow-x-auto pb-2">
			<div className="flex min-w-[920px] gap-3 px-1">
				{BOARD_COLUMNS.map((column) => {
					const items = grouped[column.id];
					const isOver = overColumn === column.id;
					return (
						<section
							key={column.id}
							onDragOver={(event) => {
								event.preventDefault();
								setOverColumn(column.id);
							}}
							onDragLeave={(event) => {
								if (
									!event.currentTarget.contains(event.relatedTarget as Node)
								) {
									setOverColumn((prev) => (prev === column.id ? null : prev));
								}
							}}
							onDrop={(event) => {
								event.preventDefault();
								setOverColumn(null);
								const certId =
									event.dataTransfer.getData(DND_MIME) ||
									event.dataTransfer.getData("text/plain");
								if (certId) void moveToColumn(certId, column.id);
							}}
							className={cn(
								"flex min-h-[560px] w-[min(100%,280px)] shrink-0 flex-col rounded-xl border border-transparent bg-muted/45 p-2",
								isOver && "border-primary/40 bg-primary/5"
							)}
						>
							<header className="mb-2 flex items-center justify-between px-2 py-1.5">
								<div className="flex min-w-0 items-center gap-2">
									<span
										className={cn("size-2 shrink-0 rounded-full", column.dot)}
									/>
									<h2
										className={cn(
											"truncate text-[13px] font-semibold",
											column.header
										)}
									>
										{column.title}
									</h2>
									<span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
										{items.length}
									</span>
								</div>
							</header>
							<div className="flex flex-1 flex-col gap-2">
								{items.map((certificate) => (
									<CertificateTicket
										key={certificate.id}
										certificate={certificate}
										busy={busy}
										dragging={draggingId === certificate.id}
										onDragStart={() => setDraggingId(certificate.id)}
										onDragEnd={() => {
											setDraggingId(null);
											setOverColumn(null);
										}}
										onAccept={() => void moveToColumn(certificate.id, "valid")}
										onReject={() =>
											void moveToColumn(certificate.id, "expired")
										}
									/>
								))}
								{items.length === 0 ? (
									<div
										className={cn(
											"flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/70 px-3 py-8 text-center text-xs text-muted-foreground",
											isOver && "border-primary/50 text-foreground"
										)}
									>
										Drop here
									</div>
								) : null}
							</div>
						</section>
					);
				})}
			</div>
		</div>
	);
}

function CertificateTicket({
	certificate,
	busy,
	dragging,
	onDragStart,
	onDragEnd,
	onAccept,
	onReject,
}: {
	certificate: CertificateModel;
	busy: boolean;
	dragging: boolean;
	onDragStart: () => void;
	onDragEnd: () => void;
	onAccept: () => void;
	onReject: () => void;
}) {
	return (
		<article
			draggable={!busy}
			onDragStart={(event) => {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData(DND_MIME, certificate.id);
				event.dataTransfer.setData("text/plain", certificate.id);
				onDragStart();
			}}
			onDragEnd={onDragEnd}
			className={cn(
				"group cursor-grab rounded-lg border border-border/70 bg-card p-3 shadow-sm active:cursor-grabbing",
				"hover:border-border hover:shadow-md",
				certificate.riskFlag && "border-destructive/40",
				dragging && "opacity-40 ring-2 ring-primary/30"
			)}
		>
			<div className="flex items-start gap-1.5">
				<GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
				<div className="min-w-0 flex-1">
					<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
						Certificate
					</p>
					<h3 className="mt-0.5 truncate text-sm font-semibold leading-snug">
						{certificate.name}
					</h3>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
							disabled={busy}
							onPointerDown={(event) => event.stopPropagation()}
						>
							<MoreHorizontal className="size-4" />
							<span className="sr-only">Actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href={`/admin/vendors/${certificate.vendorId}`}>
								View vendor
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={onAccept}>
							<CheckCircle2 className="mr-2 size-3.5 text-emerald-600" />
							Accept
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={onReject}
						>
							<XCircle className="mr-2 size-3.5" />
							Reject
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Link
				href={`/admin/vendors/${certificate.vendorId}`}
				className="mt-2 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
				onPointerDown={(event) => event.stopPropagation()}
			>
				{certificate.vendorName || "Unknown vendor"}
			</Link>

			<div className="mt-3 space-y-1.5 text-xs">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Building2 className="size-3.5 shrink-0" />
					<span className="truncate">{certificate.issuer}</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Calendar className="size-3.5 shrink-0" />
					<span>Expires {formatDate(certificate.expiresAt)}</span>
				</div>
			</div>

			{certificate.riskFlag ? (
				<p className="mt-3 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
					<AlertTriangle className="size-3 shrink-0" />
					Risk flag
				</p>
			) : null}
		</article>
	);
}
