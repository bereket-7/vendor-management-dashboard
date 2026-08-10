import type { ReactNode } from "react";

export function GeneralShell({ children }: { children: ReactNode }) {
	return (
		<main className="w-full flex-1 px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
			<div className="mx-auto w-full max-w-[1600px]">{children}</div>
		</main>
	);
}
