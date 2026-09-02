export type DemoAccountSpec = {
	account_code: string;
	name: string;
	line_of_business: string;
	active: boolean;
	health_score: number;
	eligibility_feed_status: "success" | "warning" | "error" | "none";
	medical_feed_status: "success" | "warning" | "error" | "none";
	pharmacy_feed_status: "success" | "warning" | "error" | "none";
	accumulator_feed_status: "success" | "warning" | "error" | "none";
};

/** Demo account rows — mirrors `scripts/seed-vendor-detail-demo.mjs`. */
export function demoAccountSpecsForVendor(vendorCode: string): DemoAccountSpec[] {
	const code = (vendorCode || "demo").toUpperCase();
	return [
		{
			account_code: `${code}-1001`,
			name: "Alpha Benefits Group",
			line_of_business: "commercial",
			active: true,
			health_score: 92,
			eligibility_feed_status: "success",
			medical_feed_status: "success",
			pharmacy_feed_status: "success",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-1002`,
			name: "Beta Health Partners",
			line_of_business: "medicare",
			active: true,
			health_score: 90,
			eligibility_feed_status: "success",
			medical_feed_status: "success",
			pharmacy_feed_status: "none",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-1003`,
			name: "Cascade Care Network",
			line_of_business: "medicaid",
			active: true,
			health_score: 72,
			eligibility_feed_status: "warning",
			medical_feed_status: "success",
			pharmacy_feed_status: "warning",
			accumulator_feed_status: "none",
		},
		{
			account_code: `${code}-1004`,
			name: "Delta Employer Trust",
			line_of_business: "marketplace",
			active: false,
			health_score: 40,
			eligibility_feed_status: "error",
			medical_feed_status: "none",
			pharmacy_feed_status: "none",
			accumulator_feed_status: "none",
		},
	];
}
