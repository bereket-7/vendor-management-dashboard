"use client";

import { useSearchParams } from "next/navigation";

import { ContractsPage } from "@/features/admin/features/contracts/pages/ContractsPage";

export default function Page() {
	const searchParams = useSearchParams();
	const initialCreateOpen = searchParams.get("create") === "1";

	return <ContractsPage initialCreateOpen={initialCreateOpen} />;
}
