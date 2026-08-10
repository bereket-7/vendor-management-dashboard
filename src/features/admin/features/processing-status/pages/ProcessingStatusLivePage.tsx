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
import {
	useInvalidateVendorCore,
	useVendorCoreMonitoring,
	useVendorCoreValidationResults,
} from "@/lib/vendor-core/hooks";

function ProcessingStatusLiveBody() {
	const invalidate = useInvalidateVendorCore();
	const monitoringQ = useVendorCoreMonitoring();
	const validationQ = useVendorCoreValidationResults();
	const [search, setSearch] = useState("");

	const validationRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (validationQ.data ?? [])
			.filter((row) => {
				if (!query) return true;
				return [
					row.message,
					row.code,
					row.field_name,
					row.member_id,
					row.inbound_file_id,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase()
					.includes(query);
			})
			.slice(0, 50);
	}, [validationQ.data, search]);

	const loading =
		(monitoringQ.isLoading && !monitoringQ.data) ||
		(validationQ.isLoading && !validationQ.data);

	return (
		<VendorCoreLiveChrome
			title="Processing status"
			subtitle="Monitoring dashboard and validation results from vendor-core"
			onRefresh={() => void invalidate()}
			refreshing={monitoringQ.isLoading || validationQ.isLoading}
		>
			{(monitoringQ.error ?? validationQ.error) ? (
				<VendorCoreErrorBanner
					message={
						monitoringQ.error?.message ??
						validationQ.error?.message ??
						"Request failed"
					}
				/>
			) : null}
			{loading ? (
				<VendorCoreLoadingRow />
			) : (
				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">File stages</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2">
								{(monitoringQ.data?.inbound_file_stages ?? []).map((s) => (
									<li
										key={s.stage}
										className="flex items-center justify-between text-sm"
									>
										<span className="capitalize text-muted-foreground">
											{s.stage.replaceAll("_", " ")}
										</span>
										<span className="font-medium">{s.count}</span>
									</li>
								))}
								{!(monitoringQ.data?.inbound_file_stages ?? []).length ? (
									<li className="text-sm text-muted-foreground">
										No stage data yet.
									</li>
								) : null}
							</ul>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Recent runs</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Job</TableHead>
										<TableHead>Stage</TableHead>
										<TableHead>Processed</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(monitoringQ.data?.recent_runs ?? []).slice(0, 12).map(
										(run) => (
											<TableRow key={run.id}>
												<TableCell className="font-medium">
													{run.job__name}
												</TableCell>
												<TableCell>
													<StatusBadge status={run.stage ?? "unknown"} />
												</TableCell>
												<TableCell>
													{run.files_processed}/{run.files_found}
												</TableCell>
											</TableRow>
										)
									)}
									{!(monitoringQ.data?.recent_runs ?? []).length ? (
										<TableRow>
											<TableCell
												colSpan={3}
												className="text-muted-foreground"
											>
												No recent runs.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-base">Connections health</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Method</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Health</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(monitoringQ.data?.connections ?? []).map((c) => (
										<TableRow key={c.id}>
											<TableCell className="font-medium">{c.name}</TableCell>
											<TableCell>{c.method}</TableCell>
											<TableCell>
												<StatusBadge status={c.status} />
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{c.health?.current_status ?? "—"}
											</TableCell>
										</TableRow>
									))}
									{!(monitoringQ.data?.connections ?? []).length ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-muted-foreground"
											>
												No connections in monitoring payload.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
					<Card className="lg:col-span-2">
						<CardHeader className="flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-base">Validation results</CardTitle>
							<div className="relative w-full max-w-xs">
								<Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
								<Input
									className="h-9 pl-9"
									placeholder="Search validation results…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>File</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Field</TableHead>
										<TableHead>Member</TableHead>
										<TableHead>Message</TableHead>
										<TableHead>Severity</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{validationRows.map((row) => {
										const fileId = row.inbound_file_id;
										const severity =
											row.is_valid === true
												? "success"
												: (row.severity ?? "error").includes("warn")
													? "warning"
													: "failed";
										return (
											<TableRow key={row.id}>
												<TableCell>
													{fileId ? (
														<Link
															href={`/admin/file-monitoring/${fileId}`}
															className="font-mono text-xs text-primary hover:underline"
														>
															{fileId.slice(0, 8)}
														</Link>
													) : (
														"—"
													)}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{row.code ?? row.error_code ?? "—"}
												</TableCell>
												<TableCell>
													{row.field_name ?? row.field ?? "—"}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{row.member_id ?? row.subscriber_id ?? "—"}
												</TableCell>
												<TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
													{row.message ?? row.description ?? "—"}
												</TableCell>
												<TableCell>
													<StatusBadge status={severity} />
												</TableCell>
											</TableRow>
										);
									})}
									{!validationRows.length ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-muted-foreground"
											>
												No validation results yet.
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

export function ProcessingStatusLivePage() {
	return (
		<VendorCoreGate title="Processing status">
			<ProcessingStatusLiveBody />
		</VendorCoreGate>
	);
}
