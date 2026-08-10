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
import { useRouter } from "@/i18n/navigation";
import {
	useInvalidateVendorCore,
	useVendorCoreConnections,
	useVendorCoreJobs,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";

function VendorsLiveBody() {
	const router = useRouter();
	const invalidate = useInvalidateVendorCore();
	const vendorsQ = useVendorCoreVendors();
	const connectionsQ = useVendorCoreConnections();
	const jobsQ = useVendorCoreJobs();
	const [search, setSearch] = useState("");

	const rows = useMemo(() => {
		const vendors = vendorsQ.data ?? [];
		const connections = connectionsQ.data ?? [];
		const jobs = jobsQ.data ?? [];
		const query = search.trim().toLowerCase();

		return vendors
			.map((v) => {
				const vendorConns = connections.filter((c) => c.vendor_id === v.id);
				const vendorJobs = jobs.filter((j) => j.vendor_id === v.id);
				const meta = (v.metadata ?? {}) as Record<string, unknown>;
				const metaHealth = String(meta.health ?? "");
				const failed = vendorConns.some(
					(c) =>
						c.status === "failed" ||
						c.health?.current_status === "failed" ||
						Boolean(c.health?.last_error)
				);
				const warning = vendorConns.some(
					(c) => c.status === "testing" || c.status === "draft"
				);
				const health = failed
					? "critical"
					: warning
						? "warning"
						: metaHealth === "critical" || metaHealth === "warning"
							? metaHealth
							: "healthy";
				const vendorType = String(meta.vendor_type ?? v.tier ?? "—");
				return {
					...v,
					vendorType,
					connections: vendorConns.length,
					jobs: vendorJobs.length,
					health,
				};
			})
			.filter((v) => {
				if (!query) return true;
				return `${v.name} ${v.code} ${v.status} ${v.vendorType}`
					.toLowerCase()
					.includes(query);
			});
	}, [vendorsQ.data, connectionsQ.data, jobsQ.data, search]);

	const loading = vendorsQ.isLoading;
	const error = vendorsQ.error?.message;
	const sideError =
		connectionsQ.error?.message || jobsQ.error?.message || null;

	return (
		<VendorCoreLiveChrome
			title="Vendors"
			subtitle={`Trading partners from vendor-core (${rows.length} loaded)`}
			onRefresh={() => void invalidate()}
			refreshing={
				vendorsQ.isFetching || connectionsQ.isFetching || jobsQ.isFetching
			}
		>
			{error ? <VendorCoreErrorBanner message={error} /> : null}
			{sideError && !error ? (
				<VendorCoreErrorBanner message={sideError} />
			) : null}
			<div className="relative max-w-sm">
				<Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder="Search vendors…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>
			{loading && !vendorsQ.data ? (
				<VendorCoreLoadingRow />
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Code</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Connections</TableHead>
								<TableHead>Jobs</TableHead>
								<TableHead>Health</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((v) => (
								<TableRow
									key={v.id}
									className="cursor-pointer hover:bg-muted/40"
									onClick={() => router.push(`/admin/vendors/${v.id}`)}
								>
									<TableCell className="font-medium text-primary underline-offset-4 hover:underline">
										{v.name}
									</TableCell>
									<TableCell className="font-mono text-xs">{v.code}</TableCell>
									<TableCell className="text-xs">{v.vendorType}</TableCell>
									<TableCell>
										<StatusBadge status={v.status} />
									</TableCell>
									<TableCell>{v.connections}</TableCell>
									<TableCell>{v.jobs}</TableCell>
									<TableCell>
										<StatusBadge status={v.health} />
									</TableCell>
								</TableRow>
							))}
							{!rows.length ? (
								<TableRow>
									<TableCell colSpan={7} className="text-muted-foreground">
										No vendors returned from the API.
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

export function VendorsLivePage() {
	return (
		<VendorCoreGate title="Vendors">
			<VendorsLiveBody />
		</VendorCoreGate>
	);
}
