"use client";

import { useRef, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	RecordFormChoice,
	RecordFormField,
	RecordFormRow,
	RecordFormSection,
} from "@/components/ui/record-form";
import { useUpdateMemberMutation } from "@/features/admin/features/members/feature/queries/useMembersQuery";
import { memberToWriteBody } from "@/features/admin/features/members/map-member-core";
import type { MemberDetail } from "@/features/admin/features/members/mock-data";
import {
	MemberFamilyDraftEditor,
	type MemberFamilyDraftHandle,
	MemberFamilyEditor,
	type MemberFamilyLiveHandle,
	type PendingFamilyDependent,
} from "@/features/admin/features/members/pages/member-family-editor";
import { cn } from "@/lib/utils";
import type { MemberWriteBody } from "@/lib/vendor-core/types";

const fieldClass = "h-8 w-full bg-background text-sm";

function emptyWrite(): MemberWriteBody {
	return {
		cardholder_id: "",
		person_code: "01",
		first_name: "",
		middle_name: "",
		last_name: "",
		status: "active",
		relationship_code: "18",
		demographics: {
			gender: "M",
			communication_preference: "phone",
		},
		eligibility: { status: "active", secondary_coverage: false },
		plan_coverage: {},
		employment_group: {},
	};
}

function patchNested<K extends keyof MemberWriteBody>(
	body: MemberWriteBody,
	key: K,
	patch: Partial<NonNullable<MemberWriteBody[K]>>
): MemberWriteBody {
	const current = (body[key] ?? {}) as object;
	return { ...body, [key]: { ...current, ...patch } };
}

export function MemberWriteForm({
	member,
	vendorId,
	onVendorIdChange,
	vendors,
	pending,
	submitLabel,
	onSubmit,
	onCancel,
	showFooter = true,
	showFamily,
	requireIdentityFields = false,
	className,
}: {
	member?: MemberDetail;
	vendorId?: string;
	onVendorIdChange?: (id: string) => void;
	vendors?: { id: string; name: string }[];
	pending?: boolean;
	submitLabel: string;
	onSubmit: (
		body: MemberWriteBody,
		pendingFamily?: PendingFamilyDependent[]
	) => void;
	onCancel?: () => void;
	/** When false, parent owns Cancel / Save actions. */
	showFooter?: boolean;
	/** Override family editor visibility (default: when editing existing member). */
	showFamily?: boolean;
	/** Mark Vendor / Cardholder / First / Last as required (create flow). */
	requireIdentityFields?: boolean;
	className?: string;
}) {
	const [body, setBody] = useState<MemberWriteBody>(() =>
		member ? memberToWriteBody(member) : emptyWrite()
	);
	const [pendingFamily, setPendingFamily] = useState<PendingFamilyDependent[]>(
		[]
	);
	const familyFlushRef = useRef<MemberFamilyDraftHandle | null>(null);
	const familyLiveRef = useRef<MemberFamilyLiveHandle | null>(null);
	const demo = body.demographics ?? {};
	const elig = body.eligibility ?? {};
	const plan = body.plan_coverage ?? {};
	const group = body.employment_group ?? {};
	const familyVisible = showFamily ?? Boolean(member?.id);

	async function submitWithFamily() {
		if (requireIdentityFields) {
			if (vendors && onVendorIdChange && !vendorId?.trim()) {
				toast.error("Select a vendor");
				return;
			}
			if (!body.cardholder_id?.trim()) {
				toast.error("Cardholder ID is required");
				return;
			}
			if (!body.person_code?.trim()) {
				toast.error("Person code is required");
				return;
			}
			if (!body.relationship_code?.trim()) {
				toast.error("Relationship code is required");
				return;
			}
			if (!body.first_name?.trim() || !body.last_name?.trim()) {
				toast.error("First and last name are required");
				return;
			}
			if (!body.status?.trim()) {
				toast.error("Member status is required");
				return;
			}
			const d = body.demographics ?? {};
			if (!d.date_of_birth) {
				toast.error("Date of birth is required");
				return;
			}
			if (!d.gender?.trim()) {
				toast.error("Gender is required");
				return;
			}
			if (!d.phone?.trim()) {
				toast.error("Phone is required");
				return;
			}
			const e = body.eligibility ?? {};
			if (!e.status?.trim()) {
				toast.error("Eligibility status is required");
				return;
			}
			if (!e.enrollment_date) {
				toast.error("Enrollment date is required");
				return;
			}
			const p = body.plan_coverage ?? {};
			if (!p.plan_name?.trim()) {
				toast.error("Plan name is required");
				return;
			}
			if (!p.plan_code?.trim()) {
				toast.error("Plan code is required");
				return;
			}
			if (!p.coverage_effective_date) {
				toast.error("Coverage effective date is required");
				return;
			}
		}
		try {
			if (member?.id && familyLiveRef.current) {
				await familyLiveRef.current.flushAndLink();
			}
		} catch {
			return;
		}
		const flushed =
			!member?.id && familyFlushRef.current
				? familyFlushRef.current.flush()
				: pendingFamily;
		onSubmit(body, member?.id ? undefined : flushed);
	}

	return (
		<div
			className={cn(
				"min-h-0 flex-1 space-y-6 overflow-y-auto pr-0.5",
				className
			)}
		>
			{vendors && onVendorIdChange ? (
				<RecordFormSection
					title="Vendor"
					description="Required. Member is created under this vendor."
				>
					<RecordFormRow>
						<RecordFormField label="Vendor" required={requireIdentityFields}>
							<select
								className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
								value={vendorId ?? ""}
								onChange={(e) => onVendorIdChange(e.target.value)}
								required={requireIdentityFields}
								aria-required={requireIdentityFields || undefined}
							>
								<option value="">Select vendor</option>
								{vendors
									.filter((v) => Boolean(v.id))
									.map((v) => (
										<option key={v.id} value={v.id}>
											{v.name}
										</option>
									))}
							</select>
						</RecordFormField>
					</RecordFormRow>
				</RecordFormSection>
			) : null}

			<RecordFormSection
				title="Identity"
				description="Core member identifiers and display name."
			>
				<RecordFormRow>
					<RecordFormField
						label="Cardholder ID"
						required={requireIdentityFields}
					>
						<Input
							className={fieldClass}
							value={body.cardholder_id ?? ""}
							onChange={(e) =>
								setBody({ ...body, cardholder_id: e.target.value })
							}
							placeholder={requireIdentityFields ? "Required" : undefined}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
					<RecordFormField label="Person code" required={requireIdentityFields}>
						<Input
							className={fieldClass}
							value={body.person_code ?? ""}
							onChange={(e) =>
								setBody({ ...body, person_code: e.target.value })
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="External ID">
						<Input
							className={fieldClass}
							value={body.external_id ?? ""}
							onChange={(e) =>
								setBody({ ...body, external_id: e.target.value })
							}
						/>
					</RecordFormField>
					<RecordFormField label="NewTech Member ID">
						<Input
							className={fieldClass}
							value={body.newtech_member_id ?? ""}
							onChange={(e) =>
								setBody({ ...body, newtech_member_id: e.target.value })
							}
							inputMode="numeric"
							maxLength={8}
							placeholder="12345678"
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="NewTech Family ID">
						<Input
							className={fieldClass}
							value={body.newtech_family_id ?? ""}
							onChange={(e) =>
								setBody({ ...body, newtech_family_id: e.target.value })
							}
							inputMode="numeric"
							maxLength={8}
							placeholder="12345678"
						/>
					</RecordFormField>
					<RecordFormField
						label="Relationship code"
						required={requireIdentityFields}
					>
						<Input
							className={fieldClass}
							value={body.relationship_code ?? ""}
							onChange={(e) =>
								setBody({ ...body, relationship_code: e.target.value })
							}
							placeholder="18 = Self, 01 = Spouse…"
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="First name" required={requireIdentityFields}>
						<Input
							className={fieldClass}
							value={body.first_name ?? ""}
							onChange={(e) => setBody({ ...body, first_name: e.target.value })}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Middle name">
						<Input
							className={fieldClass}
							value={body.middle_name ?? ""}
							onChange={(e) =>
								setBody({ ...body, middle_name: e.target.value })
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Last name" required={requireIdentityFields}>
						<Input
							className={fieldClass}
							value={body.last_name ?? ""}
							onChange={(e) => setBody({ ...body, last_name: e.target.value })}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Status" required={requireIdentityFields}>
						<RecordFormChoice
							tone="primary"
							value={body.status || "active"}
							onChange={(v) => setBody({ ...body, status: v })}
							options={[
								{ value: "active", label: "Active" },
								{ value: "pending", label: "Pending" },
								{ value: "inactive", label: "Inactive" },
								{ value: "termed", label: "Termed" },
							]}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="PCP name">
						<Input
							className={fieldClass}
							value={body.pcp_name ?? ""}
							onChange={(e) => setBody({ ...body, pcp_name: e.target.value })}
						/>
					</RecordFormField>
					<RecordFormField label="PCP NPI">
						<Input
							className={fieldClass}
							value={body.pcp_npi ?? ""}
							onChange={(e) => setBody({ ...body, pcp_npi: e.target.value })}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Program">
						<Input
							className={fieldClass}
							value={body.program ?? ""}
							onChange={(e) => setBody({ ...body, program: e.target.value })}
						/>
					</RecordFormField>
					<RecordFormField label="LOB">
						<Input
							className={fieldClass}
							value={body.lob ?? ""}
							onChange={(e) => setBody({ ...body, lob: e.target.value })}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Plan type">
						<Input
							className={fieldClass}
							value={body.plan_type ?? ""}
							onChange={(e) => setBody({ ...body, plan_type: e.target.value })}
						/>
					</RecordFormField>
					<RecordFormField label="Source system">
						<Input
							className={fieldClass}
							value={body.source_system ?? ""}
							onChange={(e) =>
								setBody({ ...body, source_system: e.target.value })
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Member since">
						<Input
							type="date"
							className={fieldClass}
							value={body.member_since ?? ""}
							onChange={(e) =>
								setBody({
									...body,
									member_since: e.target.value || null,
								})
							}
						/>
					</RecordFormField>
				</RecordFormRow>
			</RecordFormSection>

			<RecordFormSection
				title="Demographics"
				description="Contact, address, and demographic attributes."
			>
				<RecordFormRow>
					<RecordFormField
						label="Date of birth"
						required={requireIdentityFields}
					>
						<Input
							type="date"
							className={fieldClass}
							value={demo.date_of_birth ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										date_of_birth: e.target.value || null,
									})
								)
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
					<RecordFormField label="Gender" required={requireIdentityFields}>
						<RecordFormChoice
							value={demo.gender || "M"}
							onChange={(v) =>
								setBody(patchNested(body, "demographics", { gender: v }))
							}
							options={[
								{ value: "M", label: "Male" },
								{ value: "F", label: "Female" },
								{ value: "O", label: "Other" },
								{ value: "U", label: "Unknown" },
							]}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="SSN last 4">
						<Input
							className={fieldClass}
							value={demo.ssn_last4 ?? ""}
							maxLength={4}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										ssn_last4: e.target.value.replace(/\D/g, "").slice(0, 4),
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Alternate ID">
						<Input
							className={fieldClass}
							value={demo.alternate_id ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										alternate_id: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Phone" required={requireIdentityFields}>
						<Input
							className={fieldClass}
							value={demo.phone ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", { phone: e.target.value })
								)
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
					<RecordFormField label="Email">
						<Input
							type="email"
							className={fieldClass}
							value={demo.email ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", { email: e.target.value })
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Address line 1">
						<Input
							className={fieldClass}
							value={demo.address_line1 ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										address_line1: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Address line 2">
						<Input
							className={fieldClass}
							value={demo.address_line2 ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										address_line2: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="City">
						<Input
							className={fieldClass}
							value={demo.city ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", { city: e.target.value })
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="State">
						<Input
							className={fieldClass}
							value={demo.state ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", { state: e.target.value })
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Postal code">
						<Input
							className={fieldClass}
							value={demo.postal_code ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										postal_code: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Preferred name">
						<Input
							className={fieldClass}
							value={demo.preferred_name ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										preferred_name: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Preferred language">
						<Input
							className={fieldClass}
							value={demo.preferred_language ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										preferred_language: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Communication">
						<RecordFormChoice
							value={demo.communication_preference || "phone"}
							onChange={(v) =>
								setBody(
									patchNested(body, "demographics", {
										communication_preference: v,
									})
								)
							}
							options={[
								{ value: "phone", label: "Phone" },
								{ value: "email", label: "Email" },
								{ value: "mail", label: "Mail" },
								{ value: "sms", label: "SMS" },
							]}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Race">
						<Input
							className={fieldClass}
							value={demo.race ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", { race: e.target.value })
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Ethnicity">
						<Input
							className={fieldClass}
							value={demo.ethnicity ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										ethnicity: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Emergency contact">
						<Input
							className={fieldClass}
							value={demo.emergency_contact_name ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										emergency_contact_name: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Emergency phone">
						<Input
							className={fieldClass}
							value={demo.emergency_contact_phone ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										emergency_contact_phone: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Emergency relation">
						<Input
							className={fieldClass}
							value={demo.emergency_contact_relation ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										emergency_contact_relation: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Mailing address 1">
						<Input
							className={fieldClass}
							value={demo.mailing_address_line1 ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										mailing_address_line1: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Mailing address 2">
						<Input
							className={fieldClass}
							value={demo.mailing_address_line2 ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										mailing_address_line2: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Mailing city">
						<Input
							className={fieldClass}
							value={demo.mailing_city ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										mailing_city: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Mailing state">
						<Input
							className={fieldClass}
							value={demo.mailing_state ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										mailing_state: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Mailing postal">
						<Input
							className={fieldClass}
							value={demo.mailing_postal_code ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "demographics", {
										mailing_postal_code: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
			</RecordFormSection>

			<RecordFormSection
				title="Eligibility"
				description="Coverage eligibility status and dates."
			>
				<RecordFormRow>
					<RecordFormField label="Status" required={requireIdentityFields}>
						<RecordFormChoice
							tone="primary"
							value={elig.status || "active"}
							onChange={(v) =>
								setBody(patchNested(body, "eligibility", { status: v }))
							}
							options={[
								{ value: "active", label: "Active" },
								{ value: "pending", label: "Pending" },
								{ value: "inactive", label: "Inactive" },
								{ value: "terminated", label: "Terminated" },
							]}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Status effective">
						<Input
							type="date"
							className={fieldClass}
							value={elig.status_effective_date ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "eligibility", {
										status_effective_date: e.target.value || null,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Status term">
						<Input
							type="date"
							className={fieldClass}
							value={elig.status_term_date ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "eligibility", {
										status_term_date: e.target.value || null,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField
						label="Enrollment date"
						required={requireIdentityFields}
					>
						<Input
							type="date"
							className={fieldClass}
							value={elig.enrollment_date ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "eligibility", {
										enrollment_date: e.target.value || null,
									})
								)
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
					<RecordFormField label="Disenrollment">
						<Input
							type="date"
							className={fieldClass}
							value={elig.disenrollment_date ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "eligibility", {
										disenrollment_date: e.target.value || null,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Secondary coverage">
						<RecordFormChoice
							value={elig.secondary_coverage ? "yes" : "no"}
							onChange={(v) =>
								setBody(
									patchNested(body, "eligibility", {
										secondary_coverage: v === "yes",
									})
								)
							}
							options={[
								{ value: "no", label: "No" },
								{ value: "yes", label: "Yes" },
							]}
						/>
					</RecordFormField>
				</RecordFormRow>
			</RecordFormSection>

			<RecordFormSection
				title="Plan coverage"
				description="Active plan assignment and coverage window."
			>
				<RecordFormRow>
					<RecordFormField label="Plan name" required={requireIdentityFields}>
						<Input
							className={fieldClass}
							value={plan.plan_name ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										plan_name: e.target.value,
									})
								)
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
					<RecordFormField label="Plan code" required={requireIdentityFields}>
						<Input
							className={fieldClass}
							value={plan.plan_code ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										plan_code: e.target.value,
									})
								)
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Benefit package">
						<Input
							className={fieldClass}
							maxLength={128}
							value={plan.benefit_package ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										benefit_package: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Coverage level">
						<Input
							className={fieldClass}
							maxLength={64}
							value={plan.coverage_level ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										coverage_level: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Level code">
						<Input
							className={fieldClass}
							maxLength={16}
							value={plan.coverage_level_code ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										coverage_level_code: e.target.value.slice(0, 16),
									})
								)
							}
							placeholder="Max 16 characters"
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField
						label="Coverage effective"
						required={requireIdentityFields}
					>
						<Input
							type="date"
							className={fieldClass}
							value={plan.coverage_effective_date ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										coverage_effective_date: e.target.value || null,
									})
								)
							}
							required={requireIdentityFields}
							aria-required={requireIdentityFields || undefined}
						/>
					</RecordFormField>
					<RecordFormField label="Coverage term">
						<Input
							type="date"
							className={fieldClass}
							value={plan.coverage_term_date ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "plan_coverage", {
										coverage_term_date: e.target.value || null,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
			</RecordFormSection>

			<RecordFormSection
				title="Employment / group"
				description="Account group and employment classification."
			>
				<RecordFormRow>
					<RecordFormField label="Group ID">
						<Input
							className={fieldClass}
							value={group.group_id ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										group_id: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Group name">
						<Input
							className={fieldClass}
							value={group.group_name ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										group_name: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Client ID">
						<Input
							className={fieldClass}
							value={group.client_id ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										client_id: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Account type">
						<Input
							className={fieldClass}
							value={group.account_type ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										account_type: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Account status">
						<Input
							className={fieldClass}
							value={group.account_status ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										account_status: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
					<RecordFormField label="Member type">
						<Input
							className={fieldClass}
							value={group.member_type ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										member_type: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
				<RecordFormRow>
					<RecordFormField label="Employee type">
						<Input
							className={fieldClass}
							value={group.employee_type ?? ""}
							onChange={(e) =>
								setBody(
									patchNested(body, "employment_group", {
										employee_type: e.target.value,
									})
								)
							}
						/>
					</RecordFormField>
				</RecordFormRow>
			</RecordFormSection>

			{familyVisible && member?.id ? (
				<MemberFamilyEditor
					memberId={member.id}
					vendorId={vendorId || member.vendorId}
					subscriberCardholderId={member.memberId}
					planName={member.planName}
					program={member.program}
					showSync={false}
					defaultSubTab="add"
					flushRef={familyLiveRef}
				/>
			) : null}

			{familyVisible && !member?.id ? (
				<div className="space-y-2">
					<div className="px-0.5">
						<p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
							Family / dependents
						</p>
						<p className="mt-0.5 text-[11px] text-muted-foreground/80">
							Optional. Stage dependents now — created and linked after save.
						</p>
					</div>
					<MemberFamilyDraftEditor
						vendorId={vendorId}
						subscriberCardholderId={body.cardholder_id}
						value={pendingFamily}
						onChange={setPendingFamily}
						flushRef={familyFlushRef}
					/>
				</div>
			) : null}

			{showFooter ? (
				<div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-border/50 bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					{onCancel ? (
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					) : null}
					<Button disabled={pending} onClick={submitWithFamily}>
						{submitLabel}
					</Button>
				</div>
			) : null}
		</div>
	);
}

export function MemberEditPanel({
	member,
	onCancel,
}: {
	member: MemberDetail;
	onCancel?: () => void;
}) {
	const update = useUpdateMemberMutation();
	return (
		<MemberWriteForm
			key={member.id}
			member={member}
			pending={update.isPending}
			submitLabel="Save changes"
			requireIdentityFields
			onCancel={onCancel}
			onSubmit={(body) =>
				update.mutate(
					{ id: member.id, body },
					{
						onSuccess: () => {
							toast.success("Member updated");
							onCancel?.();
						},
						onError: (err) =>
							toast.error(err instanceof Error ? err.message : "Update failed"),
					}
				)
			}
		/>
	);
}
