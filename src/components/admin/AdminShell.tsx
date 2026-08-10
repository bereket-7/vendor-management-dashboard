"use client";

import { useEffect } from "react";

import { GeneralShell } from "@/components/shared/Wrappers/GeneralShell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAdminKeyboardShortcuts } from "@/hooks/useAdminKeyboardShortcuts";

import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { CommandPalette } from "./CommandPalette";
import { OfflineBanner } from "./OfflineBanner";
import {
	VendorCoreAuthBanner,
	VendorCoreSessionProvider,
} from "@/components/vendor-core/VendorCoreGate";

type AdminShellProps = {
	children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
	useAdminKeyboardShortcuts();

	useEffect(() => {
		const html = document.documentElement;
		const body = document.body;
		const prevHtmlOverflow = html.style.overflow;
		const prevBodyOverflow = body.style.overflow;
		html.style.overflow = "hidden";
		body.style.overflow = "hidden";
		return () => {
			html.style.overflow = prevHtmlOverflow;
			body.style.overflow = prevBodyOverflow;
		};
	}, []);

	return (
		<VendorCoreSessionProvider>
			<SidebarProvider defaultOpen className="h-svh max-h-svh overflow-hidden">
				<AdminSidebar />
				{/* Fixed viewport shell — pages scroll inside Radix ScrollArea only */}
				<SidebarInset className="flex h-svh max-h-svh min-h-0 min-w-0 flex-col overflow-hidden">
					<OfflineBanner />
					<VendorCoreAuthBanner />
					<AdminHeader />
					<ScrollArea
						className="min-h-0 flex-1"
						scrollbarClassName="w-1.5"
						thumbClassName="bg-foreground/15 hover:bg-foreground/25"
					>
						<GeneralShell>{children}</GeneralShell>
					</ScrollArea>
				</SidebarInset>
				<CommandPalette />
			</SidebarProvider>
		</VendorCoreSessionProvider>
	);
}
