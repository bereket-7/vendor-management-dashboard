"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowRight,
	CheckCircle2,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
	AuthTextInput,
	authLabelClass,
	authOutlineButtonClass,
	authPrimaryButtonClass,
} from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { clearDevSignedOutCookie } from "@/lib/auth/dev-session";
import { isMockAuthEnabled } from "@/lib/auth/mock-auth";
import { AUTH_PATHS } from "@/lib/auth/paths";
import { isNestApiEnabled } from "@/lib/mock-mode";
import { getPostLoginPath } from "@/lib/post-login-path";
import { isDjangoShellAuthEnabled } from "@/lib/vendor-core/auth-mode";
import {
	VendorCoreApiError,
	vendorCoreLogin,
	vendorCoreMe,
} from "@/lib/vendor-core/client";

const nestLoginSchema = z.object({
	identifier: z.string().email("Enter a valid work email"),
	password: z.string().min(8, "At least 8 characters"),
});

const djangoLoginSchema = z.object({
	identifier: z.string().min(1, "Enter your username"),
	password: z.string().min(1, "Enter your password"),
});

type LoginFormValues = z.infer<typeof nestLoginSchema>;

export function LoginForm() {
	const locale = useLocale();
	const t = useTranslations("Auth");
	const searchParams = useSearchParams();
	const invited = searchParams.get("invited") === "1";
	const invitedEmail = searchParams.get("email")?.trim() ?? "";
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showInvitedBanner, setShowInvitedBanner] = useState(invited);

	const mockAuth = isMockAuthEnabled();
	const nestLogin = isNestApiEnabled();
	const djangoLogin = isDjangoShellAuthEnabled();

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(djangoLogin ? djangoLoginSchema : nestLoginSchema),
		defaultValues: { identifier: invitedEmail, password: "" },
	});

	useEffect(() => {
		if (invitedEmail) {
			form.setValue("identifier", invitedEmail);
		}
	}, [form, invitedEmail]);

	useEffect(() => {
		setShowInvitedBanner(invited);
	}, [invited]);

	function enterDevSession() {
		clearDevSignedOutCookie();
		toast.success("Signed in");
		window.location.assign(getPostLoginPath(locale));
	}

	async function onSubmit(values: LoginFormValues) {
		setIsLoading(true);
		try {
			if (mockAuth && !nestLogin && !djangoLogin) {
				enterDevSession();
				return;
			}

			if (djangoLogin) {
				await vendorCoreLogin({
					username: values.identifier.trim(),
					password: values.password,
				});
				const me = await vendorCoreMe();
				clearDevSignedOutCookie();
				toast.success("Signed in");
				if (me.must_change_password) {
					window.location.assign(`/${locale}${AUTH_PATHS.changePassword}`);
				} else {
					window.location.assign(getPostLoginPath(locale));
				}
				return;
			}

			const result = await authClient.signIn.email({
				email: values.identifier,
				password: values.password,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Sign in failed");
				return;
			}

			clearDevSignedOutCookie();
			toast.success("Signed in");
			window.location.assign(getPostLoginPath(locale));
		} catch (err) {
			const message =
				err instanceof VendorCoreApiError
					? err.message
					: "Something went wrong";
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}

	const identifierLabel = djangoLogin ? "Username" : "Email";
	const identifierPlaceholder = djangoLogin
		? "Enter your username"
		: "you@company.com";
	const IdentifierIcon = djangoLogin ? User : Mail;
	const identifierType = djangoLogin ? ("text" as const) : ("email" as const);
	const identifierAutoComplete = djangoLogin ? "username" : "email";

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
				{showInvitedBanner ? (
					<div className="flex items-start gap-2.5 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 text-sm">
						<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
						<div className="space-y-0.5">
							<p className="font-medium text-foreground">
								{t("invitedBannerTitle")}
							</p>
							<p className="text-[13px] text-muted-foreground">
								{t("invitedBannerDescription")}
							</p>
						</div>
					</div>
				) : null}

				<FormField
					control={form.control}
					name="identifier"
					render={({ field }) => (
						<FormItem className="gap-1.5">
							<FormLabel className={authLabelClass}>
								{identifierLabel}
							</FormLabel>
							<FormControl>
								<AuthTextInput
									icon={IdentifierIcon}
									type={identifierType}
									placeholder={identifierPlaceholder}
									autoComplete={identifierAutoComplete}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="gap-1.5">
							<div className="flex items-center justify-between gap-2">
								<FormLabel className={authLabelClass}>Password</FormLabel>
								<Link
									href={AUTH_PATHS.forgotPassword}
									className="text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
								>
									Forgot password
								</Link>
							</div>
							<FormControl>
								<AuthTextInput
									icon={Lock}
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									autoComplete="current-password"
									trailing={
										<button
											type="button"
											onClick={() => setShowPassword((v) => !v)}
											className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
											aria-label={
												showPassword ? "Hide password" : "Show password"
											}
										>
											{showPassword ? (
												<EyeOff className="size-4" strokeWidth={1.75} />
											) : (
												<Eye className="size-4" strokeWidth={1.75} />
											)}
										</button>
									}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-3 pt-2">
					<Button
						type="submit"
						className={authPrimaryButtonClass}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Signing in…
							</>
						) : (
							<>
								Sign in
								<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
							</>
						)}
					</Button>

					{mockAuth && !nestLogin && !djangoLogin ? (
						<Button
							type="button"
							variant="outline"
							className={authOutlineButtonClass}
							disabled={isLoading}
							onClick={enterDevSession}
						>
							Continue as Admin User
						</Button>
					) : null}
				</div>
			</form>
		</Form>
	);
}
