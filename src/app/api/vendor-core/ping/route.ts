import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Quick probe that the vendor-core API segment is mounted. */
export async function GET() {
	return NextResponse.json({
		ok: true,
		upstream: (
			process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL ?? "http://localhost:8010"
		).replace(/\/$/, ""),
	});
}
