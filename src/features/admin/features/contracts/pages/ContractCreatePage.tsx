"use client";

import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

/** Legacy route — redirect to contracts list with create modal open. */
export function ContractCreatePage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/admin/contracts?create=1");
	}, [router]);

	return null;
}
