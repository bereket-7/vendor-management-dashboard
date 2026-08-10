"use client";

import { Download, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ComplianceFilterChip } from "@/features/admin/features/claim-encounter/compliance-program/filter-utils";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { cn } from "@/lib/utils";

export function ComplianceFilterBar({
	chips,
	status,
	onStatusChange,
	vendor,
	onVendorChange,
	search,
	onSearchChange,
	searchPlaceholder,
	exportLabel,
	onExport,
	onRefresh,
	refreshing,
}: {
	chips: ComplianceFilterChip[];
	status: string;
	onStatusChange: (value: string) => void;
	vendor: string;
	onVendorChange: (value: string) => void;
	search: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder: string;
	exportLabel: string;
	onExport: () => void;
	onRefresh: () => void;
	refreshing?: boolean;
}) {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{chips.map((chip) => (
					<button
						key={chip.key}
						type="button"
						onClick={() => onStatusChange(chip.key)}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-opacity",
							status === chip.key
								? chip.activeClassName
								: "border-border bg-card text-muted-foreground hover:border-primary/40",
							status === chip.key && "ring-2 ring-offset-1 ring-primary/30"
						)}
					>
						{chip.label}
						<span
							className={cn(
								"rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
								status === chip.key ? "bg-white/20" : "bg-muted text-foreground"
							)}
						>
							{chip.count}
						</span>
					</button>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200/70 bg-sky-50/50 p-3">
				<Select
					value={vendor}
					onValueChange={onVendorChange}
				>
					<SelectTrigger className="h-9 w-[140px] border-sky-200 bg-card">
						<SelectValue placeholder="All vendors" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All vendors</SelectItem>
						{VENDOR_NAMES.map((name) => (
							<SelectItem key={name} value={name}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="relative min-w-[220px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-sky-700" />
					<Input
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="h-9 border-sky-200 bg-card pl-8"
					/>
				</div>

				<div className="ml-auto flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-primary/30 bg-card text-primary hover:bg-primary/5"
						onClick={onExport}
					>
						<span className="inline-flex items-center gap-1.5">
							<Download className="size-3.5 shrink-0" />
							<span>{exportLabel}</span>
						</span>
					</Button>
					<Button
						size="sm"
						className="h-9"
						onClick={onRefresh}
						disabled={refreshing}
					>
						<span className="inline-flex items-center gap-1.5">
							<RefreshCw
								className={cn(
									"size-3.5 shrink-0",
									refreshing && "animate-spin"
								)}
							/>
							<span>Refresh</span>
						</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
