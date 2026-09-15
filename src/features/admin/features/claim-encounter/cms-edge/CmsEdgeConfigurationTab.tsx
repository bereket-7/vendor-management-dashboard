"use client";

import { useEffect, useState } from "react";

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
import { useSeedCmsEdgeDemo } from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { CmsEdgeSettingsUpdateInput } from "@/lib/vendor-core/types";

const domain = "cms-edge";

function validateSettingsForm(form: CmsEdgeSettingsUpdateInput): string | null {
	const hios = (form.hios_issuer_id ?? "").trim();
	const state = (form.state_code ?? "").trim();
	if (hios.length > 16) {
		return "HIOS Issuer ID must be 16 characters or fewer.";
	}
	if (state.length > 2) {
		return "State code must be 2 characters (e.g. MD).";
	}
	return null;
}

export function CmsEdgeConfigurationTab() {
	const useMock = isMockEnabled();
	const queryClient = useQueryClient();
	const settingsQuery = useQuery({
		queryKey: featureQueryKey(domain, "settings"),
		queryFn: () => vendorCoreApi.getCmsEdgeSettings(),
		enabled: !useMock,
		networkMode: "always",
		retry: 1,
	});
	const periodsQuery = useQuery({
		queryKey: featureQueryKey(domain, "reportingPeriods"),
		queryFn: () =>
			vendorCoreApi.listCmsEdgeReportingPeriods({ limit: 50, offset: 0 }),
		enabled: !useMock,
		networkMode: "always",
		retry: 1,
	});

	const [form, setForm] = useState<CmsEdgeSettingsUpdateInput>({});

	useEffect(() => {
		const s = settingsQuery.data;
		if (!s) return;
		setForm({
			hios_issuer_id: s.hios_issuer_id,
			state_code: s.state_code,
			marketplace: s.marketplace,
			current_reporting_period: s.current_reporting_period,
			medical_enabled: s.medical_enabled,
			pharmacy_enabled: s.pharmacy_enabled,
			enrollment_enabled: s.enrollment_enabled,
			sdr_enabled: s.sdr_enabled,
			environment: s.environment,
		});
	}, [settingsQuery.data]);

	const invalidateEdge = () => {
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "settings"),
		});
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "reportingPeriods"),
		});
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "overviewShell"),
		});
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "overviewLivePanels"),
		});
		void queryClient.invalidateQueries({
			queryKey: featureQueryKey(domain, "filePackages"),
		});
	};

	const saveMutation = useMutation({
		mutationFn: () => {
			const err = validateSettingsForm(form);
			if (err) throw new Error(err);
			return vendorCoreApi.updateCmsEdgeSettings({
				...form,
				hios_issuer_id: (form.hios_issuer_id ?? "").trim(),
				state_code: (form.state_code ?? "").trim().toUpperCase(),
				marketplace: (form.marketplace ?? "").trim(),
				current_reporting_period: (form.current_reporting_period ?? "").trim(),
			});
		},
		onSuccess: (saved) => {
			const period = (saved.current_reporting_period || "").trim();
			toast.success(
				period
					? `Settings saved. Reporting period “${period}” synced to the table.`
					: "CMS EDGE settings saved"
			);
			invalidateEdge();
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to save settings");
		},
	});

	const seedMutation = useSeedCmsEdgeDemo();

	const periods = periodsQuery.data?.results ?? [];

	if (useMock) {
		return (
			<div className={CMS_EDGE_PAGE_STACK}>
				<div
					className={cn(
						CMS_EDGE_PANEL_CLASS,
						"p-6 text-sm text-muted-foreground"
					)}
				>
					Configuration is mock-backed. Turn off `NEXT_PUBLIC_USE_MOCK` to edit
					live CMS EDGE settings.
				</div>
				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<CmsEdgeSectionPanel
				title="EDGE Settings"
				subtitle="HIOS, marketplace, environment, and enabled file types."
				action={
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="h-8"
							disabled={seedMutation.isPending}
							onClick={() => {
								seedMutation.mutate(
									{ force: true },
									{
										onSuccess: (result) => {
											toast.success(
												`Demo EDGE data seeded (${result.reporting_period || "period"}, HIOS ${result.hios_issuer_id || "—"}).`
											);
										},
										onError: (err) => {
											toast.error(
												err instanceof Error
													? err.message
													: "Seed failed. Deploy POST /cms-edge/settings/seed/ then retry."
											);
										},
									}
								);
							}}
						>
							{seedMutation.isPending ? "Seeding…" : "Seed demo EDGE data"}
						</Button>
						<Button
							size="sm"
							className="h-8"
							disabled={saveMutation.isPending || settingsQuery.isLoading}
							onClick={() => saveMutation.mutate()}
						>
							{saveMutation.isPending ? "Saving…" : "Save"}
						</Button>
					</div>
				}
			>
				{settingsQuery.isLoading ? (
					<p className="px-4 py-8 text-center text-sm text-muted-foreground">
						Loading settings…
					</p>
				) : settingsQuery.isError ? (
					<p className="px-4 py-8 text-center text-sm text-destructive">
						Failed to load settings.
					</p>
				) : (
					<div className="grid gap-4 border-t border-border/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-1.5">
							<Label htmlFor="hios">HIOS Issuer ID</Label>
							<Input
								id="hios"
								maxLength={16}
								placeholder="e.g. 16696"
								value={form.hios_issuer_id ?? ""}
								onChange={(e) =>
									setForm((f) => ({ ...f, hios_issuer_id: e.target.value }))
								}
							/>
							<p className="text-xs text-muted-foreground">
								Max 16 characters.
							</p>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="state">State code</Label>
							<Input
								id="state"
								maxLength={2}
								placeholder="e.g. MD"
								value={form.state_code ?? ""}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										state_code: e.target.value.toUpperCase(),
									}))
								}
							/>
							<p className="text-xs text-muted-foreground">
								Exactly 2 letters.
							</p>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="marketplace">Marketplace</Label>
							<Input
								id="marketplace"
								maxLength={64}
								placeholder="e.g. FFM"
								value={form.marketplace ?? ""}
								onChange={(e) =>
									setForm((f) => ({ ...f, marketplace: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="period">Current reporting period</Label>
							<Input
								id="period"
								maxLength={32}
								placeholder="e.g. Q2 2027"
								value={form.current_reporting_period ?? ""}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										current_reporting_period: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Environment</Label>
							<Select
								value={form.environment || "test"}
								onValueChange={(value) =>
									setForm((f) => ({ ...f, environment: value }))
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="test">test</SelectItem>
									<SelectItem value="validation">validation</SelectItem>
									<SelectItem value="production">production</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 sm:col-span-2 lg:col-span-3">
							<Label>Enabled file types</Label>
							<div className="flex flex-wrap gap-4 text-sm">
								{(
									[
										["medical_enabled", "Medical"],
										["pharmacy_enabled", "Pharmacy"],
										["enrollment_enabled", "Enrollment"],
										["sdr_enabled", "SDR"],
									] as const
								).map(([key, label]) => (
									<label key={key} className="inline-flex items-center gap-2">
										<input
											type="checkbox"
											checked={Boolean(form[key])}
											onChange={(e) =>
												setForm((f) => ({ ...f, [key]: e.target.checked }))
											}
										/>
										{label}
									</label>
								))}
							</div>
						</div>
					</div>
				)}
			</CmsEdgeSectionPanel>

			<CmsEdgeSectionPanel
				title="Reporting Periods"
				subtitle="Periods available for EDGE overview and file packages. Use Seed demo EDGE data if empty."
			>
				<CmsEdgeTableScroll className="border-t border-border/50">
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className={CMS_EDGE_TABLE_CLASS}
					>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Code
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Label
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
									Start
								</TableHead>
								<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>End</TableHead>
								<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4")}>
									Current
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{periodsQuery.isLoading ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										Loading periods…
									</TableCell>
								</TableRow>
							) : periods.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="px-3 py-8 text-center text-muted-foreground"
									>
										No reporting periods. Click &quot;Seed demo EDGE data&quot;
										above.
									</TableCell>
								</TableRow>
							) : (
								periods.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="px-3 py-2.5 font-medium">
											{row.code}
										</TableCell>
										<TableCell className="px-3 py-2.5">{row.label}</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.start_date}
										</TableCell>
										<TableCell className="px-3 py-2.5 tabular-nums">
											{row.end_date}
										</TableCell>
										<TableCell className="px-3 py-2.5 pr-4">
											{row.is_current ? "Yes" : "—"}
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
