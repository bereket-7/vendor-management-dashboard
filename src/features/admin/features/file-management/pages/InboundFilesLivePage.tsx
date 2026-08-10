"use client";

import { useMemo, useState } from "react";

import { ExternalLink, RefreshCw, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	VendorCoreErrorBanner,
	VendorCoreLiveChrome,
	VendorCoreLoadingRow,
} from "@/components/vendor-core/VendorCoreLiveChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	useVendorCoreInboundFiles,
	useVendorCoreMonitoring,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { vendorLabel } from "@/lib/vendor-core/types";
import { cn } from "@/lib/utils";

function formatBytes(n: number) {
	if (!n) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const i = Math.min(
		Math.floor(Math.log(n) / Math.log(1024)),
		units.length - 1
	);
	return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function InboundFilesLiveBody({
	title,
	allowUpload = false,
}: {
	title: string;
	allowUpload?: boolean;
}) {
	const invalidate = useInvalidateVendorCore();
	const filesQ = useVendorCoreInboundFiles();
	const vendorsQ = useVendorCoreVendors();
	const monitoringQ = useVendorCoreMonitoring();
	const [search, setSearch] = useState("");
	const [stage, setStage] = useState("all");
	const [uploading, setUploading] = useState(false);
	const [reprocessingId, setReprocessingId] = useState<string | null>(null);

	const nameById = useMemo(
		() => new Map((vendorsQ.data ?? []).map((v) => [v.id, v.name])),
		[vendorsQ.data]
	);

	const stages = useMemo(() => {
		const set = new Set((filesQ.data ?? []).map((f) => f.stage));
		return Array.from(set).sort();
	}, [filesQ.data]);

	const rows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (filesQ.data ?? [])
			.filter((f) => {
				if (stage !== "all" && f.stage !== stage) return false;
				if (!query) return true;
				return `${f.original_filename} ${f.detected_type} ${f.source} ${vendorLabel(f.vendor, nameById)}`
					.toLowerCase()
					.includes(query);
			})
			.sort((a, b) =>
				String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
			);
	}, [filesQ.data, search, stage, nameById]);

	const loading = filesQ.isLoading;
	const error = filesQ.error?.message;

	async function onUpload(fileList: FileList | null) {
		const file = fileList?.[0];
		if (!file) return;
		setUploading(true);
		try {
			await vendorCoreApi.uploadInboundFile({ file });
			toast.success(`Uploaded ${file.name}`);
			invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	}

	async function onReprocess(id: string) {
		setReprocessingId(id);
		try {
			await vendorCoreApi.reprocessInboundFile(id);
			toast.success("Reprocess queued");
			invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Reprocess failed");
		} finally {
			setReprocessingId(null);
		}
	}

	return (
		<VendorCoreLiveChrome
			title={title}
			subtitle="Inbound files from vendor-core"
			onRefresh={() => void invalidate()}
			refreshing={loading || uploading}
		>
			{error ? <VendorCoreErrorBanner message={error} /> : null}

			{monitoringQ.data?.inbound_file_stages?.length ? (
				<div className="flex flex-wrap gap-2 text-xs">
					{monitoringQ.data.inbound_file_stages.map((s) => (
						<span
							key={s.stage}
							className="rounded-md border bg-muted/40 px-2 py-1"
						>
							<span className="capitalize text-muted-foreground">
								{s.stage.replaceAll("_", " ")}
							</span>
							<span className="ml-2 font-semibold">{s.count}</span>
						</span>
					))}
				</div>
			) : null}

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative max-w-sm flex-1">
					<Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder="Search files…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select value={stage} onValueChange={setStage}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Stage" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All stages</SelectItem>
						{stages.map((s) => (
							<SelectItem key={s} value={s}>
								{s}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{allowUpload ? (
					<Button variant="outline" size="sm" asChild disabled={uploading}>
						<label className="cursor-pointer">
							<Upload />
							Upload
							<input
								type="file"
								className="hidden"
								onChange={(e) => void onUpload(e.target.files)}
							/>
						</label>
					</Button>
				) : null}
			</div>

			{loading && !filesQ.data ? (
				<VendorCoreLoadingRow />
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Filename</TableHead>
								<TableHead>Vendor</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Stage</TableHead>
								<TableHead>Source</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>Errors</TableHead>
								<TableHead>Received</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((f) => {
								const detailHref = `/admin/file-monitoring/${f.id}`;
								return (
									<TableRow key={f.id} className="hover:bg-muted/30">
										<TableCell className="max-w-[240px] truncate font-medium">
											<Link
												href={detailHref}
												className="inline-flex items-center gap-1 hover:text-primary"
											>
												{f.original_filename}
												<ExternalLink className="size-3 shrink-0 opacity-60" />
											</Link>
										</TableCell>
										<TableCell>{vendorLabel(f.vendor, nameById)}</TableCell>
										<TableCell>{f.detected_type || "—"}</TableCell>
										<TableCell>
											<StatusBadge status={f.stage} />
										</TableCell>
										<TableCell className="text-xs">{f.source}</TableCell>
										<TableCell>{formatBytes(f.size_bytes ?? 0)}</TableCell>
										<TableCell
											className={cn(
												"tabular-nums",
												(f.error_count ?? 0) > 0 && "font-medium text-red-700"
											)}
										>
											{f.error_count ?? 0}
										</TableCell>
										<TableCell className="text-xs text-muted-foreground">
											{f.created_at
												? new Date(f.created_at).toLocaleString()
												: "—"}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1">
												<Button variant="outline" size="sm" asChild>
													<Link href={detailHref}>View</Link>
												</Button>
												<Button
													variant="outline"
													size="sm"
													disabled={reprocessingId === f.id}
													onClick={() => void onReprocess(f.id)}
												>
													<RefreshCw
														className={cn(
															"size-3.5",
															reprocessingId === f.id && "animate-spin"
														)}
													/>
													{reprocessingId === f.id ? "…" : "Reprocess"}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
							{!rows.length ? (
								<TableRow>
									<TableCell colSpan={9} className="text-muted-foreground">
										No inbound files yet.
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

export function FileMonitoringLivePage() {
	return (
		<VendorCoreGate title="File monitoring">
			<InboundFilesLiveBody title="File monitoring" allowUpload />
		</VendorCoreGate>
	);
}

export function FileHistoryLivePage() {
	return (
		<VendorCoreGate title="File history">
			<InboundFilesLiveBody title="File history" />
		</VendorCoreGate>
	);
}
