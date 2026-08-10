import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage() {
	const t = await getTranslations("Auth");

	return (
		<AuthShell>
			<AuthCard title={t("signUpTitle")} description={t("signUpDescription")}>
				<SignUpForm />
			</AuthCard>
		</AuthShell>
	);
}
