"use client";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	useDeleteMemberMutation,
	useSeedMembersMutation,
	useVendorCoreVendors,
} from "@/features/admin/features/members/feature/queries/useMembersQuery";
import { Link, useRouter } from "@/i18n/navigation";
import { isMembersMockEnabled } from "@/lib/mock-mode";

export function MemberDirectoryActions() {
	const seed = useSeedMembersMutation();
	const vendorsQ = useVendorCoreVendors();
	const defaultVendorId = vendorsQ.data?.[0]?.id;
	const useApi = !isMembersMockEnabled();

	return (
		<>
			{useApi ? (
				<Button
					variant="outline"
					size="sm"
					className="h-9"
					disabled={seed.isPending}
					onClick={() =>
						seed.mutate(
							{
								vendor_id: defaultVendorId,
								count: 2,
								force: true,
							},
							{
								onSuccess: (res) =>
									toast.success(
										res?.created != null
											? `Seeded ${res.created} member(s)`
											: "Seed complete"
									),
								onError: (err) =>
									toast.error(err instanceof Error ? err.message : "Seed failed"),
							}
						)
					}
				>
					Seed
				</Button>
			) : null}
			<Button size="sm" className="h-9" asChild>
				<Link href="/admin/members/new">Add member</Link>
			</Button>
		</>
	);
}

export function MemberListRowDelete({
	memberId,
}: {
	memberId: string;
	/** @deprecated unused — edit opens detail Edit tab */
	firstName?: string;
	/** @deprecated unused — edit opens detail Edit tab */
	lastName?: string;
}) {
	const router = useRouter();
	const remove = useDeleteMemberMutation();

	return (
		<div
			className="flex items-center justify-end gap-0.5"
			onClick={(e) => e.stopPropagation()}
		>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7"
				title="Edit member"
				onClick={() =>
					router.push(`/admin/members/${encodeURIComponent(memberId)}?edit=1`)
				}
			>
				<Pencil className="size-3.5" />
				<span className="sr-only">Edit</span>
			</Button>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7 text-destructive"
				title="Delete member"
				disabled={remove.isPending}
				onClick={() => {
					if (
						typeof window !== "undefined" &&
						!window.confirm("Soft-delete this member?")
					) {
						return;
					}
					remove.mutate(memberId, {
						onSuccess: () => toast.success("Member deleted"),
						onError: (err) =>
							toast.error(err instanceof Error ? err.message : "Delete failed"),
					});
				}}
			>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Delete</span>
			</Button>
		</div>
	);
}
