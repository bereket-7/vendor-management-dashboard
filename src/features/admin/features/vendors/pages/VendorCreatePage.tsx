"use client";

import { useState } from "react";

import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { useInvalidateVendorCore } from "@/features/admin/shared/vendor-core-feature-query";
import { useCreateVendorMutation } from "@/features/shared/vms/queries";
import { useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";

import {
	formatWizardSyncFailures,
	syncVendorWizardExtras,
} from "../feature/api/vendorWizardSync";
import { createVendorRecord } from "../feature/api/vendorsApi";
import { useVendorCategoriesQuery } from "../feature/queries/useVendorsQuery";
import {
	EMPTY_VENDOR_WIZARD,
	VendorFormWizard,
	type VendorWizardValues,
	wizardValuesToVendorCreatePayload,
} from "./VendorFormWizard";

export function VendorCreatePage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Add vendor">
				<VendorCreateForm />
			</VendorCoreGate>
		);
	}
	return <VendorCreateForm />;
}

function VendorCreateForm() {
	const router = useRouter();
	const live = !isMockEnabled();
	const createVendor = useCreateVendorMutation();
	const invalidateVendorCore = useInvalidateVendorCore();
	const categoriesQ = useVendorCategoriesQuery(live);
	const [values, setValues] = useState<VendorWizardValues>({
		...EMPTY_VENDOR_WIZARD,
	});
	const [error, setError] = useState<string | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	function patch(next: Partial<VendorWizardValues>) {
		setValues((prev) => ({ ...prev, ...next }));
	}

	async function submit() {
		setBusy(true);
		setError(null);
		setStatusMessage(null);
		try {
			if (!live) {
				const vendor = await createVendor.mutateAsync({
					legalName: values.legal_name.trim(),
					tradeName: values.trade_name.trim() || null,
					status: values.status,
					categories: [],
					tags: values.tags
						.split(",")
						.map((item) => item.trim())
						.filter(Boolean),
					country: values.country.trim() || "US",
					city: values.city.trim(),
					taxId: values.tax_id.trim() || null,
					website: values.website.trim() || null,
					description: values.description.trim() || null,
					riskLevel: values.risk_level,
				});
				toast.info(
					"Mock mode: only identity fields saved. Enable vendor-core for full onboarding."
				);
				await invalidateVendorCore();
				toast.success("Vendor created");
				router.push(`/admin/vendors/${vendor.id}`);
				return;
			}

			setStatusMessage("Creating vendor record…");
			const payload = wizardValuesToVendorCreatePayload(values);
			const created = await createVendorRecord(payload);
			const vendorName =
				values.trade_name.trim() || values.legal_name.trim() || "Vendor";

			setStatusMessage("Saving contacts, accounts, and integration…");
			const syncResult = await syncVendorWizardExtras(
				created.id,
				values,
				vendorName
			);

			await invalidateVendorCore();

			if (syncResult.failures.length > 0) {
				const summary = formatWizardSyncFailures(syncResult.failures);
				toast.warning(`Vendor created with partial errors: ${summary}`);
			} else {
				toast.success("Vendor created");
			}

			router.push(`/admin/vendors/${created.id}`);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Unable to create vendor";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
			setStatusMessage(null);
		}
	}

	return (
		<VendorFormWizard
			values={values}
			onChange={patch}
			categories={categoriesQ.data ?? []}
			busy={busy}
			error={error}
			statusMessage={statusMessage}
			onCancelHref="/admin/vendors"
			onSubmit={submit}
		/>
	);
}
