"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { vendorCoreApi } from "@/lib/vendor-core/api";

const domain = "cms-edge";
const FILE_TYPES = ["medical", "pharmacy", "enrollment", "sdr"] as const;

export function CmsEdgeFileGenerationTab() {
	const useMock = isMockEnabled();
	const queryClient = useQueryClient();
	const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [createType, setCreateType] = useState<string>("medical");
	const [createName, setCreateName] = useState("");
	const [createPeriod, setCreatePeriod] = useState("");
	const [periodTouched, setPeriodTouched] = useState(false);

	const settingsQuery = useQuery({
		queryKey: featureQueryKey(domain, "settings"),
		queryFn: () => vendorCoreApi.getCmsEdgeSettings(),
		enabled: !useMock,
		networkMode: "always",
		retry: 1,
	});

	useEffect(() => {
		if (periodTouched) return;
		const period = settingsQuery.data?.current_reporting_period?.trim();
		if (period) setCreatePeriod(period);
	}, [settingsQuery.data?.current_reporting_period, periodTouched]);

	const packagesQuery = useQuery({
		queryKey: featureQueryKey(domain, "filePackages", {
			fileTypeFilter,
			statusFilter,
		}),
		queryFn: () =>
			vendorCoreApi.listCmsEdgeFilePackages({
				file_type: fileTypeFilter === "all" ? undefined : fileTypeFilter,
				status: statusFilter === "all" ? undefined : statusFilter,
				limit: 50,
				offset: 0,
			}),
		enabled: !useMock,
		networkMode: "always",
		retry: 1,
	});

	const invalidate = () => {
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "filePackages"),
		});
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "overviewShell"),
		});
	};

	const createMutation = useMutation({
		mutationFn: () => {
			const period = createPeriod.trim();
			if (!period) {
				throw new Error("Reporting period is required (e.g. Q2 2027).");
			}
			return vendorCoreApi.createCmsEdgeFilePackage({
				file_type: createType,
				name: createName.trim() || undefined,
				reporting_period: period,
			});
		},
		onSuccess: () => {
			toast.success("File package created");
			setCreateName("");
			invalidate();
		},
		onError: (err: Error) => toast.error(err.message || "Create failed"),
	});

	const actionMutation = useMutation({
		mutationFn: async ({
			id,
			action,
		}: {
			id: string;
			action: "generate" | "package" | "submit";
		}) => {
			if (action === "generate")
				return vendorCoreApi.generateCmsEdgeFilePackage(id);
			if (action === "package")
				return vendorCoreApi.packageCmsEdgeFilePackage(id);
			return vendorCoreApi.submitCmsEdgeFilePackage(id);
		},
		onSuccess: (_data, vars) => {
			toast.success(`Package ${vars.action} completed`);
			invalidate();
		},
		onError: (err: Error) => toast.error(err.message || "Action failed"),
	});

	const rows = useMemo(
		() => packagesQuery.data?.results ?? [],
		[packagesQuery.data]
	);

	if (useMock) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<div
					className={cn(
						CMS_EDGE_PANEL_CLASS,
						"p-6 text-sm text-muted-foreground"
					)}
				>
					File generation is mock-backed. Turn off `NEXT_PUBLIC_USE_MOCK` to
					manage live EDGE file packages.
				</div>
				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<CmsEdgeSectionPanel
				title="Create file package"
				subtitle="Draft a medical, pharmacy, enrollment, or SDR package for the reporting period."
			>
				<div className="flex flex-wrap items-end gap-3 border-t border-border/50 p-4">
					<div className="space-y-1.5">
						<Label>File type</Label>
						<Select value={createType} onValueChange={setCreateType}>
							<SelectTrigger className="h-9 w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{FILE_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="pkg-name">Name (optional)</Label>
						<Input
							id="pkg-name"
							className="h-9 w-56"
							value={createName}
							onChange={(e) => setCreateName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="pkg-period">Reporting period</Label>
						<Input
							id="pkg-period"
							className="h-9 w-40"
							placeholder="e.g. Q2 2027"
							value={createPeriod}
							onChange={(e) => {
								setPeriodTouched(true);
								setCreatePeriod(e.target.value);
							}}
						/>
					</div>
					<Button
						className="h-9"
						disabled={createMutation.isPending || !createPeriod.trim()}
						onClick={() => createMutation.mutate()}
					>
						{createMutation.isPending ? "Creating…" : "Create"}
					</Button>
				</div>
			</CmsEdgeSectionPanel>

			<CmsEdgeSectionPanel
				title="File packages"
				subtitle="Generate, package, and submit EDGE outbound artifacts."
				action={
					<div className="flex flex-wrap items-center gap-2">
						<Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
							<SelectTrigger className="h-8 w-36">
								<SelectValue placeholder="File type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{FILE_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8 w-36">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								{[
									"draft",
									"generating",
									"generated",
									"packaged",
									"submitted",
									"accepted",
									"rejected",
									"failed",
								].map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				}
			>
				<CmsEdgeTableScroll className="border-t border-border/50">
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[960px]")}
					>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Name
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Type
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Period
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Status
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Records
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Errors
								</TableHead>
								<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{packagesQuery.isLoading ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										Loading packages…
									</TableCell>
								</TableRow>
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										No file packages yet.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="px-3 py-2.5 font-medium">
											{row.name || row.reference_id}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.file_type}
										</TableCell>
										<TableCell className="px-3 py-2.5">
											{row.reporting_period || "—"}
										</TableCell>
										<TableCell className="px-3 py-2.5">{row.status}</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.record_count}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.error_count}
										</TableCell>
										<TableCell className="px-3 py-2.5 pr-4">
											<div className="flex flex-wrap gap-1.5">
												{(
													[
														["generate", "Generate"],
														["package", "Package"],
														["submit", "Submit"],
													] as const
												).map(([action, label]) => (
													<Button
														key={action}
														variant="outline"
														size="sm"
														className="h-7 px-2 text-xs"
														disabled={actionMutation.isPending}
														onClick={() =>
															actionMutation.mutate({ id: row.id, action })
														}
													>
														{label}
													</Button>
												))}
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>
			</CmsEdgeSectionPanel>

			<CmsEdgePageFooter />
		</div>
	);
}
