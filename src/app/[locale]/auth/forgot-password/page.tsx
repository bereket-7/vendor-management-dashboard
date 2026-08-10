import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
	const t = await getTranslations("Auth");

	return (
		<AuthShell>
			<AuthCard title={t("forgotTitle")} description={t("forgotDescription")}>
				<ForgotPasswordForm />
			</AuthCard>
		</AuthShell>
	);
}
