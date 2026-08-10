"use client";

import { useMemo, useState } from "react";

import { Search } from "lucide-react";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	VendorCoreErrorBanner,
	VendorCoreLiveChrome,
	VendorCoreLoadingRow,
} from "@/components/vendor-core/VendorCoreLiveChrome";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useInvalidateVendorCore,
	useVendorCoreAudit,
} from "@/lib/vendor-core/hooks";

function AuditLiveBody() {
	const invalidate = useInvalidateVendorCore();
	const auditQ = useVendorCoreAudit();
	const [search, setSearch] = useState("");

	const rows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (auditQ.data ?? []).filter((a) => {
			if (!query) return true;
			return `${a.action} ${a.actor ?? ""} ${a.resource_type ?? ""} ${a.summary ?? ""}`
				.toLowerCase()
				.includes(query);
		});
	}, [auditQ.data, search]);

	return (
		<VendorCoreLiveChrome
			title="Audit trail"
			subtitle="Integration audit from vendor-core"
			onRefresh={() => void invalidate()}
			refreshing={auditQ.isLoading}
		>
			{auditQ.error ? (
				<VendorCoreErrorBanner message={auditQ.error.message} />
			) : null}
			<div className="relative max-w-sm">
				<Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder="Search audit…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>
			{auditQ.isLoading && !auditQ.data ? (
				<VendorCoreLoadingRow />
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>When</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>Actor</TableHead>
								<TableHead>Resource</TableHead>
								<TableHead>Summary</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((a) => (
								<TableRow key={a.id}>
									<TableCell className="whitespace-nowrap text-xs text-muted-foreground">
										{a.created_at
											? new Date(a.created_at).toLocaleString()
											: "—"}
									</TableCell>
									<TableCell>
										<StatusBadge status={a.action} />
									</TableCell>
									<TableCell>{a.actor ?? "—"}</TableCell>
									<TableCell className="text-xs">
										{a.resource_type ?? "—"}
										{a.resource_id ? (
											<span className="text-muted-foreground">
												{" "}
												{a.resource_id.slice(0, 8)}
											</span>
										) : null}
									</TableCell>
									<TableCell className="max-w-md truncate text-sm">
										{a.summary ?? "—"}
									</TableCell>
								</TableRow>
							))}
							{!rows.length ? (
								<TableRow>
									<TableCell colSpan={5} className="text-muted-foreground">
										No audit records.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</div>
			)}
		</VendorCoreLiveChrome>
	);
}

export function AuditLivePage() {
	return (
		<VendorCoreGate title="Audit trail">
			<AuditLiveBody />
		</VendorCoreGate>
	);
}
