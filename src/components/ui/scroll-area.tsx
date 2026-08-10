"use client";

import * as React from "react";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

function ScrollArea({
	className,
	children,
	scrollbarClassName,
	thumbClassName,
	viewportClassName,
	viewportRef,
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
	scrollbarClassName?: string;
	thumbClassName?: string;
	viewportClassName?: string;
	viewportRef?: React.Ref<HTMLDivElement>;
}) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			className={cn("relative overflow-hidden", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				ref={viewportRef}
				className={cn(
					"size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
					"[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
					viewportClassName ?? "[&>div]:!block [&>div]:min-w-0"
				)}
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar
				orientation="vertical"
				className={scrollbarClassName}
				thumbClassName={thumbClassName}
			/>
			<ScrollBar
				orientation="horizontal"
				className={cn("z-10 flex h-2.5 flex-col", scrollbarClassName)}
				thumbClassName={thumbClassName}
			/>
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = "vertical",
	thumbClassName,
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
	thumbClassName?: string;
}) {
	return (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			className={cn(
				"flex touch-none p-px transition-colors select-none",
				orientation === "vertical" &&
					"h-full w-2 border-l border-l-transparent",
				orientation === "horizontal" &&
					"h-2 flex-col border-t border-t-transparent",
				className
			)}
			{...props}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb
				data-slot="scroll-area-thumb"
				className={cn("relative flex-1 rounded-full bg-border", thumbClassName)}
			/>
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	);
}

export { ScrollArea, ScrollBar };
