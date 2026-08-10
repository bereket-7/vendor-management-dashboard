import type { MemberStatus, MemberSummary } from "@/features/admin/features/members/mock-data";
import type { MemberCoverageDto } from "@/lib/vendor-core/types";
import { vendorLabel } from "@/lib/vendor-core/types";

function coverageVendor(row: MemberCoverageDto): string {
	const ef = row.eligibility_file;
	if (ef && typeof ef === "object") {
		return vendorLabel(ef.vendor);
	}
	if (row.eligibility_file_id) {
		return row.eligibility_file_id.slice(0, 8);
	}
	return "—";
}

function mapStatus(row: MemberCoverageDto): MemberStatus {
	if (row.deleted_at) return "termed";
	const code = (row.maintenance_type_code || "").toUpperCase();
	if (code === "024" || code === "025") return "termed";
	if (code === "021" || code === "001") return "pending";
	if (row.is_visible === false) return "inactive";
	return "active";
}

/** Map vendor-core member coverages into the Members directory row shape. */
export function memberCoveragesToSummaries(
	rows: MemberCoverageDto[]
): MemberSummary[] {
	return rows.map((row) => {
		const firstName = row.member_first_name?.trim() || "—";
		const lastName = row.member_last_name?.trim() || "—";
		const group = row.group_or_policy_number?.trim() || "—";
		return {
			id: row.id,
			memberId: row.subscriber_id || row.reference_id || row.id.slice(0, 8),
			firstName,
			lastName,
			dob: "—",
			gender: "Unknown",
			ssnLast4: "****",
			phone: "—",
			email: "",
			addressLine1: "—",
			city: "—",
			state: "—",
			zip: "—",
			status: mapStatus(row),
			program: "DHCF",
			planName: group !== "—" ? `Group ${group}` : "—",
			planType: row.maintenance_type_code || "—",
			lob: "—",
			pcpName: "—",
			pcpNpi: "—",
			memberSince: row.created_at
				? new Date(row.created_at).toISOString().slice(0, 10)
				: "—",
			lastClaimDate: null,
			claimsYtd: 0,
			paidYtd: 0,
			vendorSource: coverageVendor(row),
		};
	});
}
