import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleAwareHome } from "@/features/admin/components/ModuleAwareHome";
import { getServerSession } from "@/lib/auth/server-session";
import { getLoginPath } from "@/lib/routes";

/** Locale home — module-aware (eligibility → TPA/TPV, vendor → dashboard). */
export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const session = await getServerSession();
	if (!session) {
		redirect(getLoginPath(locale));
	}

	return (
		<AdminShell>
			<ModuleAwareHome />
		</AdminShell>
	);
}
