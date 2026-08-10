"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { AUTH_PATHS } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
	email: z.string().email("Enter a valid work email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	async function onSubmit(values: LoginFormValues) {
		setIsLoading(true);
		try {
			const result = await authClient.signIn.email({
				email: values.email,
				password: values.password,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Sign in failed");
				return;
			}

			toast.success("Signed in successfully");
			router.push("/");
			router.refresh();
		} catch {
			toast.error("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel className="text-sm font-medium">Work email</FormLabel>
							<FormControl>
								<div className="relative">
									<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										type="email"
										placeholder="you@company.com"
										autoComplete="email"
										className="h-11 pl-9"
										{...field}
									/>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<FormLabel className="text-sm font-medium">Password</FormLabel>
								<Link
									href={AUTH_PATHS.forgotPassword}
									className="text-xs font-medium text-primary hover:underline"
								>
									Forgot password?
								</Link>
							</div>
							<FormControl>
								<div className="relative">
									<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password"
										autoComplete="current-password"
										className="h-11 pl-9 pr-10"
										{...field}
									/>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										className={cn(
											"absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										)}
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
									>
										{showPassword ? (
											<EyeOff className="size-4" />
										) : (
											<Eye className="size-4" />
										)}
									</button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					className="h-11 w-full text-sm font-semibold"
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Signing in…
						</>
					) : (
						"Sign in"
					)}
				</Button>

				<p className="pt-1 text-center text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link
						href={AUTH_PATHS.signUp}
						className="font-medium text-primary hover:underline"
					>
						Create account
					</Link>
				</p>
			</form>
		</Form>
	);
}
