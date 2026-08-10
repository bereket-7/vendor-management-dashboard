import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
	const t = await getTranslations("Auth");

	return (
		<AuthShell>
			<AuthCard title={t("loginTitle")} description={t("loginDescription")}>
				<LoginForm />
			</AuthCard>
		</AuthShell>
	);
}
