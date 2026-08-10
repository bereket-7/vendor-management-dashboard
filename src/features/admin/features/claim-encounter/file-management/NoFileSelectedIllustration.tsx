export function NoFileSelectedIllustration({
	variant = "idle",
	title,
	description,
}: {
	variant?: "idle" | "empty";
	title?: string;
	description?: string;
}) {
	const isEmpty = variant === "empty";
	const heading =
		title ?? (isEmpty ? "No Results to Display" : "No file selected");
	const body =
		description ??
		(isEmpty
			? "Adjust your filters and click Search to load matching records."
			: "Enter an inbound file name or apply filters, then click Search.");

	return (
		<div className="flex flex-col items-center justify-center px-6 py-14 text-center">
			<svg
				width="168"
				height="132"
				viewBox="0 0 168 132"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="mb-5"
				aria-hidden
			>
				<ellipse cx="84" cy="118" rx="52" ry="8" fill="currentColor" className="text-primary/10" />
				<path
					d="M36 34h72l14 16v58a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V40a6 6 0 0 1 6-6Z"
					fill="currentColor"
					className="text-primary/15"
				/>
				<path
					d="M108 34v16h14L108 34Z"
					fill="currentColor"
					className="text-primary/25"
				/>
				<rect x="44" y="58" width="56" height="6" rx="3" fill="currentColor" className="text-primary/20" />
				<rect x="44" y="72" width="40" height="6" rx="3" fill="currentColor" className="text-primary/15" />
				<rect x="44" y="86" width="48" height="6" rx="3" fill="currentColor" className="text-primary/15" />
				<circle cx="118" cy="46" r="22" fill="white" stroke="currentColor" strokeWidth="2" className="text-primary/30" />
				{isEmpty ? (
					<>
						<circle cx="118" cy="46" r="10" fill="currentColor" className="text-red-500/15" />
						<circle cx="115" cy="43" r="1.2" fill="currentColor" className="text-red-500/70" />
						<circle cx="121" cy="43" r="1.2" fill="currentColor" className="text-red-500/70" />
						<path d="M113 51c2-3 4-3 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-500/70" />
					</>
				) : (
					<>
						<path d="M110 46h16M118 38v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
						<path d="M128 58l10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary/60" />
					</>
				)}
			</svg>
			<p
				className={
					isEmpty
						? "text-base font-bold text-red-600"
						: "text-base font-semibold text-primary"
				}
			>
				{heading}
			</p>
			<p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
		</div>
	);
}
