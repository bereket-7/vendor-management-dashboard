"use client";

import { useParams } from "next/navigation";

import { ArrowLeft, Play } from "lucide-react";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	VendorCoreErrorBanner,
	VendorCoreLiveChrome,
	VendorCoreLoadingRow,
} from "@/components/vendor-core/VendorCoreLiveChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { Link } from "@/i18n/navigation";
import { vendorCoreApi } from "@/lib/vendor-core";
import {
	useInvalidateVendorCore,
	useVendorCoreAccounts,
	useVendorCoreConnections,
	useVendorCoreJobs,
	useVendorCoreVendor,
} from "@/lib/vendor-core/hooks";

function VendorDetailLiveBody({ id }: { id: string }) {
	const invalidate = useInvalidateVendorCore();
	const vendorQ = useVendorCoreVendor(id);
	const connectionsQ = useVendorCoreConnections(id);
	const jobsQ = useVendorCoreJobs(id);
	const accountsQ = useVendorCoreAccounts(id);

	const loading =
		vendorQ.isLoading ||
		connectionsQ.isLoading ||
		jobsQ.isLoading ||
		accountsQ.isLoading;
	const error =
		vendorQ.error?.message ||
		connectionsQ.error?.message ||
		jobsQ.error?.message ||
		accountsQ.error?.message;

	const vendor = vendorQ.data;

	return (
		<VendorCoreLiveChrome
			title={vendor?.name ?? "Vendor"}
			subtitle={vendor ? `${vendor.code} · ${vendor.status}` : undefined}
			onRefresh={() => void invalidate()}
			refreshing={loading}
		>
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/admin/vendors">
						<ArrowLeft />
						Back
					</Link>
				</Button>
			</div>
			{error ? <VendorCoreErrorBanner message={error} /> : null}
			{loading && !vendor ? (
				<VendorCoreLoadingRow />
			) : (
				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Connections</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Method</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(connectionsQ.data ?? []).map((c) => (
										<TableRow key={c.id}>
											<TableCell className="font-medium">{c.name}</TableCell>
											<TableCell>{c.method}</TableCell>
											<TableCell>
												<StatusBadge status={c.status} />
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														void vendorCoreApi
															.testConnection(c.id)
															.then(() => invalidate());
													}}
												>
													Test
												</Button>
											</TableCell>
										</TableRow>
									))}
									{!(connectionsQ.data ?? []).length ? (
										<TableRow>
											<TableCell colSpan={4} className="text-muted-foreground">
												No connections for this vendor.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Intake jobs</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Schedule</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(jobsQ.data ?? []).map((job) => (
										<TableRow key={job.id}>
											<TableCell className="font-medium">{job.name}</TableCell>
											<TableCell>{job.file_type}</TableCell>
											<TableCell className="text-xs">
												{job.schedule_cron || "—"}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													onClick={() => {
														void vendorCoreApi
															.runIntakeJob(job.id)
															.then(() => invalidate());
													}}
												>
													<Play />
													Run
												</Button>
											</TableCell>
										</TableRow>
									))}
									{!(jobsQ.data ?? []).length ? (
										<TableRow>
											<TableCell colSpan={4} className="text-muted-foreground">
												No intake jobs for this vendor.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-base">Accounts</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Code</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(accountsQ.data ?? []).map((a) => (
										<TableRow key={a.id}>
											<TableCell className="font-mono text-xs">{a.code}</TableCell>
											<TableCell>{a.name ?? "—"}</TableCell>
											<TableCell>
												<StatusBadge status={a.status ?? "active"} />
											</TableCell>
										</TableRow>
									))}
									{!(accountsQ.data ?? []).length ? (
										<TableRow>
											<TableCell colSpan={3} className="text-muted-foreground">
												No accounts for this vendor.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			)}
		</VendorCoreLiveChrome>
	);
}

export function VendorDetailLivePage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";

	return (
		<VendorCoreGate title="Vendor detail">
			{id ? <VendorDetailLiveBody id={id} /> : null}
		</VendorCoreGate>
	);
}
