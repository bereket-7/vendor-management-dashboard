import Image from "next/image";
import type { ReactNode } from "react";

import { siteConfig } from "@/constants/siteconfig";
import { cn } from "@/lib/utils";

const AUTH_PRODUCT_TITLE = "Eligibility Operations Dashboard";

type AuthShellProps = {
	children: ReactNode;
	className?: string;
};

/**
 * Auth layout — brand plane + decorated form column.
 */
export function AuthShell({ children, className }: AuthShellProps) {
	return (
		<div
			className={cn(
				"relative grid min-h-svh w-full bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]",
				className
			)}
		>
			<aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-11 xl:px-14 xl:py-12">
				{/* Base gradient */}
				<div
					aria-hidden
					className="absolute inset-0 bg-[linear-gradient(155deg,oklch(0.43_0.07_247)_0%,oklch(0.33_0.085_248)_42%,oklch(0.25_0.06_250)_100%)] dark:bg-[linear-gradient(155deg,oklch(0.34_0.075_247)_0%,oklch(0.26_0.08_248)_45%,oklch(0.18_0.06_250)_100%)]"
				/>
				{/* Soft highlight */}
				<div
					aria-hidden
					className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,oklch(1_0_0/0.16),transparent_42%)] dark:bg-[radial-gradient(ellipse_at_18%_12%,oklch(1_0_0/0.1),transparent_45%)]"
				/>
				{/* Angled plane */}
				<div
					aria-hidden
					className="absolute -right-[18%] top-[-10%] h-[130%] w-[58%] rotate-[-12deg] bg-sidebar-foreground/[0.04]"
				/>
				{/* Edge line */}
				<div
					aria-hidden
					className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sidebar-foreground/20 to-transparent"
				/>
				{/* Quiet geometry */}
				<div
					aria-hidden
					className="absolute bottom-[-18%] left-[-22%] size-[34rem] rounded-full border border-sidebar-foreground/[0.08]"
				/>
				<div
					aria-hidden
					className="absolute top-[12%] right-[-12%] size-[22rem] rounded-full border border-sidebar-foreground/[0.06]"
				/>
				{/* Oversized watermark */}
				<p
					aria-hidden
					className="pointer-events-none absolute -bottom-10 -right-4 select-none font-[family-name:var(--font-poppins)] text-[14rem] font-semibold leading-none tracking-tighter text-sidebar-foreground/[0.05]"
				>
					T
				</p>

				{/* Main brand block — vertically centered, left-aligned */}
				<div className="relative z-10 flex flex-1 flex-col justify-center">
					<div className="max-w-lg space-y-8">
						<div className="space-y-5">
							<p className="font-[family-name:var(--font-poppins)] text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-tight text-sidebar-foreground">
								{AUTH_PRODUCT_TITLE}
							</p>
							<div className="flex items-center gap-4">
								<span className="h-px w-14 bg-sidebar-foreground/40" />
								<span className="text-[12px] font-medium tracking-[0.2em] text-sidebar-foreground/60 uppercase">
									Enterprise access
								</span>
							</div>
						</div>
						<p className="max-w-sm text-[15px] leading-7 text-sidebar-foreground/75">
							One workspace for vendors, files, and claims.
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="relative z-10 shrink-0 flex items-end justify-between gap-6 pt-8">
					<p className="text-[11px] tracking-wide text-sidebar-foreground/45">
						© {new Date().getFullYear()} {siteConfig.appPublisher}
					</p>
					<div className="flex gap-1.5" aria-hidden>
						<span className="size-1.5 rounded-full bg-sidebar-foreground/35" />
						<span className="size-1.5 rounded-full bg-sidebar-foreground/20" />
						<span className="size-1.5 rounded-full bg-sidebar-foreground/10" />
					</div>
				</div>
			</aside>

			<main className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
				{/* Form-side atmosphere */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.376_0.086_247.6/0.07),transparent_55%)]"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,oklch(0.376_0.086_247.6/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.376_0.086_247.6/0.04)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute top-10 right-10 hidden h-24 w-24 border border-primary/20 lg:block"
				>
					<div className="absolute top-0 left-0 size-2 bg-primary" />
					<div className="absolute right-0 bottom-0 size-2 bg-primary/60" />
				</div>
				<div
					aria-hidden
					className="pointer-events-none absolute bottom-12 left-8 hidden h-px w-28 bg-primary/25 lg:block"
				/>

				<div className="relative mx-auto w-full max-w-[26rem]">
					<div className="mb-10 flex items-center gap-3 lg:hidden">
						<Image
							src="/images/unnamed.webp"
							alt=""
							width={32}
							height={32}
							className="size-8 rounded-full object-cover"
							priority
						/>
						<span className="font-[family-name:var(--font-poppins)] text-sm font-semibold leading-snug tracking-tight">
							{AUTH_PRODUCT_TITLE}
						</span>
					</div>
					{children}
				</div>
			</main>
		</div>
	);
}
