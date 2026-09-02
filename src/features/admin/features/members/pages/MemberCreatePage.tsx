"use client";

import { useState } from "react";

import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { createMemberFamilyLink } from "@/features/admin/features/members/feature/api/membersApi";
import {
	useCreateMemberMutation,
	useVendorCoreVendors,
} from "@/features/admin/features/members/feature/queries/useMembersQuery";
import {
	EMPTY_MEMBER_WIZARD,
	MemberFormWizard,
	type MemberWizardValues,
} from "@/features/admin/features/members/pages/MemberFormWizard";
import type { PendingFamilyDependent } from "@/features/admin/features/members/pages/member-family-editor";
import { useRouter } from "@/i18n/navigation";
import { isMembersMockEnabled } from "@/lib/mock-mode";
import { useAdminModuleStore } from "@/stores/admin-module-store";

function MemberCreatePageInner() {
	const router = useRouter();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [values, setValues] = useState<MemberWizardValues>(() => ({
		...EMPTY_MEMBER_WIZARD,
		write: {
			...EMPTY_MEMBER_WIZARD.write,
			program: programFilter,
		},
	}));
	const [pendingFamily, setPendingFamily] = useState<PendingFamilyDependent[]>(
		[]
	);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const create = useCreateMemberMutation();
	const vendorsQ = useVendorCoreVendors();
	const vendors = (vendorsQ.data ?? [])
		.filter((v) => Boolean(v.id))
		.map((v) => ({
			id: v.id,
			name: v.name || v.legal_name || v.id,
		}));

	function patchValues(patch: Partial<MemberWizardValues>) {
		setValues((prev) => ({ ...prev, ...patch }));
	}

	async function handleSubmit(flushedFamily: PendingFamilyDependent[]) {
		const body = values.write;
		if (!values.vendor_id.trim()) {
			setError("Select a vendor.");
			toast.error("Select a vendor");
			return;
		}
		if (!body.cardholder_id?.trim()) {
			setError("Cardholder ID is required.");
			toast.error("Cardholder ID is required");
			return;
		}
		if (!body.first_name?.trim() || !body.last_name?.trim()) {
			setError("First and last name are required.");
			toast.error("First and last name are required");
			return;
		}

		setBusy(true);
		setError(null);
		try {
			const detail = await create.mutateAsync({
				...body,
				vendor_id: values.vendor_id,
			});
			if (!detail?.id) {
				setError("Member created but no id returned.");
				toast.error("Member created but no id returned");
				router.push("/admin/members");
				return;
			}

			let linked = 0;
			let failed = 0;
			for (const dep of flushedFamily) {
				try {
					let dependentId = dep.dependentId;
					if (dep.kind === "create") {
						const created = await create.mutateAsync({
							vendor_id: values.vendor_id,
							cardholder_id:
								dep.cardholderId ||
								`${body.cardholder_id}-D${linked + 1}`.slice(0, 32),
							person_code: "02",
							first_name: dep.firstName,
							last_name: dep.lastName,
							status: "active",
							relationship_code: dep.relationshipCode,
							demographics: {},
							eligibility: { status: "active" },
							plan_coverage: {},
							employment_group: {},
						});
						if (!created?.id) {
							failed += 1;
							continue;
						}
						dependentId = created.id;
					}
					if (!dependentId) {
						failed += 1;
						continue;
					}
					await createMemberFamilyLink(detail.id, {
						dependent_id: dependentId,
						relationship_code: dep.relationshipCode,
						relationship_label: dep.relationshipLabel,
					});
					linked += 1;
				} catch (err) {
					failed += 1;
					console.error("Family dependent link failed", err);
					toast.error(
						err instanceof Error
							? err.message
							: "A dependent failed to create/link"
					);
				}
			}

			if (flushedFamily.length === 0) {
				toast.success("Member created");
			} else if (failed === 0) {
				toast.success(
					`Member created with ${linked} dependent${linked === 1 ? "" : "s"}`
				);
			} else if (linked > 0) {
				toast.warning(
					`Member created; linked ${linked}, ${failed} dependent(s) failed`
				);
			} else {
				toast.warning("Member created but dependents failed to link");
			}

			router.push(`/admin/members/${detail.id}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Create failed";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<MemberFormWizard
			values={values}
			pendingFamily={pendingFamily}
			onChange={patchValues}
			onPendingFamilyChange={setPendingFamily}
			vendors={vendors}
			busy={busy || create.isPending}
			error={error}
			onCancelHref="/admin/members"
			onSubmit={handleSubmit}
		/>
	);
}

export function MemberCreatePage() {
	if (!isMembersMockEnabled()) {
		return (
			<VendorCoreGate title="Add member">
				<MemberCreatePageInner />
			</VendorCoreGate>
		);
	}
	return <MemberCreatePageInner />;
}
