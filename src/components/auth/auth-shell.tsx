import type { ReactNode } from "react";

import Image from "next/image";

import { siteConfig } from "@/constants/siteconfig";
import { cn } from "@/lib/utils";

type AuthShellProps = {
	children: ReactNode;
	className?: string;
};

/**
 * Full-viewport auth chrome: brand panel + form panel.
 * Shared by login, sign-up, and forgot-password.
 */
export function AuthShell({ children, className }: AuthShellProps) {
	return (
		<div
			className={cn(
				"relative flex min-h-svh w-full overflow-hidden bg-background",
				className
			)}
		>
			{/* Atmosphere */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.376_0.086_247.6/0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.55_0.06_200/0.08),transparent_50%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]"
			/>

			{/* Brand panel */}
			<aside className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden bg-primary px-10 py-10 text-primary-foreground lg:flex xl:w-[48%] xl:px-14">
				<div
					aria-hidden
					className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl"
				/>
				<div
					aria-hidden
					className="absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-3xl"
				/>
				<div
					aria-hidden
					className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"
				/>

				<div className="relative z-10 flex items-center gap-3">
					<Image
						src="/images/unnamed.webp"
						alt=""
						width={40}
						height={40}
						className="size-10 rounded-full object-cover ring-2 ring-white/25"
						priority
					/>
					<p className="truncate text-lg font-semibold tracking-tight">
						{siteConfig.name}
					</p>
				</div>

				<div className="relative z-10 max-w-md space-y-5 animate-in fade-in slide-in-from-left-2 duration-700">
					<h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[2.75rem]">
						{siteConfig.name}
					</h1>
					<p className="text-base leading-relaxed text-primary-foreground/80">
						Secure access to vendor operations, file intake, and claims
						workflows — built for enterprise teams.
					</p>
					<ul className="space-y-2.5 pt-2 text-sm text-primary-foreground/75">
						<li className="flex items-start gap-2.5">
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-foreground/80" />
							Vendor onboarding, contracts, and compliance in one place
						</li>
						<li className="flex items-start gap-2.5">
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-foreground/80" />
							Real-time file monitoring and intake visibility
						</li>
						<li className="flex items-start gap-2.5">
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-foreground/80" />
							Claims & encounters operations for trading partners
						</li>
					</ul>
				</div>

				<p className="relative z-10 text-xs text-primary-foreground/55">
					© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
				</p>
			</aside>

			{/* Form panel */}
			<main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
				<div className="mb-8 flex w-full max-w-[420px] items-center gap-3 lg:hidden animate-in fade-in duration-500">
					<Image
						src="/images/unnamed.webp"
						alt=""
						width={36}
						height={36}
						className="size-9 rounded-full object-cover"
						priority
					/>
					<p className="truncate text-base font-semibold tracking-tight">
						{siteConfig.name}
					</p>
				</div>

				<div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-2 duration-500">
					{children}
				</div>
			</main>
		</div>
	);
}
