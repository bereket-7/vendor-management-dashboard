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
import {
	useInvalidateVendorCore,
	useVendorCoreMemberCoverages,
} from "@/lib/vendor-core/hooks";
import type { MemberCoverageDto } from "@/lib/vendor-core/types";
import { vendorLabel } from "@/lib/vendor-core/types";

function coverageName(row: MemberCoverageDto): string {
	const name = [row.member_first_name, row.member_last_name]
		.filter(Boolean)
		.join(" ")
		.trim();
	return name || row.subscriber_id || "—";
}

function eligibilityLabel(row: MemberCoverageDto): string {
	const ef = row.eligibility_file;
	if (!ef) return "—";
	if (typeof ef === "object") {
		return (
			ef.original_filename ||
			ef.reference_id ||
			ef.id.slice(0, 8)
		);
	}
	return ef.slice(0, 8);
}

function vendorFromCoverage(row: MemberCoverageDto): string {
	const ef = row.eligibility_file;
	if (ef && typeof ef === "object") {
		return vendorLabel(ef.vendor);
	}
	return "—";
}

function MembersLiveBody() {
	const invalidate = useInvalidateVendorCore();
	const coveragesQ = useVendorCoreMemberCoverages();
	const [search, setSearch] = useState("");

	const rows = useMemo(() => {
		const q = search.trim().toLowerCase();
		return (coveragesQ.data ?? []).filter((row) => {
			if (!q) return true;
			return [
				row.reference_id,
				row.subscriber_id,
				row.member_first_name,
				row.member_last_name,
				row.group_or_policy_number,
				eligibilityLabel(row),
				vendorFromCoverage(row),
			]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [coveragesQ.data, search]);

	return (
		<VendorCoreLiveChrome
			title="Members"
			subtitle="Member coverages from vendor-core (834 eligibility)"
			onRefresh={() => void invalidate()}
			refreshing={coveragesQ.isLoading}
		>
			{coveragesQ.error ? (
				<VendorCoreErrorBanner message={coveragesQ.error.message} />
			) : null}

			<div className="relative max-w-sm">
				<Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder="Search subscriber, name, group…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{coveragesQ.isLoading && !coveragesQ.data ? (
				<VendorCoreLoadingRow />
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Member</TableHead>
								<TableHead>Subscriber ID</TableHead>
								<TableHead>Group / policy</TableHead>
								<TableHead>Vendor / file</TableHead>
								<TableHead>Maintenance</TableHead>
								<TableHead>Reference</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">
										{coverageName(row)}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{row.subscriber_id || "—"}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{row.group_or_policy_number || "—"}
									</TableCell>
									<TableCell>
										<p className="text-sm">{vendorFromCoverage(row)}</p>
										<p className="truncate text-[11px] text-muted-foreground">
											{eligibilityLabel(row)}
										</p>
									</TableCell>
									<TableCell className="font-mono text-xs">
										{row.maintenance_type_code || "—"}
									</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{row.reference_id || row.id.slice(0, 8)}
									</TableCell>
									<TableCell className="text-xs tabular-nums text-muted-foreground">
										{row.created_at
											? new Date(row.created_at).toLocaleString()
											: "—"}
									</TableCell>
								</TableRow>
							))}
							{!rows.length ? (
								<TableRow>
									<TableCell colSpan={7} className="text-muted-foreground">
										No member coverages yet. Coverages appear after 834 files
										are ingested into vendor-core.
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

export function MembersLivePage() {
	return (
		<VendorCoreGate title="Members">
			<MembersLiveBody />
		</VendorCoreGate>
	);
}
